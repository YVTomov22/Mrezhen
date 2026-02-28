'use server'

import { auth } from "@/app/auth"
import cloudinary from "@/lib/cloudinary"
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

/** Explicit NSFW keywords (kept narrow to avoid false positives). */
const EXPLICIT_KEYWORDS = [
  // Male genitalia
  "penis", "penile", "phallus", "phallic", "testicle", "scrotum", "foreskin",
  "erect penis", "male genitalia", "male genital",
  // Female genitalia
  "vagina", "vaginal", "vulva", "labia", "clitoris", "female genitalia",
  // Explicit acts
  "sex act", "sexual intercourse", "intercourse", "coitus", "copulat",
  "masturbat", "ejaculat", "orgasm", "penetrat",
  // Pornography
  "pornograph", "porn", "xxx",
  // Gore
  "dismember", "decapitat", "entrails", "intestine spill",
  // Hate
  "swastika",
]

/**
 * Moderate an image via Groq vision before uploading.
 * Describes the image and scans for explicit keywords.
 */
async function moderateImage(buffer: Uint8Array, mimeType: string): Promise<{ safe: boolean; reason: string }> {
  const base64 = Buffer.from(buffer).toString("base64")
  const dataUri = `data:${mimeType};base64,${base64}`

  try {
    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content:
            "You are a content safety classifier. Describe the image objectively and factually. " +
            "If the image contains explicit sexual content or genitalia, name the specific body parts visible using anatomical terms. " +
            "Do not be vague. If genitalia are visible, say so explicitly (e.g. 'the image shows a penis'). " +
            "If the image is safe, describe what you see normally.",
        },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUri } },
            {
              type: "text",
              text: "Describe what is shown in this image. If any genitalia or explicit sexual content is visible, name it specifically.",
            },
          ],
        },
      ],
      max_completion_tokens: 200,
    })

    const description = (response.choices[0].message.content ?? "").toLowerCase()
    console.log("[moderation] Image description:", description)

    // Scan description for explicit keywords
    const matchedKeyword = EXPLICIT_KEYWORDS.find((kw) => description.includes(kw))
    if (matchedKeyword) {
      console.log("[moderation] BLOCKED — matched keyword:", matchedKeyword)
      return { safe: false, reason: "Inappropriate content detected" }
    }

    // Model refused to describe (likely explicit)
    const hardRefusals = [
      "i cannot provide", "i can't provide", "i'm unable to",
      "i am unable to", "not able to describe", "cannot describe this",
      "against my guidelines", "violates my", "not appropriate to describe",
    ]
    const isHardRefusal = hardRefusals.some((p) => description.includes(p))
    if (isHardRefusal) {
      console.log("[moderation] BLOCKED — model hard-refused to describe image")
      return { safe: false, reason: "Image flagged as inappropriate" }
    }

    return { safe: true, reason: "" }
  } catch (err: any) {
    console.error("[moderation] Groq error:", err?.status, err?.message)

    // Groq content policy rejection — block
    const isContentRejection =
      err?.status === 400 ||
      err?.code === "failed_generation" ||
      err?.message?.toLowerCase().includes("content") ||
      err?.message?.toLowerCase().includes("policy") ||
      err?.message?.toLowerCase().includes("safety")

    if (isContentRejection) {
      return { safe: false, reason: "Image rejected by content policy" }
    }

    // Infra failure — let image through
    return { safe: true, reason: "" }
  }
}

export async function uploadImages(formData: FormData) {
  const session = await auth()
  if (!session?.user?.email) return { error: "Unauthorized" }

  const files = formData.getAll("file") as File[]

  if (!files || files.length === 0) {
    return { error: "No files provided" }
  }

  // Security: limit file count, size, and types
  const MAX_FILES = 10
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"]

  if (files.length > MAX_FILES) {
    return { error: `Maximum ${MAX_FILES} files allowed` }
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return { error: "File too large. Maximum 10 MB per file." }
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: `File type '${file.type}' is not allowed. Only images and videos are accepted.` }
    }
  }

  const uploadPromises = files.map(async (file) => {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    const mimeType = file.type || "image/jpeg"

    // Moderate with Groq first
    const { safe, reason } = await moderateImage(buffer, mimeType)
    if (!safe) {
      throw new Error(`Image rejected: ${reason}`)
    }

    // Upload to Cloudinary if moderation passed
    const secureUrl = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "hivemind-uploads", resource_type: "auto" },
        (error, result: any) => {
          if (error) reject(error)
          else resolve(result!.secure_url)
        }
      ).end(buffer)
    })

    return secureUrl
  })

  try {
    const urls = await Promise.all(uploadPromises)
    return { urls }
  } catch (error: any) {
    console.error("Upload error:", error)
    const message = error?.message?.startsWith("Image rejected")
      ? error.message
      : "One or more images failed to upload"
    return { error: message }
  }
}