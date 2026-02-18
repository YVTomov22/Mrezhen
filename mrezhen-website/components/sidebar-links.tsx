'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, LayoutDashboard, Target, MessageSquareText, Sparkles, Heart, Settings, Search, PlusSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebarExpanded } from '@/components/sidebar-shell'

const iconMap = {
  home: Home,
  dashboard: LayoutDashboard,
  target: Target,
  messages: MessageSquareText,
  sparkles: Sparkles,
  heart: Heart,
  settings: Settings,
  search: Search,
  plus: PlusSquare,
} as const

interface NavItem {
  href: string
  label: string
  icon: keyof typeof iconMap
}

interface SidebarLinksProps {
  items: NavItem[]
}

export function SidebarLinks({ items }: SidebarLinksProps) {
  const pathname = usePathname()
  const expanded = useSidebarExpanded()

  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = iconMap[item.icon]
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        const isGradient = item.icon === 'sparkles'

        return (
          <Link
            key={item.href}
            href={item.href}
            title={!expanded ? item.label : undefined}
            className={cn(
              "flex items-center justify-center gap-4 px-3 py-3 rounded-lg transition-all",
              expanded && "justify-start",
              isGradient && "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 shadow-md",
              !isGradient && isActive && "bg-muted font-semibold text-foreground",
              !isGradient && !isActive && "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className={cn(
              "h-6 w-6 shrink-0",
              isGradient && "fill-white",
              !isGradient && isActive && "stroke-[2.5px]"
            )} />
            {expanded && <span className="text-sm whitespace-nowrap">{item.label}</span>}
          </Link>
        )
      })}
    </div>
  )
}
