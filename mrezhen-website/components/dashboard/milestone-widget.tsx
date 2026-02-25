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
    <div className="p-4 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                    <Target className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <h4 className="font-bold text-sm truncate w-32">{milestone.title}</h4>
            </div>
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">{Math.round(percent)}%</span>
        </div>
        <Progress value={percent} className="h-2 bg-muted [&>div]:bg-gradient-to-r [&>div]:from-teal-500 [&>div]:to-emerald-500" />
        <p className="text-[10px] text-muted-foreground mt-2 text-right">
            {completed}/{total} {t("quests")}
        </p>
    </div>
  )
}