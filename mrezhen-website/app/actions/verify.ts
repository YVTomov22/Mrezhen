'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { completeTaskAndAwardXP } from "./game"

const AI_JUDGE_URL = process.env.AI_JUDGE_URL || "http://127.0.0.1:1234"

export async function verifyTaskWithAI(
  taskId: string, 
  imageUrls: string[], 
  userComment: string
) {
  // Fetch task details
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, content: true }
  })

  if (!task) return { error: "Task not found" }

  // Prepare form data for AI backend
  const formData = new FormData()
  
  const taskPayload = JSON.stringify({
    id: 123, // Dummy ID
    title: task.content, 
    description: "User submitted proof for this task."
  })

  formData.append("task", taskPayload)
  formData.append("image_urls", JSON.stringify(imageUrls))
  formData.append("user_text", userComment)

  try {
    // Call AI backend
    const response = await fetch(`${AI_JUDGE_URL}/evaluate`, {
      method: "POST",
      body: formData,
      cache: "no-store"
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("AI Backend Error:", text)
      return { error: "AI Service unavailable or rejected request." }
    }

    const result = await response.json()

    // Process result
    if (result.is_completed) {

      await completeTaskAndAwardXP(taskId)
      
      revalidatePath("/dashboard")
      revalidatePath("/goals")
      return { success: true, reason: result.reason }
    } else {
      return { success: false, reason: result.reason }
    }

  } catch (error) {
    console.error("Verification failed:", error)
    return { error: "Failed to connect to AI judge." }
  }
}