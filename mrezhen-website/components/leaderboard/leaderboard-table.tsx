"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Trophy, Crown, Medal, Award } from "lucide-react"
import type { LeaderboardEntry } from "@/app/actions/leaderboard"

// ─── Medal/rank icon for top 3 ─────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return <Crown className="h-5 w-5 text-yellow-500 shrink-0" />
  if (rank === 2)
    return <Medal className="h-5 w-5 text-gray-400 shrink-0" />
  if (rank === 3)
    return <Award className="h-5 w-5 text-amber-600 shrink-0" />
  return (
    <span className="w-5 text-center text-xs font-bold text-muted-foreground shrink-0">
      {rank}
    </span>
  )
}

// ─── Region label map ───────────────────────────────────────
export const REGION_LABELS: Record<string, string> = {
  global: "🌍 Global",
  na: "🇺🇸 North America",
  eu: "🇪🇺 Europe",
  asia: "🌏 Asia",
  sa: "🌎 South America",
  africa: "🌍 Africa",
  oceania: "🌊 Oceania",
  mena: "🏜️ Middle East & North Africa",
}

// ─── Single row ─────────────────────────────────────────────
interface LeaderboardRowProps {
  entry: LeaderboardEntry
  isCurrentUser?: boolean
}

export function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
  const initials =
    entry.username?.slice(0, 2).toUpperCase() ?? entry.id.slice(0, 2).toUpperCase()

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
        isCurrentUser
          ? "bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 ring-1 ring-teal-300/50 dark:ring-teal-700/50"
          : "hover:bg-muted/50",
        entry.rank <= 3 && !isCurrentUser && "bg-amber-50/40 dark:bg-amber-950/20"
      )}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center">
        <RankBadge rank={entry.rank} />
      </div>

      {/* Avatar */}
      <Avatar className="h-9 w-9 border border-border">
        <AvatarImage src={entry.image ?? undefined} alt={entry.username ?? "User"} />
        <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
      </Avatar>

      {/* Username + level */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium truncate",
              isCurrentUser && "font-bold text-teal-700 dark:text-teal-400"
            )}
          >
            {entry.username ?? "Anonymous"}
          </span>
          {isCurrentUser && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400"
            >
              You
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">Lvl {entry.level}</span>
      </div>

      {/* Score */}
      <div className="text-right">
        <span className="text-sm font-bold tabular-nums">
          {entry.score.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground ml-1">XP</span>
      </div>
    </div>
  )
}

// ─── Table wrapper ──────────────────────────────────────────
interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  emptyMessage?: string
}

export function LeaderboardTable({
  entries,
  currentUserId,
  emptyMessage = "No users found.",
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Trophy className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {entries.map((entry) => (
        <LeaderboardRow
          key={entry.id}
          entry={entry}
          isCurrentUser={entry.id === currentUserId}
        />
      ))}
    </div>
  )
}
