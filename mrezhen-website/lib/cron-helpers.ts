/**
 * Internal helpers used exclusively by cron API routes.
 * NOT a 'use server' file — these functions are never exposed as server actions.
 */

import { prisma } from "@/lib/prisma"

// ── Expired Stories Cleanup ──────────────────────────────────────────

export async function cleanupExpiredStoriesInternal() {
  const result = await prisma.story.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  return { deleted: result.count }
}

// ── Expired Battles Resolution ───────────────────────────────────────

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

/** Resolve a single battle (no auth — only called from cron context). */
async function resolveBattleInternal(battleId: string): Promise<{
  error?: string
  data?: BattleResolutionResult
}> {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: { dailyQuests: true },
  })

  if (!battle) return { error: "Battle not found" }
  if (battle.status === "COMPLETED") return { error: "Battle already resolved" }
  if (battle.status !== "ACTIVE") return { error: "Battle is not active" }

  const challengerApprovedXP = battle.dailyQuests
    .filter((q: { userId: string; verification: string }) => q.userId === battle.challengerId && q.verification === "APPROVED")
    .reduce((sum: number, q: { xpAwarded: number }) => sum + q.xpAwarded, 0)

  const challengedApprovedXP = battle.dailyQuests
    .filter((q: { userId: string; verification: string }) => q.userId === battle.challengedId && q.verification === "APPROVED")
    .reduce((sum: number, q: { xpAwarded: number }) => sum + q.xpAwarded, 0)

  const isTie = challengerApprovedXP === challengedApprovedXP
  let winnerId: string | null = null

  if (!isTie) {
    winnerId =
      challengerApprovedXP > challengedApprovedXP
        ? battle.challengerId
        : battle.challengedId
  }

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
    await prisma.$transaction(async (tx: any) => {
      await tx.battle.update({
        where: { id: battleId },
        data: {
          status: "COMPLETED",
          winnerId,
          challengerXP: challengerApprovedXP,
          challengedXP: challengedApprovedXP,
        },
      })

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
                    : isTie ? "BATTLE_TIE" : "BATTLE_LOST",
                  xpGained: challengerGlobalXP,
                },
              },
            },
          })
        }
      }

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
                    : isTie ? "BATTLE_TIE" : "BATTLE_LOST",
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

/** Resolve all battles past their endDate. Only for cron use. */
export async function resolveExpiredBattlesInternal(): Promise<{
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
    const result = await resolveBattleInternal(battle.id)
    if (result.error) {
      errors.push({ battleId: battle.id, error: result.error })
    } else if (result.data) {
      resolved.push(result.data)
    }
  }

  return { resolved, errors }
}
