'use server'

import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  return user?.id ?? null
}

// Get all sessions for the current user
export async function getAiChatSessions() {
  const userId = await getCurrentUserId()
  if (!userId) return []

  return prisma.aiChatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
  })
}

// Create a new session, return its id
export async function createAiChatSession() {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Unauthorized" }

  const session = await prisma.aiChatSession.create({
    data: { userId, title: "New Chat" },
    select: { id: true, title: true, updatedAt: true },
  })

  revalidatePath("/ai-chat")
  return { data: session }
}

// Rename a session
export async function renameAiChatSession(sessionId: string, title: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Unauthorized" }

  const trimmed = title.trim().slice(0, 100)
  if (!trimmed) return { error: "Title required" }

  await prisma.aiChatSession.updateMany({
    where: { id: sessionId, userId },
    data: { title: trimmed },
  })

  revalidatePath("/ai-chat")
  return { success: true }
}

// Delete a session
export async function deleteAiChatSession(sessionId: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Unauthorized" }

  await prisma.aiChatSession.deleteMany({
    where: { id: sessionId, userId },
  })

  revalidatePath("/ai-chat")
  return { success: true }
}

// Load messages for a session
export async function getAiChatMessages(sessionId: string) {
  const userId = await getCurrentUserId()
  if (!userId) return []

  const session = await prisma.aiChatSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  })
  if (!session) return []

  return prisma.aiChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      metadata: true,
      createdAt: true,
    },
  })
}

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000'

/** Ask the AI backend to generate a concise chat title from the user's message. */
async function generateChatTitle(message: string): Promise<string> {
  try {
    const res = await fetch(`${PYTHON_BACKEND_URL}/api/generate-title`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.title) return data.title.slice(0, 100)
    }
  } catch (e) {
    // Fallback on failure
  }
  return message.slice(0, 50) + (message.length > 50 ? '...' : '')
}

// Save a message to a session
export async function saveAiChatMessage(
  sessionId: string,
  role: string,
  content: string,
  metadata?: string
) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Unauthorized" }

  // Verify ownership
  const session = await prisma.aiChatSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true, title: true },
  })
  if (!session) return { error: "Session not found" }

  const msg = await prisma.aiChatMessage.create({
    data: { sessionId, role, content, metadata },
    select: { id: true },
  })

  // Auto-title: if session is still "New Chat" and this is a user message, generate AI title
  if (session.title === "New Chat" && role === "user" && content.trim()) {
    const title = await generateChatTitle(content.trim())
    await prisma.aiChatSession.update({
      where: { id: sessionId },
      data: { title },
    })
  } else {
    // Touch updatedAt
    await prisma.aiChatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    })
  }

  return { data: msg }
}
