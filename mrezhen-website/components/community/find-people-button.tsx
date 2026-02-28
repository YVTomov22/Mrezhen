'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FindPeopleSheet } from '@/components/community/find-people-sheet'

export function FindPeopleButton({ label }: { label: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        className="w-full gap-2 text-[13px] tracking-tight h-10 border-foreground/20 hover:bg-foreground hover:text-background transition-all duration-200"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" /> {label}
      </Button>
      <FindPeopleSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
