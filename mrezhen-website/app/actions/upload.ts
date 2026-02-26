'use server'

import cloudinary from "@/lib/cloudinary"
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

/**
 * Explicit anatomical/sexual keywords that are unambiguously NSFW.
 * Kept narrow on purpose — common words like "breast", "naked", "skin"
 * appear in legitimate descriptions (beach, medical, art) and cause false positives.
 */
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
 * Moderate an image using Groq vision BEFORE uploading to Cloudinary.
 * Asks the model to describe the image, then scans for explicit keywords.
 * Using description (not YES/NO) because the model is more likely to
 * name anatomical parts when describing than when asked a binary question.
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

    // If the model explicitly says it cannot describe (strongly suggests explicit content)
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

    // Groq actively rejects the image via content policy → block it
    const isContentRejection =
      err?.status === 400 ||
      err?.code === "failed_generation" ||
      err?.message?.toLowerCase().includes("content") ||
      err?.message?.toLowerCase().includes("policy") ||
      err?.message?.toLowerCase().includes("safety")

    if (isContentRejection) {
      return { safe: false, reason: "Image rejected by content policy" }
    }

    // Genuine infra failure (network, auth, etc.) → let image through
    return { safe: true, reason: "" }
  }
}

export async function uploadImages(formData: FormData) {
  const files = formData.getAll("file") as File[]

  if (!files || files.length === 0) {
    return { error: "No files provided" }
  }

  const uploadPromises = files.map(async (file) => {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    const mimeType = file.type || "image/jpeg"

    // 1. Moderate with Groq FIRST (using base64 — no URL needed)
    const { safe, reason } = await moderateImage(buffer, mimeType)
    if (!safe) {
      throw new Error(`Image rejected: ${reason}`)
    }

    // 2. Only upload to Cloudinary if moderation passed
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