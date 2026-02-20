'use client'

import { useEffect, useState } from "react"
import { animate, motion, useMotionValue, useTransform } from "motion/react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface UserStatsProps {
  level: number
  score: number
}

export function UserStats({ level, score }: UserStatsProps) {
  const t = useTranslations("common")
  const startScore = score
  
  const count = useMotionValue(startScore)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  
  const [isPopping, setIsPopping] = useState(false)

  useEffect(() => {
    if (score !== count.get()) {
      setIsPopping(true)
      const timeout = setTimeout(() => setIsPopping(false), 600)
      const controls = animate(count, score, { duration: 2, ease: "circOut" })
      return () => {
        clearTimeout(timeout)
        controls.stop()
      }
    }
  }, [score, count])

  return (
    <div className="hidden md:flex items-center gap-1 border border-border px-3 py-1.5 overflow-hidden relative group">

      {/* Level Section */}
      <div className="flex items-center gap-1.5 border-r border-border pr-3 mr-3 relative z-10">
        <span className="editorial-caption text-muted-foreground !text-[10px]">{t("level")}</span>
        <span className="text-[13px] font-black tracking-tighter text-foreground">{level}</span>
      </div>

      {/* XP Section with Animation */}
      <div className="flex items-center gap-1.5 relative z-10">
        <motion.span 
            className={cn(
                "text-[13px] font-black tracking-tighter tabular-nums",
                isPopping ? "text-foreground" : "text-foreground"
            )}
        >
            {rounded}
        </motion.span> 
        <span className="editorial-caption text-muted-foreground !text-[10px]">{t("xp")}</span>
      </div>
    </div>
  )
}