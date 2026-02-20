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
    <div className="bg-card border border-border overflow-hidden transition-all">
      {/* Milestone Header */}
      <div 
        className="p-6 border-b bg-muted/30 flex flex-col md:flex-row justify-between md:items-center gap-4 cursor-pointer hover:bg-muted/50 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
            <div className={cn("mt-1 p-1.5 text-foreground transition-transform", isExpanded && "rotate-180")}>
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
            <div className="text-center py-8 border border-dashed border-border">
              <p className="editorial-caption text-muted-foreground mb-1">{t("noQuestsYet")}</p>
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