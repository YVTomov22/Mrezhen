'use client'

import { useEffect, useState } from "react"
import { Trophy, Zap } from "lucide-react"
import { animate, motion, useMotionValue, useTransform } from "motion/react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface UserStatsProps {
  level: number
  score: number
}

export function UserStats({ level, score }: UserStatsProps) {
  const t = useTranslations("common")
  // Initialize with the LAST known score if it exists, otherwise start at current
  const startScore = score
  
  // Motion value starts at the OLD score
  const count = useMotionValue(startScore)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  
  const [isPopping, setIsPopping] = useState(false)

  useEffect(() => {
    // If the score we received is different from what we are currently displaying
    if (score !== count.get()) {
      
      // 1. Trigger Visual Pop
      setIsPopping(true)
      const timeout = setTimeout(() => setIsPopping(false), 600)

      // 2. Animate from OLD -> NEW
      const controls = animate(count, score, { duration: 2, ease: "circOut" })


      return () => {
        clearTimeout(timeout)
        controls.stop()
      }
    } else {
    }
  }, [score, count])

  return (
    <div className="hidden md:flex items-center gap-1 bg-muted border border-border rounded-full px-3 py-1.5 shadow-sm overflow-hidden relative group">
      
      {/* Visual Flash Background */}
      <div 
        className={cn(
          "absolute inset-0 bg-green-200/50 transition-opacity duration-500 pointer-events-none",
          isPopping ? "opacity-100" : "opacity-0"
        )} 
      />

      {/* Level Section */}
      <div className="flex items-center gap-1.5 border-r border-border pr-3 mr-3 relative z-10">
        <Trophy className="w-3.5 h-3.5 text-yellow-600" />
        <span className="text-xs font-bold text-foreground">{t("level")} {level}</span>
      </div>

      {/* XP Section with Animation */}
      <div className="flex items-center gap-1.5 relative z-10">
        <motion.div
            animate={isPopping ? { scale: [1, 1.5, 1], rotate: [0, 15, -15, 0] } : {}}
            transition={{ duration: 0.5 }}
        >
            <Zap className={cn(
                "w-3.5 h-3.5 transition-colors duration-300",
                isPopping ? "text-green-600 fill-green-600" : "text-blue-500"
            )} />
        </motion.div>
        
        <motion.span 
            className={cn(
                "text-xs font-medium min-w-[3ch] tabular-nums", // tabular-nums prevents jitter
                isPopping ? "text-green-700 font-bold" : "text-muted-foreground"
            )}
        >
            {rounded}
        </motion.span> 
        <span className="text-xs font-medium text-muted-foreground">{t("xp")}</span>
      </div>
    </div>
  )
}