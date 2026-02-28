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

/** XP per difficulty for daily battle quests */
const DAILY_QUEST_XP = 50

// 1. Submit a daily quest (proof)

export async function submitDailyQuest(input: {
  battleId: string
  day: number
  description: string
  proofText?: string
  proofImageUrl?: string
}) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Unauthorized" }

  // Validate day
  if (input.day < 1 || input.day > 7) {
    return { error: "Day must be between 1 and 7" }
  }

  const description = input.description.trim()
  if (!description || description.length > 500) {
    return { error: "Description is required (max 500 chars)" }
  }

  // Load battle
  const battle = await prisma.battle.findUnique({ where: { id: input.battleId } })
  if (!battle) return { error: "Battle not found" }
  if (battle.status !== "ACTIVE") return { error: "Battle is not active" }

  // Must be a participant
  if (battle.challengerId !== userId && battle.challengedId !== userId) {
    return { error: "Not a participant" }
  }

  // Ensure battle hasn't expired
  if (battle.endDate && new Date() > battle.endDate) {
    return { error: "Battle has ended" }
  }

  // Validate that the day corresponds to the correct battle day
  if (battle.startDate) {
    const battleStart = new Date(battle.startDate)
    const now = new Date()
    const daysSinceStart = Math.floor(
      (now.getTime() - battleStart.getTime()) / (1000 * 60 * 60 * 24)
    )
    const currentDay = daysSinceStart + 1 // 1-indexed

    if (input.day > currentDay) {
      return { error: "Cannot submit a quest for a future day" }
    }
    if (input.day > 7) {
      return { error: "Battle only lasts 7 days" }
    }
  }

  // Check for existing submission (upsert pattern with unique constraint)
  const existing = await prisma.battleDailyQuest.findUnique({
    where: {
      battleId_userId_day: {
        battleId: input.battleId,
        userId,
        day: input.day,
      },
    },
  })

  if (existing && existing.submittedAt) {
    return { error: "Quest already submitted for this day" }
  }

  const proofText = input.proofText?.trim() ?? null
  if (proofText && proofText.length > 2000) {
    return { error: "Proof text too long (max 2000 chars)" }
  }

  // Upsert: create if not exists, update if exists but not submitted
  const quest = await prisma.battleDailyQuest.upsert({
    where: {
      battleId_userId_day: {
        battleId: input.battleId,
        userId,
        day: input.day,
      },
    },
    create: {
      battleId: input.battleId,
      userId,
      day: input.day,
      description,
      proofText,
      proofImageUrl: input.proofImageUrl ?? null,
      submittedAt: new Date(),
    },
    update: {
      description,
      proofText,
      proofImageUrl: input.proofImageUrl ?? null,
      submittedAt: new Date(),
    },
  })

  revalidatePath("/messages")
  return { success: true, data: quest }
}

// 2. Verify opponent's daily quest

export async function verifyDailyQuest(input: {
  questId: string
  verdict: "APPROVED" | "REJECTED"
}) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Unauthorized" }

  if (!["APPROVED", "REJECTED"].includes(input.verdict)) {
    return { error: "Invalid verdict" }
  }

  const quest = await prisma.battleDailyQuest.findUnique({
    where: { id: input.questId },
    include: { battle: true },
  })

  if (!quest) return { error: "Quest not found" }

  const battle = quest.battle

  // Must be the OTHER participant (verifier is the opponent)
  if (battle.challengerId !== userId && battle.challengedId !== userId) {
    return { error: "Not a participant" }
  }
  if (quest.userId === userId) {
    return { error: "Cannot verify your own quest" }
  }

  if (battle.status !== "ACTIVE") return { error: "Battle is not active" }
  if (!quest.submittedAt) return { error: "Quest has not been submitted yet" }
  if (quest.verification !== "PENDING") return { error: "Quest already verified" }

  // Determine XP to award
  const xp = input.verdict === "APPROVED" ? DAILY_QUEST_XP : 0

  // Use transaction to prevent race conditions on XP
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update quest verification
      await tx.battleDailyQuest.update({
        where: { id: input.questId },
        data: {
          verification: input.verdict,
          xpAwarded: xp,
          verifiedAt: new Date(),
          verifiedById: userId,
        },
      })

      if (input.verdict === "APPROVED") {
        // 2. Update battle-scoped XP
        const xpField =
          quest.userId === battle.challengerId ? "challengerXP" : "challengedXP"

        await tx.battle.update({
          where: { id: battle.id },
          data: { [xpField]: { increment: xp } },
        })

        // 3. Log activity (battle-scoped, NOT yet applied to global score)
        await tx.activityLog.create({
          data: {
            userId: quest.userId,
            action: "BATTLE_QUEST_APPROVED",
            xpGained: xp,
          },
        })
      }
    })

    revalidatePath("/messages")
    return { success: true, xpAwarded: xp }
  } catch (error) {
    console.error("Failed to verify quest:", error)
    return { error: "Failed to verify quest" }
  }
}

// 3. Get daily quests for a battle

export async function getBattleDailyQuests(battleId: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Unauthorized", data: [] }

  const battle = await prisma.battle.findUnique({ where: { id: battleId } })
  if (!battle) return { error: "Battle not found", data: [] }

  if (battle.challengerId !== userId && battle.challengedId !== userId) {
    return { error: "Not a participant", data: [] }
  }

  const quests = await prisma.battleDailyQuest.findMany({
    where: { battleId },
    orderBy: [{ day: "asc" }, { userId: "asc" }],
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
    },
  })

  return { data: quests, currentUserId: userId }
}

// 4. Get current battle day

export async function getBattleCurrentDay(battleId: string) {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    select: { startDate: true, endDate: true, status: true },
  })

  if (!battle || !battle.startDate) return { day: 0, isActive: false }

  const now = new Date()
  if (battle.status !== "ACTIVE" || now > (battle.endDate ?? now)) {
    return { day: 0, isActive: false }
  }

  const daysSinceStart = Math.floor(
    (now.getTime() - battle.startDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  return { day: Math.min(daysSinceStart + 1, 7), isActive: true }
}

// 5. AI-generated battle quest (only for the requesting user)

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000'

export async function generateAiBattleQuest(input: {
  battleId: string
  day: number
}) {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Unauthorized" }

  if (input.day < 1 || input.day > 7) {
    return { error: "Day must be between 1 and 7" }
  }

  // Load battle with goal
  const battle = await prisma.battle.findUnique({ where: { id: input.battleId } })
  if (!battle) return { error: "Battle not found" }
  if (battle.status !== "ACTIVE") return { error: "Battle is not active" }

  // Must be a participant
  if (battle.challengerId !== userId && battle.challengedId !== userId) {
    return { error: "Not a participant" }
  }

  // Check if already submitted for this day
  const existing = await prisma.battleDailyQuest.findUnique({
    where: {
      battleId_userId_day: {
        battleId: input.battleId,
        userId,
        day: input.day,
      },
    },
  })

  if (existing && existing.submittedAt) {
    return { error: "Quest already submitted for this day" }
  }

  // Fetch previous quests for this user in this battle (to avoid repeats)
  const previousQuests = await prisma.battleDailyQuest.findMany({
    where: {
      battleId: input.battleId,
      userId,
      day: { lt: input.day },
    },
    select: { description: true },
    orderBy: { day: "asc" },
  })

  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/generate-battle-quest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goalDescription: battle.goalDescription,
        currentDay: input.day,
        totalDays: 7,
        previousQuests: previousQuests.map(q => q.description),
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return { error: "Failed to generate quest" }
    }

    const data = await response.json()
    const questDescription = data.quest || `Work on: ${battle.goalDescription.slice(0, 100)}`

    // Upsert the quest for THIS user only (not the opponent)
    const quest = await prisma.battleDailyQuest.upsert({
      where: {
        battleId_userId_day: {
          battleId: input.battleId,
          userId,
          day: input.day,
        },
      },
      create: {
        battleId: input.battleId,
        userId,
        day: input.day,
        description: questDescription,
      },
      update: {
        description: questDescription,
      },
    })

    revalidatePath("/messages")
    return { success: true, data: quest }
  } catch (error) {
    console.error("AI quest generation failed:", error)
    return { error: "Failed to generate quest. Is the AI service running?" }
  }
}
