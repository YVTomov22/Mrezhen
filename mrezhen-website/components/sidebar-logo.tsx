'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSidebarExpanded } from '@/components/sidebar-shell'

export function SidebarLogo() {
  const expanded = useSidebarExpanded()

  return (
    <div className="flex items-center justify-center gap-3 px-3 mb-8">
      <div className="bg-teal-600 text-white p-1.5 rounded-lg shrink-0">
        <Image src="/favicon.ico" alt="Mrezhen Logo" height={24} width={24} />
      </div>
      {expanded && (
        <Link href="/dashboard" className="text-xl font-bold tracking-tight whitespace-nowrap">
          Mrezhen
        </Link>
      )}
    </div>
  )
}
