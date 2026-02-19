'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CategoryFilterProps {
  categories: string[]
  activeCategories: string[]
}

export function CategoryFilter({ categories, activeCategories }: CategoryFilterProps) {
  const t = useTranslations("goals")
  const router = useRouter()
  const searchParams = useSearchParams()

  function toggleCategory(cat: string) {
    const current = new Set(activeCategories)
    if (current.has(cat)) {
      current.delete(cat)
    } else {
      current.add(cat)
    }

    const params = new URLSearchParams(searchParams.toString())
    if (current.size > 0) {
      params.set("category", Array.from(current).join(","))
    } else {
      params.delete("category")
    }

    router.push(`/goals?${params.toString()}`)
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("category")
    router.push(`/goals?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mr-1">
        <Filter className="w-4 h-4" />
        {t("filterByCategory")}
      </div>

      <button
        onClick={clearFilters}
        className={cn(
          "px-3 py-1.5 text-sm rounded-full border transition-all",
          activeCategories.length === 0
            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
            : "bg-card text-muted-foreground border-border hover:bg-muted"
        )}
      >
        {t("allCategories")}
      </button>

      {categories.map(cat => {
        const isActive = activeCategories.includes(cat)
        return (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full border transition-all capitalize",
              isActive
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {t(`categories.${cat}`)}
          </button>
        )
      })}

      {activeCategories.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          <X className="w-3 h-3" />
          {t("clearFilter")}
        </Button>
      )}
    </div>
  )
}
