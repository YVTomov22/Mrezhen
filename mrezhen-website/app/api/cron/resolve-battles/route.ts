import { NextRequest, NextResponse } from "next/server"
import { resolveExpiredBattles } from "@/app/actions/battle-resolution"

// Cron endpoint to resolve expired battles. Protected by CRON_SECRET.
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
