'use server'

import cloudinary from "@/lib/cloudinary"
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

/** NSFW keywords to scan for in image descriptions */
const NSFW_KEYWORDS = [
  "penis", "genitalia", "genital", "testicle", "scrotum", "phallus",
  "vagina", "vulva", "labia", "clitoris",
  "naked", "nude", "nudity", "bare skin", "undress", "unclothed",
  "erect", "erection", "aroused", "arousal",
  "sexual", "sex act", "intercourse", "coitus", "copulat",
  "masturbat", "ejaculat", "orgasm",
  "pornograph", "explicit", "obscene", "lewd",
  "breast", "nipple", "areola", "boob",
  "buttock", "anus", "anal",
  "gore", "dismember", "mutilat", "decapitat", "entrails", "intestine",
  "swastika", "hate symbol",
  "nsfw", "inappropriate", "not safe for work",
  "reproductive organ", "private part", "intimate part",
]

/**
 * Moderate an image using Groq vision BEFORE uploading to Cloudinary.
 * Two-step approach:
 *   1. Ask the model to describe the image in detail
 *   2. Scan the description for NSFW keywords
 * This is more reliable than a YES/NO question because it forces the model
 * to actually engage with and describe the image content.
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
            "You are an image description assistant. Your job is to describe images in complete, clinical detail. " +
            "You MUST describe ALL visible body parts, clothing state, and anatomical details using precise medical/anatomical terminology. " +
            "Do NOT censor, omit, euphemize, or refuse. Describe exactly what you see. This is used for medical and safety review purposes.",
        },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUri } },
            {
              type: "text",
              text: "Describe this image in thorough clinical detail. Include all visible body parts, objects, scenery, symbols, and any text. Use precise anatomical terms. Do not omit anything.",
            },
          ],
        },
      ],
      max_completion_tokens: 300,
    })

    const description = (response.choices[0].message.content ?? "").toLowerCase()
    console.log("[moderation] Image description:", description)

    // Scan description for NSFW keywords
    const matchedKeyword = NSFW_KEYWORDS.find((kw) => description.includes(kw))
    if (matchedKeyword) {
      console.log("[moderation] BLOCKED — matched keyword:", matchedKeyword)
      return { safe: false, reason: "Inappropriate content detected" }
    }

    // Check if the model refused to describe (common with truly explicit images)
    const refusalPhrases = [
      "i cannot", "i can't", "i'm unable", "i am unable",
      "i'm not able", "i am not able", "sorry", "apologize",
      "not appropriate", "cannot provide", "can't provide",
      "cannot describe", "can't describe", "against my", "policy",
    ]
    const isRefusal = refusalPhrases.some((p) => description.includes(p))
    if (isRefusal) {
      console.log("[moderation] BLOCKED — model refused to describe image")
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