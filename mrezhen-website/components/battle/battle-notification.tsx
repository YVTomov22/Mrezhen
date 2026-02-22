'use client'

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { acceptBattle, declineBattle, getBattlesBetweenUsers } from "@/app/actions/battle"
import { getFilteredMilestones } from "@/app/actions/game"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Swords, Check, X, Loader2, Target, Clock, Zap
} from "lucide-react"
import { BATTLE_DURATION_DAYS, BATTLE_DAILY_QUEST_XP } from "@/lib/constants"

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type PendingBattle = {
  id: string
  challengerId: string
  challengedId: string
  challenger: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  }
  goalDescription: string
  challengerMilestone: { id: string; title: string } | null
  status: string
}

interface BattleNotificationProps {
  otherUserId: string
  currentUserId: string
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export function BattleNotification({ otherUserId, currentUserId }: BattleNotificationProps) {
  const t = useTranslations("battle")

  const [pendingBattle, setPendingBattle] = useState<PendingBattle | null>(null)
  const [milestones, setMilestones] = useState<{ id: string; title: string }[]>([])
  const [selectedMilestone, setSelectedMilestone] = useState("")
  const [isAccepting, setIsAccepting] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const result = await getBattlesBetweenUsers(otherUserId)
        if (result.data) {
          const pending = result.data.find(
            (b: { status: string; challengedId: string }) =>
              b.status === "PENDING" && b.challengedId === currentUserId
          ) as PendingBattle | undefined
          setPendingBattle(pending ?? null)
        }
      } catch {
        // ignore
      }
    }
    fetchPending()
    const interval = setInterval(fetchPending, 5000)
    return () => clearInterval(interval)
  }, [otherUserId, currentUserId])

  useEffect(() => {
    if (pendingBattle) {
      getFilteredMilestones().then(result => {
        if (result.data) {
          setMilestones(result.data.map((m: { id: string; title: string }) => ({
            id: m.id,
            title: m.title,
          })))
        }
      })
    }
  }, [pendingBattle])

  if (!pendingBattle) return null

  const handleAccept = async () => {
    setIsAccepting(true)
    setError("")
    try {
      const result = await acceptBattle(
        pendingBattle.id,
        selectedMilestone || undefined
      )
      if (result.error) {
        setError(result.error)
      } else {
        setPendingBattle(null)
      }
    } catch {
      setError("Failed to accept battle")
    } finally {
      setIsAccepting(false)
    }
  }

  const handleDecline = async () => {
    setIsDeclining(true)
    setError("")
    try {
      const result = await declineBattle(pendingBattle.id)
      if (result.error) {
        setError(result.error)
      } else {
        setPendingBattle(null)
      }
    } catch {
      setError("Failed to decline battle")
    } finally {
      setIsDeclining(false)
    }
  }

  return (
    <div className="mx-4 my-3 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 space-y-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
          <Swords className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-bold">{t("challengeReceived")}</p>
          <p className="text-xs text-muted-foreground">
            {pendingBattle.challenger.name || pendingBattle.challenger.username} {t("challengedYou")}
          </p>
        </div>
      </div>

      {/* Goal */}
      <div className="rounded-lg bg-background/80 p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Target className="h-3.5 w-3.5" />
          {t("goalDescription")}
        </div>
        <p className="text-sm">{pendingBattle.goalDescription}</p>
      </div>

      {/* Battle info pills */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1 text-xs">
          <Clock className="h-3 w-3" />
          {BATTLE_DURATION_DAYS} {t("days")}
        </Badge>
        <Badge variant="outline" className="gap-1 text-xs">
          <Zap className="h-3 w-3" />
          {BATTLE_DAILY_QUEST_XP} XP/{t("day", { day: "" }).trim()}
        </Badge>
        {pendingBattle.challengerMilestone && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Target className="h-3 w-3" />
            {pendingBattle.challengerMilestone.title}
          </Badge>
        )}
      </div>

      {/* Milestone picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {t("yourMilestone")} ({t("optional")})
        </label>
        <Select value={selectedMilestone} onValueChange={setSelectedMilestone}>
          <SelectTrigger className="h-8 text-sm bg-background">
            <SelectValue placeholder={t("selectMilestone")} />
          </SelectTrigger>
          <SelectContent>
            {milestones.map(m => (
              <SelectItem key={m.id} value={m.id}>
                {m.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Accept / Decline */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={handleAccept}
          disabled={isAccepting || isDeclining}
        >
          {isAccepting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Check className="h-4 w-4 mr-1" />
          )}
          {t("accept")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
          onClick={handleDecline}
          disabled={isAccepting || isDeclining}
        >
          {isDeclining ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <X className="h-4 w-4 mr-1" />
          )}
          {t("decline")}
        </Button>
      </div>
    </div>
  )
}
