'use client'

import { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

const SidebarContext = createContext(false)

export function useSidebarExpanded() {
  return useContext(SidebarContext)
}

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <SidebarContext.Provider value={expanded}>
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-screen z-50 border-r border-border bg-background/95 backdrop-blur-xl flex-col justify-between py-6 px-2 transition-[width] duration-200 ease-in-out overflow-hidden",
          expanded ? "w-[220px]" : "w-[72px]"
        )}
      >
        {children}
      </aside>
    </SidebarContext.Provider>
  )
}
