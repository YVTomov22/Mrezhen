"use server"

import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"

/* Types */

export type MatchReason =
  | { type: "interests"; shared: string[] }
  | { type: "level"; theirLevel: number }
  | { type: "education"; value: string }
  | { type: "mathSkill"; theirSkill: number }
  | { type: "questCategories"; shared: string[] }

export interface RecommendedUser {
  id: string
  name: string | null
  username: string | null
  image: string | null
  level: number
  score: number
  interests: string[]
  followerCount: number
  goalCount: number
  questCount: number
  similarityScore: number
  matchReasons: MatchReason[]
}

/* Helpers */

/** Jaccard‑like overlap: |A ∩ B| / max(|A|, |B|, 1) → 0..1 */
function overlapRatio(a: string[], b: string[]): number {
  const setA = new Set(a.map((s) => s.trim().toLowerCase()))
  const setB = new Set(b.map((s) => s.trim().toLowerCase()))
  const intersection = [...setA].filter((x) => setB.has(x))
  const denom = Math.max(setA.size, setB.size, 1)
  return intersection.length / denom
}

/** Returns items present in both arrays (case‑insensitive, trimmed). */
function sharedItems(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((s) => s.trim().toLowerCase()))
  return a.filter((s) => setB.has(s.trim().toLowerCase()))
}

/** Closeness between two numbers — returns 0..1. */
function proximity(a: number, b: number, maxDiff: number): number {
  return Math.max(0, 1 - Math.abs(a - b) / maxDiff)
}

/* Weights (must add to 1) */
const W = {
  interests: 0.35,
  level: 0.15,
  education: 0.10,
  mathSkill: 0.10,
  questCategories: 0.20,
  score: 0.10,
} as const

/* Main action */

export async function getRecommendedUsers(): Promise<RecommendedUser[]> {
  const session = await auth()
  if (!session?.user?.email) return []

  /* 1. Fetch current user with everything we need for matching */
  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      following: true,
      quests: { select: { category: true } },
    },
  })
  if (!me) return []

  const followingIds = new Set(me.following.map((f) => f.followingId))

  /* 2. Fetch candidate users (exclude self & already‑followed) */
  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: [me.id, ...Array.from(followingIds)] },
    },
    take: 200,
    include: {
      _count: { select: { followedBy: true, milestones: true } },
      milestones: { select: { _count: { select: { quests: true } } } },
      quests: { select: { category: true } },
    },
  })

  /* 3. Derive my quest categories */
  const myCategories = [
    ...new Set(
      me.quests.map((q) => q.category?.trim().toLowerCase()).filter(Boolean) as string[]
    ),
  ]

  /* 4. Score each candidate */
  const scored: RecommendedUser[] = candidates.map((c) => {
    let sim = 0
    const reasons: MatchReason[] = []

    // --- Interests overlap ---
    const interestOverlap = overlapRatio(me.interests, c.interests)
    sim += interestOverlap * W.interests
    if (interestOverlap > 0) {
      const shared = sharedItems(me.interests, c.interests)
      if (shared.length > 0) reasons.push({ type: "interests", shared })
    }

    // --- Level proximity ---
    const levelSim = proximity(me.level, c.level, 20)
    sim += levelSim * W.level
    if (levelSim > 0.5) {
      reasons.push({ type: "level", theirLevel: c.level })
    }

    // --- Education match ---
    if (me.education && c.education && me.education === c.education) {
      sim += 1 * W.education
      reasons.push({ type: "education", value: c.education })
    }

    // --- Childhood math skill proximity ---
    if (me.childhoodMathSkill != null && c.childhoodMathSkill != null) {
      const mathSim = proximity(me.childhoodMathSkill, c.childhoodMathSkill, 5)
      sim += mathSim * W.mathSkill
      if (mathSim > 0.5) {
        reasons.push({ type: "mathSkill", theirSkill: c.childhoodMathSkill })
      }
    }

    // --- Quest‑category overlap (knowledge sectors) ---
    const theirCategories = [
      ...new Set(
        c.quests
          .map((q) => q.category?.trim().toLowerCase())
          .filter(Boolean) as string[]
      ),
    ]
    const catOverlap = overlapRatio(myCategories, theirCategories)
    sim += catOverlap * W.questCategories
    if (catOverlap > 0) {
      const shared = sharedItems(myCategories, theirCategories)
      if (shared.length > 0) reasons.push({ type: "questCategories", shared })
    }

    // --- Score / XP proximity ---
    const scoreSim = proximity(me.score, c.score, 5000)
    sim += scoreSim * W.score

    const totalQuests = c.milestones.reduce(
      (acc, m) => acc + m._count.quests,
      0
    )

    return {
      id: c.id,
      name: c.name,
      username: c.username,
      image: c.image,
      level: c.level,
      score: c.score,
      interests: c.interests,
      followerCount: c._count.followedBy,
      goalCount: c._count.milestones,
      questCount: totalQuests,
      similarityScore: Math.round(sim * 100), // 0‑100 %
      matchReasons: reasons,
    }
  })

  /* 5. Sort by similarity desc, take top 30 */
  scored.sort((a, b) => b.similarityScore - a.similarityScore)
  return scored.slice(0, 30)
}
