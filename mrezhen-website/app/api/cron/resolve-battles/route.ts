import { NextRequest, NextResponse } from "next/server"
import { resolveExpiredBattles } from "@/app/actions/battle-resolution"

/**
 * GET /api/cron/resolve-battles
 *
 * Cron endpoint to resolve all battles that have passed their 7-day end date.
 *
 * Security: Protected by CRON_SECRET env variable.
 * Set up as a Vercel Cron Job or external scheduler to call this every hour.
 *
 * Example Vercel cron config in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/resolve-battles",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await resolveExpiredBattles()

    return NextResponse.json({
      message: "Battle resolution complete",
      resolvedCount: result.resolved.length,
      errorCount: result.errors.length,
      resolved: result.resolved,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cron battle resolution error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
