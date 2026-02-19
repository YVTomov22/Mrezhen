'use client'

import { useState } from "react"
import { useTranslations } from "next-intl"
import { submitDailyQuest } from "@/app/actions/battle-quest"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Loader2, Send, ImagePlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface DailyQuestSubmissionProps {
  battleId: string
  currentDay: number
  existingQuests: {
    id: string
    day: number
    submittedAt: string | null
    verification: string
  }[]
  onSubmitted: () => void
}

export function DailyQuestSubmission({
  battleId,
  currentDay,
  existingQuests,
  onSubmitted,
}: DailyQuestSubmissionProps) {
  const t = useTranslations("battle")

  const [description, setDescription] = useState("")
  const [proofText, setProofText] = useState("")
  const [proofImageUrl, setProofImageUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const todayQuest = existingQuests.find(q => q.day === currentDay)
  const alreadySubmitted = !!todayQuest?.submittedAt

  if (alreadySubmitted) {
    return (
      <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            {t("questSubmittedToday")}
          </span>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {t(`verification${todayQuest.verification.charAt(0) + todayQuest.verification.slice(1).toLowerCase()}` as "verificationPending")}
        </Badge>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!description.trim()) return
    setIsSubmitting(true)
    setError("")

    try {
      const result = await submitDailyQuest({
        battleId,
        day: currentDay,
        description: description.trim(),
        proofText: proofText.trim() || undefined,
        proofImageUrl: proofImageUrl.trim() || undefined,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setDescription("")
        setProofText("")
        setProofImageUrl("")
        onSubmitted()
      }
    } catch {
      setError("Failed to submit quest")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/10 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          {t("submitQuest")} — {t("day", { day: currentDay })}
        </h4>
      </div>

      <Textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder={t("questDescriptionPlaceholder")}
        className="min-h-[60px] text-sm resize-none bg-background"
        maxLength={500}
      />

      <Textarea
        value={proofText}
        onChange={e => setProofText(e.target.value)}
        placeholder={t("proofTextPlaceholder")}
        className="min-h-[40px] text-sm resize-none bg-background"
        maxLength={1000}
      />

      <div className="flex items-center gap-2">
        <ImagePlus className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          value={proofImageUrl}
          onChange={e => setProofImageUrl(e.target.value)}
          placeholder={t("proofImagePlaceholder")}
          className="text-sm h-8 bg-background"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button
        size="sm"
        className="w-full"
        onClick={handleSubmit}
        disabled={isSubmitting || !description.trim()}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Send className="h-4 w-4 mr-1" />
        )}
        {t("submitQuest")}
      </Button>
    </div>
  )
}
