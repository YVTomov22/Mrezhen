'use client'

import { cn } from '@/lib/utils'

export function LeftAsideShell({ children }: { children: React.ReactNode }) {
  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col gap-8 border-r border-border/60 px-6 py-8 overflow-y-auto no-scrollbar'
      )}
    >
      {children}
    </aside>
  )
}
