"use client"

import { Trophy, Globe, Hash } from "lucide-react"

interface RankCardProps {
  label: string
  rank: number
  icon: "trophy" | "globe" | "hash"
}

const iconMap = {
  trophy: Trophy,
  globe: Globe,
  hash: Hash,
} as const

export function RankCard({ label, rank, icon }: RankCardProps) {
  const Icon = iconMap[icon]
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums">
          #{rank.toLocaleString()}
        </p>
      </div>
    </div>
  )
}
