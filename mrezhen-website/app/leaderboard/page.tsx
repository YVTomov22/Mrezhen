import { auth } from "@/app/auth"
import { redirect } from "next/navigation"
import { getGlobalLeaderboard, getUserRanks } from "@/app/actions/leaderboard"
import { LeaderboardClient } from "@/components/leaderboard/leaderboard-client"

export const dynamic = "force-dynamic"

export default async function LeaderboardPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/login")

  // Pre-fetch global leaderboard and user ranks for instant rendering
  const [initialGlobal, userRanks] = await Promise.all([
    getGlobalLeaderboard(1),
    getUserRanks(),
  ])

  return (
    <LeaderboardClient
      initialGlobal={initialGlobal}
      userRanks={userRanks}
    />
  )
}
