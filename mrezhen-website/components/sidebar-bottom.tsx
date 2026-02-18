'use client'

import { useSidebarExpanded } from '@/components/sidebar-shell'

export function SidebarBottom({ children, expandedChildren }: { children: React.ReactNode, expandedChildren: React.ReactNode }) {
  const expanded = useSidebarExpanded()

  return (
    <div className="flex flex-col gap-1 pt-4 border-t border-border">
      {expanded ? expandedChildren : children}
    </div>
  )
}
