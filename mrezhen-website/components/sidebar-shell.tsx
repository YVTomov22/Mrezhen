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
          "hidden md:flex fixed left-0 top-0 h-screen z-50 border-r border-border bg-background flex-col justify-between py-8 px-3 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-x-hidden overflow-y-auto no-scrollbar",
          expanded ? "w-[240px]" : "w-[72px]"
        )}
      >
        {children}
      </aside>
    </SidebarContext.Provider>
  )
}
