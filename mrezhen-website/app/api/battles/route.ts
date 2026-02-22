import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/battles
 *
 * Query params:
 *   ?status=ACTIVE|PENDING|COMPLETED|CANCELLED|DECLINED
 *   ?opponent=<userId>
 *
 * Returns all battles for the authenticated user, optionally filtered.
 */
export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get("status")
  const opponentParam = searchParams.get("opponent")

  // Build where clause
  const where: Record<string, unknown> = {
    OR: [{ challengerId: user.id }, { challengedId: user.id }],
  }

  if (statusParam) {
    const validStatuses = ["PENDING", "ACTIVE", "COMPLETED", "CANCELLED", "DECLINED"]
    const upper = statusParam.toUpperCase()
    if (!validStatuses.includes(upper)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      )
    }
    where.status = upper
  }

  if (opponentParam) {
    where.OR = [
      { challengerId: user.id, challengedId: opponentParam },
      { challengerId: opponentParam, challengedId: user.id },
    ]
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
      _count: { select: { dailyQuests: true } },
    },
  })

  return NextResponse.json({
    battles,
    currentUserId: user.id,
    count: battles.length,
  })
}
