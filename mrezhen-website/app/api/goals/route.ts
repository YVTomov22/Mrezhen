import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/goals
 *
 * Returns the authenticated user's milestones (goals) with optional
 * server-side category filtering.
 *
 * Query parameters:
 *   category  – comma-separated list of categories (case-insensitive)
 *   status    – optional status filter (IN_PROGRESS, COMPLETED, etc.)
 *
 * Examples:
 *   GET /api/goals                         → all goals
 *   GET /api/goals?category=health         → goals in "health"
 *   GET /api/goals?category=health,career  → goals in "health" OR "career"
 *   GET /api/goals?category=health&status=IN_PROGRESS
 */
export async function GET(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── Parse & validate query params ─────────────────────
  const { searchParams } = new URL(request.url)
  const categoryParam = searchParams.get("category")?.trim() || ""
  const statusParam   = searchParams.get("status")?.trim().toUpperCase() || ""

  // Validate category values (alphanumeric + hyphens + spaces only)
  const CATEGORY_REGEX = /^[a-zA-Z0-9\s\-_]+$/
  const validStatuses = ["IN_PROGRESS", "COMPLETED", "LOCKED", "FAILED"]

  let categories: string[] = []
  if (categoryParam) {
    categories = categoryParam
      .split(",")
      .map(c => c.trim().toLowerCase())
      .filter(c => c.length > 0)

    const invalid = categories.find(c => !CATEGORY_REGEX.test(c))
    if (invalid) {
      return NextResponse.json(
        { error: `Invalid category value: "${invalid}". Only letters, numbers, hyphens, and spaces are allowed.` },
        { status: 400 }
      )
    }
  }

  if (statusParam && !validStatuses.includes(statusParam)) {
    return NextResponse.json(
      { error: `Invalid status value: "${statusParam}". Allowed: ${validStatuses.join(", ")}` },
      { status: 400 }
    )
  }

  // ── Build Prisma filter ───────────────────────────────
  const where: Record<string, unknown> = {
    user: { email: session.user.email },
  }

  // Case-insensitive category filtering using Prisma mode: 'insensitive'
  if (categories.length === 1) {
    where.category = { equals: categories[0], mode: "insensitive" }
  } else if (categories.length > 1) {
    where.category = { in: categories, mode: "insensitive" }
  }

  if (statusParam) {
    where.status = statusParam
  }

  // ── Query ─────────────────────────────────────────────
  try {
    const milestones = await prisma.milestone.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        quests: {
          orderBy: { createdAt: "desc" },
          include: { tasks: { orderBy: { createdAt: "asc" } } },
        },
      },
    })

    return NextResponse.json({
      count: milestones.length,
      filters: {
        categories: categories.length > 0 ? categories : "all",
        status: statusParam || "all",
      },
      data: milestones,
    })
  } catch (error) {
    console.error("[GET /api/goals] Query failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
