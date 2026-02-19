'use client'

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { getFilteredMilestones } from "@/app/actions/game"
import { initiateBattle } from "@/app/actions/battle"
import { BATTLE_DURATION_DAYS, BATTLE_WINNER_MULTIPLIER, BATTLE_DAILY_QUEST_XP } from "@/lib/constants"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Swords, Clock, Trophy, Target, Loader2, AlertTriangle } from "lucide-react"

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type Milestone = {
  id: string
  title: string
  category: string | null
  status: string
}

interface ChallengeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opponentId: string
  opponentName: string | null
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export function ChallengeModal({ open, onOpenChange, opponentId, opponentName }: ChallengeModalProps) {
  const t = useTranslations("battle")

  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [selectedMilestone, setSelectedMilestone] = useState<string>("")
  const [goalDescription, setGoalDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Confirmation step
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Load milestones when modal opens
  useEffect(() => {
    if (!open) return
    setError(null)
    setShowConfirmation(false)
    ;(async () => {
      const result = await getFilteredMilestones()
      if (result.data) {
        setMilestones(
          result.data.map((m: { id: string; title: string; category: string | null; status: string }) => ({
            id: m.id,
            title: m.title,
            category: m.category,
            status: m.status,
          }))
        )
      }
    })()
  }, [open])

  const handleNext = () => {
    if (!goalDescription.trim()) {
      setError(t("goalDescriptionPlaceholder"))
      return
    }
    setError(null)
    setShowConfirmation(true)
  }

  const handleConfirmSend = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await initiateBattle({
        challengedUserId: opponentId,
        challengerMilestoneId: selectedMilestone || undefined,
        goalDescription: goalDescription.trim(),
      })
      if (result.error) {
        setError(result.error)
        setShowConfirmation(false)
      } else {
        // Success — close and reset
        onOpenChange(false)
        setGoalDescription("")
        setSelectedMilestone("")
        setShowConfirmation(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      console.error("initiateBattle error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setShowConfirmation(false)
    setError(null)
  }

  // ── Confirmation Dialog ──
  if (showConfirmation) {
    const selectedMs = milestones.find(m => m.id === selectedMilestone)
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Challenge
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to challenge <strong>{opponentName || "this user"}</strong>?
            </p>

            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("goalDescription")}</span>
                <span className="font-medium text-right max-w-[60%] truncate">{goalDescription}</span>
              </div>
              {selectedMs && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("selectMilestone")}</span>
                  <span className="font-medium">{selectedMs.title}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("duration")}</span>
                <span className="font-medium">{BATTLE_DURATION_DAYS} days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("winnerMultiplier")}</span>
                <Badge variant="secondary" className="text-xs">XP ×{BATTLE_WINNER_MULTIPLIER}</Badge>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmation(false)} disabled={isLoading}>
              Go Back
            </Button>
            <Button onClick={handleConfirmSend} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Swords className="h-4 w-4 mr-2" />}
              Confirm Challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // ── Main Challenge Setup ──
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-amber-500" />
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Battle info banner */}
          <div className="rounded-lg border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4">
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="space-y-1">
                <Clock className="h-4 w-4 mx-auto text-amber-600" />
                <p className="font-semibold">{BATTLE_DURATION_DAYS} Days</p>
                <p className="text-muted-foreground">{t("duration")}</p>
              </div>
              <div className="space-y-1">
                <Trophy className="h-4 w-4 mx-auto text-amber-600" />
                <p className="font-semibold">×{BATTLE_WINNER_MULTIPLIER} XP</p>
                <p className="text-muted-foreground">{t("winnerMultiplier")}</p>
              </div>
              <div className="space-y-1">
                <Target className="h-4 w-4 mx-auto text-amber-600" />
                <p className="font-semibold">{BATTLE_DAILY_QUEST_XP} XP</p>
                <p className="text-muted-foreground">{t("dailyQuest")}</p>
              </div>
            </div>
          </div>

          {/* Opponent */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Swords className="h-4 w-4" />
            <span>Challenging: <strong className="text-foreground">{opponentName || "User"}</strong></span>
          </div>

          {/* Goal Description */}
          <div className="space-y-2">
            <Label htmlFor="goalDesc">{t("goalDescription")} *</Label>
            <Textarea
              id="goalDesc"
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              placeholder={t("goalDescriptionPlaceholder")}
              className="resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{goalDescription.length}/500</p>
          </div>

          {/* Milestone Selection */}
          <div className="space-y-2">
            <Label>{t("selectMilestone")}</Label>
            <Select value={selectedMilestone} onValueChange={setSelectedMilestone}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectMilestone")} />
              </SelectTrigger>
              <SelectContent>
                {milestones.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">{t("noMilestones")}</div>
                ) : (
                  milestones.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        {m.title}
                        {m.category && (
                          <Badge variant="outline" className="text-[10px] h-4">{m.category}</Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button onClick={handleNext} className="bg-amber-600 hover:bg-amber-700 text-white">
            <Swords className="h-4 w-4 mr-2" />
            {t("initiateBattle")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
