'use client'

import { useState } from "react"
import { useTranslations } from "next-intl"
import { verifyDailyQuest } from "@/app/actions/battle-quest"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2, Image as ImageIcon, FileText } from "lucide-react"

interface QuestVerificationProps {
  quest: {
    id: string
    day: number
    description: string
    proofText: string | null
    proofImageUrl: string | null
    user?: {
      name: string | null
      username: string | null
    }
  }
  onVerified: () => void
}

export function QuestVerification({ quest, onVerified }: QuestVerificationProps) {
  const t = useTranslations("battle")

  const [isVerifying, setIsVerifying] = useState(false)
  const [action, setAction] = useState<"approve" | "reject" | null>(null)

  const handleVerify = async (approved: boolean) => {
    setIsVerifying(true)
    setAction(approved ? "approve" : "reject")
    try {
      const result = await verifyDailyQuest({
        questId: quest.id,
        verdict: approved ? "APPROVED" : "REJECTED",
      })
      if (!result.error) {
        onVerified()
      }
    } catch {
      console.error("Verification failed")
    } finally {
      setIsVerifying(false)
      setAction(null)
    }
  }

  return (
    <div className="rounded-md border bg-background p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {t("day", { day: quest.day })} — {quest.user?.name || quest.user?.username}
        </span>
      </div>

      <p className="text-sm">{quest.description}</p>

      {quest.proofText && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{quest.proofText}</span>
        </div>
      )}

      {quest.proofImageUrl && (
        <a
          href={quest.proofImageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          {t("viewProof")}
        </a>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-7 text-xs text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950/30"
          onClick={() => handleVerify(true)}
          disabled={isVerifying}
        >
          {isVerifying && action === "approve" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <CheckCircle2 className="h-3 w-3 mr-1" />
          )}
          {t("approve")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-7 text-xs text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
          onClick={() => handleVerify(false)}
          disabled={isVerifying}
        >
          {isVerifying && action === "reject" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <XCircle className="h-3 w-3 mr-1" />
          )}
          {t("reject")}
        </Button>
      </div>
    </div>
  )
}
