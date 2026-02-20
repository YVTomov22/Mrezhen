'use client'

import { useSidebarExpanded } from '@/components/sidebar-shell'

export function SidebarBottom({ children, expandedChildren }: { children: React.ReactNode, expandedChildren: React.ReactNode }) {
  const expanded = useSidebarExpanded()

  return (
    <div className="flex flex-col gap-0.5 pt-6 border-t border-border">
      {expanded ? expandedChildren : children}
    </div>
  )
}
