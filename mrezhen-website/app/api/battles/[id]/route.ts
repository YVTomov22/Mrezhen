import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/battles/[id]
 *
 * Returns full battle details including daily quests.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const battle = await prisma.battle.findUnique({
    where: { id },
    include: {
      challenger: { select: { id: true, name: true, username: true, image: true } },
      challenged: { select: { id: true, name: true, username: true, image: true } },
      challengerMilestone: { select: { id: true, title: true, category: true } },
      challengedMilestone: { select: { id: true, title: true, category: true } },
      winner: { select: { id: true, name: true, username: true } },
      dailyQuests: {
        orderBy: [{ day: "asc" }, { userId: "asc" }],
        include: {
          user: { select: { id: true, name: true, username: true, image: true } },
        },
      },
    },
  })

  if (!battle) {
    return NextResponse.json({ error: "Battle not found" }, { status: 404 })
  }

  // Only participants can view
  if (battle.challengerId !== user.id && battle.challengedId !== user.id) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 })
  }

  // Compute current day
  let currentDay = 0
  if (battle.startDate && battle.status === "ACTIVE") {
    const daysSinceStart = Math.floor(
      (Date.now() - battle.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    currentDay = Math.min(daysSinceStart + 1, 7)
  }

  return NextResponse.json({
    battle,
    currentUserId: user.id,
    currentDay,
  })
}
