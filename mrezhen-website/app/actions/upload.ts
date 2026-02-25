'use server'

import cloudinary from "@/lib/cloudinary"
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function moderateImage(url: string): Promise<{ safe: boolean; reason: string }> {
  try {
    // llama-guard-3-11b-vision is a dedicated safety model.
    // It returns plain text: "safe" OR "unsafe\n<category_code>"
    // It does NOT refuse to analyze inappropriate images — that's exactly what it's built for.
    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-guard-3-11b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url } },
            { type: "text", text: "Evaluate the safety of this image." },
          ],
        },
      ],
      max_completion_tokens: 20,
    })

    const text = (response.choices[0].message.content ?? "").trim().toLowerCase()
    if (text.startsWith("unsafe")) {
      // Extract category code if present (e.g. "unsafe\nS1" → "S1")
      const categoryMatch = text.match(/\n(.+)/)
      const category = categoryMatch ? categoryMatch[1].trim().toUpperCase() : "policy violation"
      return { safe: false, reason: `Inappropriate content detected (${category})` }
    }
    return { safe: true, reason: "" }
  } catch (err) {
    // Fail CLOSED — if the moderation check itself errors, block the image to be safe
    console.error("Moderation check failed:", err)
    return { safe: false, reason: "Could not verify image safety — upload blocked" }
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

    // 1. Upload to Cloudinary to get a public URL
    const secureUrl = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "hivemind-uploads", resource_type: "auto" },
        (error, result: any) => {
          if (error) reject(error)
          else resolve(result!.secure_url)
        }
      ).end(buffer)
    })

    // 2. Run content moderation via Groq vision
    const { safe, reason } = await moderateImage(secureUrl)
    if (!safe) {
      // Extract public_id and delete from Cloudinary
      const urlPath = new URL(secureUrl).pathname
      const publicId = urlPath.replace(/^\/[^/]+\//, "").replace(/\.[^.]+$/, "")
      await cloudinary.uploader.destroy(publicId).catch(() => {})
      throw new Error(`Image rejected: ${reason}`)
    }

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