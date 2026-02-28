"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { REGION_LABELS } from "@/components/leaderboard/leaderboard-table"
import { Globe } from "lucide-react"
import type { Region } from "@/app/actions/leaderboard"

interface RegionFilterProps {
  value: string
  onChange: (region: Region) => void
}

const REGIONS: Region[] = ["global", "na", "eu", "asia", "sa", "africa", "oceania", "mena"]

export function RegionFilter({ value, onChange }: RegionFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={value} onValueChange={(v) => onChange(v as Region)}>
        <SelectTrigger className="w-[200px] h-9 text-sm">
          <SelectValue placeholder="Select region" />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((r) => (
            <SelectItem key={r} value={r}>
              {REGION_LABELS[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
