import { auth } from "@/app/auth"
import { redirect } from "next/navigation"
import { getGlobalLeaderboard, getUserRanks } from "@/app/actions/leaderboard"
import { LeaderboardClient } from "@/components/leaderboard/leaderboard-client"

export const dynamic = "force-dynamic"

export default async function LeaderboardPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/login")

  // Pre-fetch first page of global leaderboard and user ranks on the server
  // for instant rendering without a client-side loading state.
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
