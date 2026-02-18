'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from 'next-auth/react'
import { LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSidebarExpanded } from '@/components/sidebar-shell'

interface SidebarProfileProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function SidebarProfile({ user }: SidebarProfileProps) {
  const t = useTranslations('common')
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
  const truncatedName = displayName.length > 14 ? displayName.slice(0, 14) + '…' : displayName

  return (
    <div className="mt-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`relative w-full rounded-lg px-3 py-2 h-auto ${expanded ? 'justify-start gap-3' : 'justify-center'}`}
          >
            <Avatar className="h-8 w-8 border border-border shrink-0">
              <AvatarImage src={localImage || ''} alt={displayName} />
              <AvatarFallback className="font-bold bg-muted text-xs">
                {displayName[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {expanded && (
              <span className="text-sm font-medium truncate whitespace-nowrap">
                {truncatedName}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" side="right" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{localName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>{t('profile')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('settings')}</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600 cursor-pointer"
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t('logOut')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
