'use client'

import Link from 'next/link'
import { useSidebarExpanded } from '@/components/sidebar-shell'

export function SidebarLogo() {
  const expanded = useSidebarExpanded()

  return (
    <div className="flex items-center justify-center gap-3 px-3 mb-10">
      <div className="bg-[#e53e3e] text-white p-2 shrink-0 flex items-center justify-center shadow-sm rounded-sm">
        <svg width="18" height="18" viewBox="0 0 190 190" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="30" y1="30" x2="160" y2="160" stroke="white" strokeWidth="12" strokeLinecap="round" opacity="0.85"/>
          <line x1="160" y1="30" x2="30" y2="160" stroke="white" strokeWidth="12" strokeLinecap="round" opacity="0.85"/>
          <polygon points="95,28 162,95 95,162 28,95" fill="none" stroke="white" strokeWidth="9" strokeLinejoin="round" opacity="0.8"/>
          <polygon points="95,52 138,95 95,138 52,95" fill="none" stroke="white" strokeWidth="7" strokeLinejoin="round" opacity="0.7"/>
          <line x1="95" y1="20" x2="95" y2="170" stroke="white" strokeWidth="8" opacity="0.5"/>
          <line x1="20" y1="95" x2="170" y2="95" stroke="white" strokeWidth="8" opacity="0.5"/>
        </svg>
      </div>
      {expanded && (
        <Link href="/dashboard" className="editorial-subhead text-lg whitespace-nowrap">
          Mrezhen
        </Link>
      )}
    </div>
  )
}
