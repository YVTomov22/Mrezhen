"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/app/auth"
import { revalidatePath } from "next/cache"

// ─── Types ──────────────────────────────────────────────────
export interface LeaderboardEntry {
  id: string
  username: string | null
  image: string | null
  score: number
  level: number
  region: string
  rank: number
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[]
  total: number
  page: number
  pageSize: number
  currentUser?: LeaderboardEntry | null
}

// ─── Constants ──────────────────────────────────────────────
const VALID_REGIONS = [
  "global", "na", "eu", "asia", "sa", "africa", "oceania", "mena",
] as const

export type Region = (typeof VALID_REGIONS)[number]

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

// ─── Helpers ────────────────────────────────────────────────

/**
 * Calculate a user's rank among all active users.
 * Uses a COUNT query (index scan) instead of a window function
 * to keep it efficient even at millions of rows.
 */
async function getUserGlobalRank(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { score: true },
  })
  if (!user) return 0

  // Rank = 1 + how many active users have a higher score
  const above = await prisma.user.count({
    where: {
      isDeactivated: false,
      score: { gt: user.score },
    },
  })
  return above + 1
}

async function getUserRegionalRank(
  userId: string,
  region: string
): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { score: true },
  })
  if (!user) return 0

  const above = await prisma.user.count({
    where: {
      isDeactivated: false,
      region,
      score: { gt: user.score },
    },
  })
  return above + 1
}

// ─── Global Leaderboard (paginated) ────────────────────────
/**
 * Fetches global leaderboard with cursor-free offset pagination.
 * The composite index on (isDeactivated, score DESC) ensures the
 * database can satisfy skip/take without scanning the full table.
 */
export async function getGlobalLeaderboard(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<LeaderboardResult> {
  const size = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE)
  const p = Math.max(1, page)
  const skip = (p - 1) * size

  const [entries, total] = await Promise.all([
    prisma.user.findMany({
      where: { isDeactivated: false },
      orderBy: { score: "desc" },
      skip,
      take: size,
      select: {
        id: true,
        username: true,
        image: true,
        score: true,
        level: true,
        region: true,
      },
    }),
    prisma.user.count({ where: { isDeactivated: false } }),
  ])

  // Attach computed rank based on page offset
  const ranked: LeaderboardEntry[] = entries.map((u, i) => ({
    ...u,
    rank: skip + i + 1,
  }))

  // Get current user info if logged in
  const session = await auth()
  let currentUser: LeaderboardEntry | null = null
  if (session?.user?.email) {
    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        username: true,
        image: true,
        score: true,
        level: true,
        region: true,
      },
    })
    if (me) {
      const rank = await getUserGlobalRank(me.id)
      currentUser = { ...me, rank }
    }
  }

  return { entries: ranked, total, page: p, pageSize: size, currentUser }
}

// ─── Regional Leaderboard (paginated) ──────────────────────
export async function getRegionalLeaderboard(
  region: Region,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<LeaderboardResult> {
  if (!VALID_REGIONS.includes(region)) {
    return { entries: [], total: 0, page: 1, pageSize, currentUser: null }
  }

  const size = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE)
  const p = Math.max(1, page)
  const skip = (p - 1) * size

  const [entries, total] = await Promise.all([
    prisma.user.findMany({
      where: { isDeactivated: false, region },
      orderBy: { score: "desc" },
      skip,
      take: size,
      select: {
        id: true,
        username: true,
        image: true,
        score: true,
        level: true,
        region: true,
      },
    }),
    prisma.user.count({ where: { isDeactivated: false, region } }),
  ])

  const ranked: LeaderboardEntry[] = entries.map((u, i) => ({
    ...u,
    rank: skip + i + 1,
  }))

  const session = await auth()
  let currentUser: LeaderboardEntry | null = null
  if (session?.user?.email) {
    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        username: true,
        image: true,
        score: true,
        level: true,
        region: true,
      },
    })
    if (me) {
      const rank = await getUserRegionalRank(me.id, region)
      currentUser = { ...me, rank }
    }
  }

  return { entries: ranked, total, page: p, pageSize: size, currentUser }
}

// ─── Local Leaderboard (score neighbors) ───────────────────
/**
 * Returns X users above and below the current user in the ranking,
 * centering them in the result. Uses two efficient queries:
 * 1. Users with score >= current user's score (above + self)
 * 2. Users with score < current user's score (below)
 * Both use the DESC score index.
 */
export async function getLocalLeaderboard(
  neighbors = 10
): Promise<{
  entries: LeaderboardEntry[]
  currentUser: LeaderboardEntry | null
}> {
  const session = await auth()
  if (!session?.user?.email) {
    return { entries: [], currentUser: null }
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      username: true,
      image: true,
      score: true,
      level: true,
      region: true,
    },
  })
  if (!me) return { entries: [], currentUser: null }

  const n = Math.min(Math.max(1, neighbors), 50)

  // Users ranked above: higher score, or same score with earlier ID (tiebreak)
  const above = await prisma.user.findMany({
    where: {
      isDeactivated: false,
      score: { gt: me.score },
    },
    orderBy: { score: "asc" }, // closest scores first
    take: n,
    select: {
      id: true,
      username: true,
      image: true,
      score: true,
      level: true,
      region: true,
    },
  })

  // Users ranked below: lower score
  const below = await prisma.user.findMany({
    where: {
      isDeactivated: false,
      score: { lt: me.score },
    },
    orderBy: { score: "desc" }, // closest scores first
    take: n,
    select: {
      id: true,
      username: true,
      image: true,
      score: true,
      level: true,
      region: true,
    },
  })

  // Calculate rank for the current user
  const myRank = await getUserGlobalRank(me.id)

  // Build the sorted list: above (reversed to highest-first) + self + below
  const aboveSorted = above.reverse()
  const allUsers = [...aboveSorted, me, ...below]

  // Remove duplicates (self might appear in above/below if scores match)
  const seen = new Set<string>()
  const deduped = allUsers.filter((u) => {
    if (seen.has(u.id)) return false
    seen.add(u.id)
    return true
  })

  // Assign ranks relative to the current user
  const myIndex = deduped.findIndex((u) => u.id === me.id)
  const ranked: LeaderboardEntry[] = deduped.map((u, i) => ({
    ...u,
    rank: myRank - (myIndex - i),
  }))

  const currentUser: LeaderboardEntry = { ...me, rank: myRank }

  return { entries: ranked, currentUser }
}

// ─── Update user region ────────────────────────────────────
export async function updateUserRegion(region: string) {
  if (!VALID_REGIONS.includes(region as Region)) {
    return { error: "Invalid region" }
  }

  const session = await auth()
  if (!session?.user?.email) return { error: "Not authenticated" }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { region },
    })
    revalidatePath("/leaderboard")
    revalidatePath("/settings")
    return { success: "Region updated" }
  } catch {
    return { error: "Could not update region" }
  }
}

// ─── Get user ranks (both global and regional) ─────────────
export async function getUserRanks() {
  const session = await auth()
  if (!session?.user?.email) return null

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, score: true, region: true, level: true, username: true, image: true },
  })
  if (!user) return null

  const [globalRank, regionalRank] = await Promise.all([
    getUserGlobalRank(user.id),
    getUserRegionalRank(user.id, user.region),
  ])

  return {
    ...user,
    globalRank,
    regionalRank,
  }
}
