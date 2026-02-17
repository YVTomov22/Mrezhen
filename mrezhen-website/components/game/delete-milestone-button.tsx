'use client'

import { useTransition } from "react"
import { deleteMilestone } from "@/app/actions/game"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

export function DeleteMilestoneButton({ id }: { id: string }) {
  const t = useTranslations("goals")
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm(t("confirmDeleteMilestone"))) {
        startTransition(async () => {
            await deleteMilestone(id)
        })
    }
  }

  return (
    <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleDelete} 
        disabled={isPending}
        className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
    >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </Button>
  )
}