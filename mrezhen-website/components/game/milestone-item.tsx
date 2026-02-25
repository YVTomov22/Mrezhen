'use client'

import { useState } from "react"
import { QuestCard } from "@/components/game/quest-card"
import { CreateQuestBtn } from "@/components/game/creation-forms"
import { DeleteMilestoneButton } from "@/components/game/delete-milestone-button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

// Define types based on your Prisma query
type MilestoneProps = {
  milestone: {
    id: string
    title: string
    description: string | null
    quests: any[] // Using any to avoid complex Prisma type matching issues in this snippet
  }
}

export function MilestoneItem({ milestone }: MilestoneProps) {
  const t = useTranslations("goals")
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="bg-card rounded-xl shadow-sm hover:shadow-md border border-border overflow-hidden transition-all">
      {/* Milestone Header */}
      <div 
        className="p-6 border-b bg-gradient-to-r from-muted/50 to-muted/30 flex flex-col md:flex-row justify-between md:items-center gap-4 cursor-pointer hover:from-muted/70 hover:to-muted/50 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
            {/* Toggle Icon */}
            <div className={cn("mt-1 p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 transition-transform", isExpanded && "rotate-180")}>
                <ChevronDown className="w-5 h-5" />
            </div>
            
            <div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                {milestone.title}
            </h3>
            {milestone.description && (
                <p className="text-muted-foreground text-sm mt-1">{milestone.description}</p>
            )}
            </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <DeleteMilestoneButton id={milestone.id} />
          <CreateQuestBtn milestoneId={milestone.id} />
        </div>
      </div>

      {/* Quests Grid - Conditionally Rendered */}
      {isExpanded && (
        <div className="p-6 bg-muted/20 animate-in fade-in slide-in-from-top-2 duration-200">
          {milestone.quests.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-xl bg-card/50">
              <div className="mx-auto w-10 h-10 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-2">
                <ChevronDown className="w-5 h-5 text-teal-500" />
              </div>
              <p className="text-sm text-muted-foreground font-medium mb-1">{t("noQuestsYet")}</p>
              <p className="text-xs text-muted-foreground/60">{t("addMissionsHint")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {milestone.quests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}