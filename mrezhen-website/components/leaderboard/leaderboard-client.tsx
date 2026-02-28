"use client"

import { useState, useCallback, useTransition, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeaderboardTable, REGION_LABELS } from "@/components/leaderboard/leaderboard-table"
import { LeaderboardPagination } from "@/components/leaderboard/pagination"
import { RegionFilter } from "@/components/leaderboard/region-filter"
import { RankCard } from "@/components/leaderboard/rank-card"
import {
  getGlobalLeaderboard,
  getRegionalLeaderboard,
  getLocalLeaderboard,
} from "@/app/actions/leaderboard"
import type { LeaderboardEntry, LeaderboardResult, Region } from "@/app/actions/leaderboard"
import { Globe, Users, Crosshair, Loader2, Trophy } from "lucide-react"

// Props
interface LeaderboardClientProps {
  initialGlobal: LeaderboardResult
  userRanks: {
    globalRank: number
    regionalRank: number
    region: string
    score: number
    level: number
  } | null
}

export function LeaderboardClient({
  initialGlobal,
  userRanks,
}: LeaderboardClientProps) {
  const [tab, setTab] = useState<"global" | "regional" | "local">("global")
  const [isPending, startTransition] = useTransition()

  // Global state
  const [globalData, setGlobalData] = useState<LeaderboardResult>(initialGlobal)

  // Regional state
  const [region, setRegion] = useState<Region>(
    (userRanks?.region as Region) ?? "global"
  )
  const [regionalData, setRegionalData] = useState<LeaderboardResult | null>(null)

  // Local state
  const [localEntries, setLocalEntries] = useState<LeaderboardEntry[]>([])
  const [localCurrentUser, setLocalCurrentUser] = useState<LeaderboardEntry | null>(null)
  const [localLoaded, setLocalLoaded] = useState(false)

  // Fetch global page
  const fetchGlobalPage = useCallback((page: number) => {
    startTransition(async () => {
      const data = await getGlobalLeaderboard(page)
      setGlobalData(data)
    })
  }, [])

  // Fetch regional page
  const fetchRegionalPage = useCallback(
    (page: number, r?: Region) => {
      startTransition(async () => {
        const data = await getRegionalLeaderboard(r ?? region, page)
        setRegionalData(data)
      })
    },
    [region]
  )

  // Fetch local
  const fetchLocal = useCallback(() => {
    startTransition(async () => {
      const data = await getLocalLeaderboard(10)
      setLocalEntries(data.entries)
      setLocalCurrentUser(data.currentUser)
      setLocalLoaded(true)
    })
  }, [])

  // Auto-fetch on tab change
  useEffect(() => {
    if (tab === "regional" && !regionalData) {
      fetchRegionalPage(1)
    }
    if (tab === "local" && !localLoaded) {
      fetchLocal()
    }
  }, [tab, regionalData, localLoaded, fetchRegionalPage, fetchLocal])

  // Region change handler
  const handleRegionChange = (r: Region) => {
    setRegion(r)
    fetchRegionalPage(1, r)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground">
          See how you stack up against the community.
        </p>
      </div>

      {/* Rank summary cards */}
      {userRanks && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <RankCard label="Global Rank" rank={userRanks.globalRank} icon="trophy" />
          <RankCard
            label={`${REGION_LABELS[userRanks.region] ?? userRanks.region} Rank`}
            rank={userRanks.regionalRank}
            icon="globe"
          />
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Score</p>
              <p className="text-xl font-bold tabular-nums">
                {userRanks.score.toLocaleString()} XP
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="global" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Globe className="h-4 w-4" />
            Global
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            Regional
          </TabsTrigger>
          <TabsTrigger value="local" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Crosshair className="h-4 w-4" />
            Nearby
          </TabsTrigger>
        </TabsList>

        {/* Loading overlay */}
        {isPending && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Global */}
        <TabsContent value="global" className="mt-4">
          {!isPending && (
            <>
              <LeaderboardTable
                entries={globalData.entries}
                currentUserId={globalData.currentUser?.id}
              />
              <LeaderboardPagination
                page={globalData.page}
                pageSize={globalData.pageSize}
                total={globalData.total}
                onPageChange={fetchGlobalPage}
              />
            </>
          )}
        </TabsContent>

        {/* Regional */}
        <TabsContent value="regional" className="mt-4 space-y-4">
          <RegionFilter value={region} onChange={handleRegionChange} />
          {!isPending && regionalData && (
            <>
              <LeaderboardTable
                entries={regionalData.entries}
                currentUserId={regionalData.currentUser?.id}
                emptyMessage="No users in this region yet."
              />
              <LeaderboardPagination
                page={regionalData.page}
                pageSize={regionalData.pageSize}
                total={regionalData.total}
                onPageChange={(p) => fetchRegionalPage(p)}
              />
            </>
          )}
        </TabsContent>

        {/* Local (Nearby) */}
        <TabsContent value="local" className="mt-4">
          {!isPending && localLoaded && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground px-1">
                Users with similar scores to yours — you&apos;re highlighted.
              </p>
              <LeaderboardTable
                entries={localEntries}
                currentUserId={localCurrentUser?.id}
                emptyMessage="Log in to see nearby rankings."
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
