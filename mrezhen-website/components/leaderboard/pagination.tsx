"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function LeaderboardPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  const [isPending, startTransition] = useTransition()

  if (totalPages <= 1) return null

  const goTo = (p: number) => {
    startTransition(() => {
      onPageChange(p)
    })
  }

  return (
    <div className="flex items-center justify-between px-2 pt-4">
      <span className="text-xs text-muted-foreground">
        Page {page} of {totalPages} &middot; {total.toLocaleString()} users
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1 || isPending}
          onClick={() => goTo(page - 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page number buttons (show max 5 around current) */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number
          if (totalPages <= 5) {
            pageNum = i + 1
          } else if (page <= 3) {
            pageNum = i + 1
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i
          } else {
            pageNum = page - 2 + i
          }
          return (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0 text-xs"
              disabled={isPending}
              onClick={() => goTo(pageNum)}
            >
              {isPending && pageNum === page ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                pageNum
              )}
            </Button>
          )
        })}

        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages || isPending}
          onClick={() => goTo(page + 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
