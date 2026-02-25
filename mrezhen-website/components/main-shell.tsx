'use client'

import { useSidebarExpanded } from '@/components/sidebar-shell'
import { cn } from '@/lib/utils'

export function MainShell({
  children,
  isLoggedIn,
}: {
  children: React.ReactNode
  isLoggedIn: boolean
}) {
  const expanded = useSidebarExpanded()

  return (
    <main
      id="main-content"
      role="main"
      aria-label="Page content"
      className={cn(
        isLoggedIn &&
          'md:pl-[72px] transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        isLoggedIn && expanded && 'md:pl-[240px]'
      )}
    >
      {children}
    </main>
  )
}
