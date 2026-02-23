"use client"

import { Progress } from "@/components/ui/progress"
import { Target } from "lucide-react"
import { useTranslations } from "next-intl"

export function MilestoneWidget({ milestone }: { milestone: any }) {
  const t = useTranslations("goals")
  const completed = milestone.quests.filter((q: any) => q.status === "COMPLETED").length
  const total = milestone.quests.length
  const percent = total === 0 ? 0 : (completed / total) * 100

  return (
    <div className="group">
        <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-foreground" />
                <h4 className="text-[13px] font-semibold tracking-tight truncate w-32">{milestone.title}</h4>
            </div>
            <span className="editorial-caption text-muted-foreground">{Math.round(percent)}%</span>
        </div>
        <Progress value={percent} className="h-1 bg-muted [&>div]:bg-foreground dark:[&>div]:bg-blue-900" />
        <p className="text-[10px] text-muted-foreground mt-2 text-right">
            {completed}/{total} {t("quests")}
        </p>
    </div>
  )
}