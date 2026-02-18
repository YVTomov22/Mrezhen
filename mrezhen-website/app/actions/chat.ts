'use server'

import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const DELETE_DM_CONFIRMATION = "DELETE"

async function getCurrentUserId() {
    const session = await auth()
    if (!session?.user?.email) return null

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    })

    return user?.id ?? null
}

function sanitizeContent(content: string) {
    return content.trim()
}

export async function sendMessage(receiverId: string, content: string, attachmentUrls: string[] = []) {
        return createDMMessage({ receiverId, content, attachmentUrls })
}

export async function createDMMessage(input: {
    receiverId: string
    content: string
    attachmentUrls?: string[]
}) {
    const senderId = await getCurrentUserId()
    if (!senderId) return { error: "Unauthorized" }

    const cleanedContent = sanitizeContent(input.content)
    const urls = input.attachmentUrls ?? []
    if (!cleanedContent && urls.length === 0) {
        return { error: "Message cannot be empty" }
    }

    if (cleanedContent.length > 5000) {
        return { error: "Message is too long" }
    }

    if (input.receiverId === senderId) {
        return { error: "Cannot send message to yourself" }
    }

    const receiver = await prisma.user.findUnique({
        where: { id: input.receiverId },
        select: { id: true },
    })

    if (!receiver) return { error: "Receiver not found" }

    try {
        const created = await prisma.message.create({
            data: {
                senderId,
                receiverId: input.receiverId,
                content: cleanedContent,
                attachments: {
                    create: urls.map((url) => ({ url })),
                },
            },
            include: {
                attachments: true,
            },
        })

        revalidatePath("/messages")
        return { success: true, message: created }
    } catch {
        return { error: "Failed to send" }
    }
}

export async function getDMMessages(otherUserId: string) {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return { messages: [], currentUserId: "" }

    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: currentUserId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: currentUserId },
            ],
        },
        orderBy: { createdAt: 'asc' },
        include: {
            sender: { select: { name: true, image: true } },
            receiver: { select: { name: true, image: true } },
            attachments: true,
        },
    })

    return { messages, currentUserId }
}

export async function getMessages(otherUserId: string) {
    return getDMMessages(otherUserId)
}

export async function updateDMMessage(messageId: string, newContent: string) {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) return { error: "Unauthorized" }

    const cleanedContent = sanitizeContent(newContent)
    if (!cleanedContent) return { error: "Message cannot be empty" }
    if (cleanedContent.length > 5000) return { error: "Message is too long" }

    const message = await prisma.message.findUnique({ where: { id: messageId } })
    if (!message || message.senderId != currentUserId) return { error: "Unauthorized" }

    await prisma.message.update({
        where: { id: messageId },
        data: { content: cleanedContent },
    })

    revalidatePath("/messages")
    return { success: true }
}

export async function getUsersToChatWith(specificUsername?: string) {
    const session = await auth()
    if (!session?.user?.email) return []

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
    })

    if (!currentUser) return []

    // 1. Base Query: Get all other users (In a real app, this might be 'friends' or 'recent chats')
    const users = await prisma.user.findMany({
        where: {
            id: { not: currentUser.id }
        },
        select: {
            id: true,
            name: true,
            username: true,
            image: true,
            email: true
        },
        take: 50 // Optional limit
    })

    // 2. If a specific user is requested via URL, ensure they are in the list
    if (specificUsername) {
        const targetUser = await prisma.user.findUnique({
            where: { username: specificUsername },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                email: true
            }
        })

        // If found and not already in the list (and not self), add to top
        if (targetUser && targetUser.id !== currentUser.id) {
            const alreadyExists = users.some(u => u.id === targetUser.id)
            if (!alreadyExists) {
                users.unshift(targetUser) 
            }
        }
    }

    return users
}

export async function editMessage(messageId: string, newContent: string) {
  return updateDMMessage(messageId, newContent)
}

export async function deleteDMMessage(messageId: string, confirmationText: string) {
  const currentUserId = await getCurrentUserId()
  if (!currentUserId) return { error: "Unauthorized" }

  if (confirmationText.trim().toUpperCase() !== DELETE_DM_CONFIRMATION) {
    return { error: `Type ${DELETE_DM_CONFIRMATION} to confirm` }
  }

  const message = await prisma.message.findUnique({ where: { id: messageId } })
  if (!message || message.senderId !== currentUserId) return { error: "Unauthorized" }

  await prisma.message.delete({ where: { id: messageId } })
  revalidatePath("/messages")
  return { success: true }
}

export async function deleteMessage(messageId: string, confirmationText = "") {
  return deleteDMMessage(messageId, confirmationText)
}