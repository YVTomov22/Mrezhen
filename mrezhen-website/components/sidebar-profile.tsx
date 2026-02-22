'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSidebarExpanded } from '@/components/sidebar-shell'

interface SidebarProfileProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function SidebarProfile({ user }: SidebarProfileProps) {
  const expanded = useSidebarExpanded()
  const [localImage, setLocalImage] = useState<string | null>(user.image ?? null)
  const [localName, setLocalName] = useState<string | null>(user.name ?? null)

  useEffect(() => {
    setLocalImage(user.image ?? null)
    setLocalName(user.name ?? null)
  }, [user.image, user.name])

  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.image) setLocalImage(e.detail.image)
    }
    const userHandler = (e: any) => {
      const d = e?.detail ?? {}
      if (d.image) setLocalImage(d.image)
      if (d.name) setLocalName(d.name)
    }
    window.addEventListener('avatar-updated', handler)
    window.addEventListener('user-updated', userHandler)
    return () => {
      window.removeEventListener('avatar-updated', handler)
      window.removeEventListener('user-updated', userHandler)
    }
  }, [])

  const displayName = localName || 'User'
  const truncatedName = displayName.length > 14 ? displayName.slice(0, 14) + '\u2026' : displayName

  return (
    <div className="mt-2">
      <Link
        href="/profile"
        className={`relative flex w-full px-3 py-2.5 items-center hover:bg-accent transition-colors duration-200 ${expanded ? 'justify-start gap-3' : 'justify-center'}`}
      >
        <Avatar className="h-8 w-8 border border-border shrink-0">
          <AvatarImage src={localImage || ''} alt={displayName} />
          <AvatarFallback className="font-semibold bg-foreground text-background text-xs">
            {displayName[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        {expanded && (
          <span className="text-[13px] font-medium truncate whitespace-nowrap tracking-tight">
            {truncatedName}
          </span>
        )}
      </Link>
    </div>
  )
}
