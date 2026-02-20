'use client'

import Link from 'next/link'
import { useSidebarExpanded } from '@/components/sidebar-shell'

export function SidebarLogo() {
  const expanded = useSidebarExpanded()

  return (
    <div className="flex items-center justify-center gap-3 px-3 mb-10">
      <div className="bg-amber-500 text-white p-2 shrink-0 flex items-center justify-center shadow-sm">
        <span className="font-editorial text-base font-black leading-none tracking-tight">M</span>
      </div>
      {expanded && (
        <Link href="/dashboard" className="editorial-subhead text-lg whitespace-nowrap">
          Mrezhen
        </Link>
      )}
    </div>
  )
}
