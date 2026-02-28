'use server'

import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Helpers

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  return user?.id ?? null
}

/** Ensure caller is a participant in the given battle. */
function isParticipant(battle: { challengerId: string; challengedId: string }, userId: string) {
  return battle.challengerId === userId || battle.challengedId === userId
}

/** Return the opponent's userId given a battle and the current user. */
function getOpponentId(battle: { challengerId: string; challengedId: string }, userId: string) {
  return battle.challengerId === userId ? battle.challengedId : battle.challengerId
}

// 1. Challenge — initiate a battle inside a DM

export async function initiateBattle(input: {
  challengedUserId: string
  challengerMilestoneId?: string
  goalDescription: string
}) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Unauthorized" }

  if (userId === input.challengedUserId) {
    return { error: "Cannot battle yourself" }
  }

  const goalDesc = input.goalDescription.trim()
  if (!goalDesc || goalDesc.length > 500) {
    return { error: "Goal description is required (max 500 chars)" }
  }

  // Verify the challenged user exists
  const challenged = await prisma.user.findUnique({
    where: { id: input.challengedUserId },
    select: { id: true },
  })
  if (!challenged) return { error: "User not found" }

  // Verify there is an existing DM thread between users
  const dmExists = await prisma.message.findFirst({
    where: {
      OR: [
        { senderId: userId, receiverId: input.challengedUserId },
        { senderId: input.challengedUserId, receiverId: userId },
      ],
    },
    select: { id: true },
  })
  if (!dmExists) return { error: "You must have an existing DM conversation to start a battle" }

  // Prevent duplicate active battles between same pair
  const existingActive = await prisma.battle.findFirst({
    where: {
      status: { in: ["PENDING", "ACTIVE"] },
      OR: [
        { challengerId: userId, challengedId: input.challengedUserId },
        { challengerId: input.challengedUserId, challengedId: userId },
      ],
    },
  })
  if (existingActive) return { error: "An active battle already exists between you two" }

  // If milestone provided, verify ownership
  if (input.challengerMilestoneId) {
    const milestone = await prisma.milestone.findFirst({
      where: { id: input.challengerMilestoneId, userId },
    })
    if (!milestone) return { error: "Milestone not found or does not belong to you" }
  }

  const battle = await prisma.battle.create({
    data: {
      challengerId: userId,
      challengedId: input.challengedUserId,
      challengerMilestoneId: input.challengerMilestoneId ?? null,
      goalDescription: goalDesc,
    },
  })

  revalidatePath("/messages")
  return { success: true, data: battle }
}

// 2. Accept / Decline / Cancel a battle

export async function acceptBattle(battleId: string, challengedMilestoneId?: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Unauthorized" }

  const battle = await prisma.battle.findUnique({ where: { id: battleId } })
  if (!battle) return { error: "Battle not found" }
  if (battle.challengedId !== userId) return { error: "Only the challenged user can accept" }
  if (battle.status !== "PENDING") return { error: "Battle is not pending" }

  // If milestone provided, verify ownership
  if (challengedMilestoneId) {
    const milestone = await prisma.milestone.findFirst({
      where: { id: challengedMilestoneId, userId },
    })
    if (!milestone) return { error: "Milestone not found or does not belong to you" }
  }

  const now = new Date()
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + 7)

  const updated = await prisma.battle.update({
    where: { id: battleId },
    data: {
      status: "ACTIVE",
      challengedMilestoneId: challengedMilestoneId ?? null,
      startDate: now,
      endDate,
    },
  })

  revalidatePath("/messages")
  return { success: true, data: updated }
}

export async function declineBattle(battleId: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Unauthorized" }

  const battle = await prisma.battle.findUnique({ where: { id: battleId } })
  if (!battle) return { error: "Battle not found" }
  if (battle.challengedId !== userId) return { error: "Only the challenged user can decline" }
  if (battle.status !== "PENDING") return { error: "Battle is not pending" }

  await prisma.battle.update({
    where: { id: battleId },
    data: { status: "DECLINED" },
  })

  revalidatePath("/messages")
  return { success: true }
}

export async function cancelBattle(battleId: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Unauthorized" }

  const battle = await prisma.battle.findUnique({ where: { id: battleId } })
  if (!battle) return { error: "Battle not found" }
  if (battle.challengerId !== userId) return { error: "Only the challenger can cancel" }
  if (battle.status !== "PENDING") return { error: "Can only cancel pending battles" }

  await prisma.battle.update({
    where: { id: battleId },
    data: { status: "CANCELLED" },
  })

  revalidatePath("/messages")
  return { success: true }
}

// 3. Get battles (for a user)

export async function getUserBattles(statusFilter?: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Unauthorized", data: [] }

  const where: Record<string, unknown> = {
    OR: [{ challengerId: userId }, { challengedId: userId }],
  }

  if (statusFilter) {
    where.status = statusFilter.toUpperCase()
  }

  const battles = await prisma.battle.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      challenger: { select: { id: true, name: true, username: true, image: true } },
      challenged: { select: { id: true, name: true, username: true, image: true } },
      challengerMilestone: { select: { id: true, title: true } },
      challengedMilestone: { select: { id: true, title: true } },
      winner: { select: { id: true, name: true, username: true } },
      dailyQuests: {
        orderBy: { day: "asc" },
      },
    },
  })

  return { data: battles }
}

export async function getBattle(battleId: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Unauthorized" }

  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: {
      challenger: { select: { id: true, name: true, username: true, image: true } },
      challenged: { select: { id: true, name: true, username: true, image: true } },
      challengerMilestone: { select: { id: true, title: true, category: true } },
      challengedMilestone: { select: { id: true, title: true, category: true } },
      winner: { select: { id: true, name: true, username: true } },
      dailyQuests: {
        orderBy: [{ day: "asc" }, { userId: "asc" }],
      },
    },
  })

  if (!battle) return { error: "Battle not found" }
  if (!isParticipant(battle, userId)) return { error: "Not a participant" }

  return { data: battle, currentUserId: userId }
}

/** Get battles between two specific DM users (for chat panel). */
export async function getBattlesBetweenUsers(otherUserId: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Unauthorized", data: [] }

  const battles = await prisma.battle.findMany({
    where: {
      OR: [
        { challengerId: userId, challengedId: otherUserId },
        { challengerId: otherUserId, challengedId: userId },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      challenger: { select: { id: true, name: true, username: true, image: true } },
      challenged: { select: { id: true, name: true, username: true, image: true } },
      challengerMilestone: { select: { id: true, title: true } },
      challengedMilestone: { select: { id: true, title: true } },
      winner: { select: { id: true, name: true, username: true } },
      dailyQuests: true,
    },
  })

  return { data: battles, currentUserId: userId }
}
