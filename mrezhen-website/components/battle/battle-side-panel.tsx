'use client'

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { getBattlesBetweenUsers } from "@/app/actions/battle"
import { getBattleDailyQuests, getBattleCurrentDay } from "@/app/actions/battle-quest"
import { BATTLE_DURATION_DAYS, BATTLE_WINNER_MULTIPLIER } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Swords, ChevronRight, ChevronLeft, Trophy, Clock, 
  CheckCircle2, XCircle, Circle, Loader2, Crown, Minus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DailyQuestSubmission } from "./daily-quest-submission"
import { QuestVerification } from "./quest-verification"

// Types

type BattleUser = {
  id: string
  name: string | null
  username: string | null
  image: string | null
}

type DailyQuest = {
  id: string
  battleId: string
  userId: string
  day: number
  description: string
  proofText: string | null
  proofImageUrl: string | null
  verification: "PENDING" | "APPROVED" | "REJECTED"
  xpAwarded: number
  submittedAt: string | null
  verifiedAt: string | null
  verifiedById: string | null
  user?: BattleUser
}

type Battle = {
  id: string
  challengerId: string
  challengedId: string
  challenger: BattleUser
  challenged: BattleUser
  challengerMilestone: { id: string; title: string } | null
  challengedMilestone: { id: string; title: string } | null
  goalDescription: string
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "DECLINED"
  startDate: string | null
  endDate: string | null
  challengerXP: number
  challengedXP: number
  winnerId: string | null
  winner: BattleUser | null
  dailyQuests: DailyQuest[]
}

interface BattleSidePanelProps {
  otherUserId: string
  currentUserId: string
}

// Component

export function BattleSidePanel({ otherUserId, currentUserId }: BattleSidePanelProps) {
  const t = useTranslations("battle")

  const [battles, setBattles] = useState<Battle[]>([])
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null)
  const [currentDay, setCurrentDay] = useState(0)
  const [quests, setQuests] = useState<DailyQuest[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch battles between users
  const fetchBattles = useCallback(async () => {
    try {
      const result = await getBattlesBetweenUsers(otherUserId)
      if (result.data) {
        setBattles(result.data as unknown as Battle[])
        // Find the active or most recent pending battle
        const active = result.data.find(
          (b: { status: string }) => b.status === "ACTIVE" || b.status === "PENDING"
        ) as Battle | undefined
        setActiveBattle(active ?? null)

        // Fetch day and quests for active battle
        if (active && active.status === "ACTIVE") {
          const [dayResult, questsResult] = await Promise.all([
            getBattleCurrentDay(active.id),
            getBattleDailyQuests(active.id),
          ])
          setCurrentDay(dayResult.day)
          if (questsResult.data) {
            setQuests(questsResult.data as unknown as DailyQuest[])
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch battles:", e)
    } finally {
      setIsLoading(false)
    }
  }, [otherUserId])

  useEffect(() => {
    fetchBattles()
    const interval = setInterval(fetchBattles, 5000)
    return () => clearInterval(interval)
  }, [fetchBattles])

  // Don't render if no battle context
  if (isLoading) return null
  if (!activeBattle && !battles.some(b => b.status === "COMPLETED")) return null

  // Show completed battle results if no active battle
  const displayBattle = activeBattle || battles.find(b => b.status === "COMPLETED")
  if (!displayBattle) return null

  const isChallenger = displayBattle.challengerId === currentUserId
  const myXP = isChallenger ? displayBattle.challengerXP : displayBattle.challengedXP
  const opponentXP = isChallenger ? displayBattle.challengedXP : displayBattle.challengerXP
  const opponent = isChallenger ? displayBattle.challenged : displayBattle.challenger
  const me = isChallenger ? displayBattle.challenger : displayBattle.challenged
  const totalXP = myXP + opponentXP || 1

  // Countdown
  const daysRemaining = displayBattle.endDate
    ? Math.max(0, Math.ceil((new Date(displayBattle.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  // Quests stats
  const myQuests = quests.filter(q => q.userId === currentUserId)
  const opponentQuests = quests.filter(q => q.userId !== currentUserId)
  const myCompleted = myQuests.filter(q => q.verification === "APPROVED").length
  const opponentCompleted = opponentQuests.filter(q => q.verification === "APPROVED").length
  const mySubmitted = myQuests.filter(q => q.submittedAt).length
  const pendingVerification = opponentQuests.filter(q => q.submittedAt && q.verification === "PENDING")

  // Winner state
  const isCompleted = displayBattle.status === "COMPLETED"
  const iWon = isCompleted && displayBattle.winnerId === currentUserId
  const isTie = isCompleted && !displayBattle.winnerId

  if (collapsed) {
    return (
      <div className="w-12 flex flex-col items-center py-4 border-l border-border bg-muted/30">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Swords className="h-5 w-5 text-amber-500 mb-2" />
        {displayBattle.status === "ACTIVE" && (
          <Badge variant="secondary" className="text-[10px] px-1 rotate-90 mt-2 whitespace-nowrap">
            {t("dayOf", { current: currentDay, total: BATTLE_DURATION_DAYS })}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="w-80 flex flex-col border-l border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-amber-600" />
          <span className="font-semibold text-sm">{t("title")}</span>
          <Badge
            variant={displayBattle.status === "ACTIVE" ? "default" : "secondary"}
            className={cn(
              "text-[10px] h-5",
              displayBattle.status === "ACTIVE" && "bg-green-600",
              displayBattle.status === "COMPLETED" && "bg-blue-600",
              displayBattle.status === "PENDING" && "bg-amber-500",
            )}
          >
            {t(`status${displayBattle.status.charAt(0) + displayBattle.status.slice(1).toLowerCase()}` as "statusActive")}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(true)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Goal */}
        <div className="rounded-lg border bg-muted/50 p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1">{t("goalDescription")}</p>
          <p className="text-sm">{displayBattle.goalDescription}</p>
        </div>

        {/* Timer / Result */}
        {displayBattle.status === "ACTIVE" && (
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">
                {t("dayOf", { current: currentDay, total: BATTLE_DURATION_DAYS })}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {daysRemaining}d left
            </span>
          </div>
        )}

        {isCompleted && (
          <div className={cn(
            "rounded-lg border p-4 text-center space-y-2",
            iWon ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" :
            isTie ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" :
            "bg-muted/50"
          )}>
            {iWon ? (
              <>
                <Crown className="h-8 w-8 mx-auto text-amber-500" />
                <p className="font-bold text-amber-700 dark:text-amber-400">{t("youWon")}</p>
              </>
            ) : isTie ? (
              <>
                <Minus className="h-8 w-8 mx-auto text-blue-500" />
                <p className="font-bold text-blue-700 dark:text-blue-400">{t("youTied")}</p>
              </>
            ) : (
              <>
                <Trophy className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="font-bold text-muted-foreground">{t("youLost")}</p>
              </>
            )}
          </div>
        )}

        {/* XP Scoreboard */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">XP Scoreboard</h4>

          {/* My XP */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border">
                  <AvatarImage src={me.image || undefined} />
                  <AvatarFallback className="text-[10px]">{me.name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{t("yourXP")}</span>
              </div>
              <span className="text-sm font-bold text-amber-600">{myXP}</span>
            </div>
            <Progress value={(myXP / totalXP) * 100} className="h-2" />
          </div>

          {/* Opponent XP */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border">
                  <AvatarImage src={opponent.image || undefined} />
                  <AvatarFallback className="text-[10px]">{opponent.name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{t("opponentXP")}</span>
              </div>
              <span className="text-sm font-bold">{opponentXP}</span>
            </div>
            <Progress value={(opponentXP / totalXP) * 100} className="h-2" />
          </div>
        </div>

        {/* Stats */}
        {displayBattle.status === "ACTIVE" && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
              <p className="text-lg font-bold">{myCompleted}/{currentDay}</p>
              <p className="text-[10px] text-muted-foreground">Your Quests</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
              <p className="text-lg font-bold">{opponentCompleted}/{currentDay}</p>
              <p className="text-[10px] text-muted-foreground">Their Quests</p>
            </div>
          </div>
        )}

        {/* Daily Quest Breakdown */}
        {(displayBattle.status === "ACTIVE" || isCompleted) && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("dailyQuest")} Breakdown
            </h4>
            <div className="space-y-1.5">
              {Array.from({ length: BATTLE_DURATION_DAYS }, (_, i) => i + 1).map(day => {
                const myQ = myQuests.find(q => q.day === day)
                const oppQ = opponentQuests.find(q => q.day === day)
                const isFuture = day > currentDay && displayBattle.status === "ACTIVE"

                return (
                  <div key={day} className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-md text-xs border",
                    day === currentDay && displayBattle.status === "ACTIVE" && "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20",
                    isFuture && "opacity-40"
                  )}>
                    <span className="font-medium w-12">{t("day", { day })}</span>
                    <div className="flex items-center gap-3">
                      {/* My status */}
                      <div className="flex items-center gap-1" title="You">
                        {!myQ?.submittedAt ? (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : myQ.verification === "APPROVED" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : myQ.verification === "REJECTED" ? (
                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </div>
                      <span className="text-muted-foreground">{t("vs")}</span>
                      {/* Opponent status */}
                      <div className="flex items-center gap-1" title={opponent.name || "Opponent"}>
                        {!oppQ?.submittedAt ? (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : oppQ.verification === "APPROVED" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : oppQ.verification === "REJECTED" ? (
                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pending verifications for opponent quests */}
        {pendingVerification.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("verificationPending")} ({pendingVerification.length})
            </h4>
            {pendingVerification.map(quest => (
              <QuestVerification
                key={quest.id}
                quest={quest}
                onVerified={fetchBattles}
              />
            ))}
          </div>
        )}

        {/* Daily quest submission */}
        {displayBattle.status === "ACTIVE" && currentDay > 0 && (
          <DailyQuestSubmission
            battleId={displayBattle.id}
            currentDay={currentDay}
            existingQuests={myQuests}
            onSubmitted={fetchBattles}
          />
        )}
      </div>
    </div>
  )
}
