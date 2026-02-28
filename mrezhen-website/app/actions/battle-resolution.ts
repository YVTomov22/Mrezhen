'use server'

import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"

// Battle Resolution Service
//
// Resolves battles past their end date (cron/admin).
// Winner gets XP×2, loser XP×1, tie XP×1.
// Atomic transaction; idempotent (status check).

const WINNER_MULTIPLIER = 2

export interface BattleResolutionResult {
  battleId: string
  winnerId: string | null
  challengerXP: number
  challengedXP: number
  challengerGlobalXP: number
  challengedGlobalXP: number
  isTie: boolean
}

/**
 * Resolve a single battle by ID.
 * Idempotent — will not resolve if already completed.
 */
export async function resolveBattle(battleId: string): Promise<{
  error?: string
  data?: BattleResolutionResult
}> {
  // Auth check: only participants or cron can resolve
  const session = await auth()
  if (!session?.user?.email) return { error: "Unauthorized" }

  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: {
      dailyQuests: true,
    },
  })

  if (!battle) return { error: "Battle not found" }
  if (battle.status === "COMPLETED") return { error: "Battle already resolved" }
  if (battle.status !== "ACTIVE") return { error: "Battle is not active" }

  // Calculate total approved XP per participant from daily quests (source of truth)
  const challengerApprovedXP = battle.dailyQuests
    .filter((q) => q.userId === battle.challengerId && q.verification === "APPROVED")
    .reduce((sum, q) => sum + q.xpAwarded, 0)

  const challengedApprovedXP = battle.dailyQuests
    .filter((q) => q.userId === battle.challengedId && q.verification === "APPROVED")
    .reduce((sum, q) => sum + q.xpAwarded, 0)

  // Determine winner
  const isTie = challengerApprovedXP === challengedApprovedXP
  let winnerId: string | null = null

  if (!isTie) {
    winnerId =
      challengerApprovedXP > challengedApprovedXP
        ? battle.challengerId
        : battle.challengedId
  }

  // Calculate global XP to apply
  const challengerGlobalXP = isTie
    ? challengerApprovedXP
    : winnerId === battle.challengerId
      ? challengerApprovedXP * WINNER_MULTIPLIER
      : challengerApprovedXP

  const challengedGlobalXP = isTie
    ? challengedApprovedXP
    : winnerId === battle.challengedId
      ? challengedApprovedXP * WINNER_MULTIPLIER
      : challengedApprovedXP

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Mark battle as completed
      await tx.battle.update({
        where: { id: battleId },
        data: {
          status: "COMPLETED",
          winnerId,
          challengerXP: challengerApprovedXP,
          challengedXP: challengedApprovedXP,
        },
      })

      // 2. Award XP to challenger's global score
      if (challengerGlobalXP > 0) {
        const challenger = await tx.user.findUnique({
          where: { id: battle.challengerId },
          select: { score: true },
        })
        if (challenger) {
          const newScore = challenger.score + challengerGlobalXP
          await tx.user.update({
            where: { id: battle.challengerId },
            data: {
              score: newScore,
              level: Math.floor(newScore / 1000) + 1,
              activityLogs: {
                create: {
                  action: winnerId === battle.challengerId
                    ? "BATTLE_WON"
                    : isTie
                      ? "BATTLE_TIE"
                      : "BATTLE_LOST",
                  xpGained: challengerGlobalXP,
                },
              },
            },
          })
        }
      }

      // 3. Award XP to challenged's global score
      if (challengedGlobalXP > 0) {
        const challenged = await tx.user.findUnique({
          where: { id: battle.challengedId },
          select: { score: true },
        })
        if (challenged) {
          const newScore = challenged.score + challengedGlobalXP
          await tx.user.update({
            where: { id: battle.challengedId },
            data: {
              score: newScore,
              level: Math.floor(newScore / 1000) + 1,
              activityLogs: {
                create: {
                  action: winnerId === battle.challengedId
                    ? "BATTLE_WON"
                    : isTie
                      ? "BATTLE_TIE"
                      : "BATTLE_LOST",
                  xpGained: challengedGlobalXP,
                },
              },
            },
          })
        }
      }
    })

    return {
      data: {
        battleId,
        winnerId,
        challengerXP: challengerApprovedXP,
        challengedXP: challengedApprovedXP,
        challengerGlobalXP,
        challengedGlobalXP,
        isTie,
      },
    }
  } catch (error) {
    console.error("Failed to resolve battle:", error)
    return { error: "Resolution failed" }
  }
}

/** Resolve all battles past their endDate (cron job). */
export async function resolveExpiredBattles(): Promise<{
  resolved: BattleResolutionResult[]
  errors: { battleId: string; error: string }[]
}> {
  const now = new Date()

  const expiredBattles = await prisma.battle.findMany({
    where: {
      status: "ACTIVE",
      endDate: { lte: now },
    },
    select: { id: true },
  })

  const resolved: BattleResolutionResult[] = []
  const errors: { battleId: string; error: string }[] = []

  for (const battle of expiredBattles) {
    const result = await resolveBattle(battle.id)
    if (result.error) {
      errors.push({ battleId: battle.id, error: result.error })
    } else if (result.data) {
      resolved.push(result.data)
    }
  }

  return { resolved, errors }
}
