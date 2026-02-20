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
    <div className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = iconMap[item.icon]
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <Link
            key={item.href}
            href={item.href}
            title={!expanded ? item.label : undefined}
            className={cn(
              "flex items-center justify-center gap-4 px-3 py-3 transition-all duration-200",
              expanded && "justify-start",
              isActive && "text-amber-700 dark:text-[#14B8A6] font-semibold dark:bg-[#042F2E] border-l-2 border-transparent dark:border-[#14B8A6]/60",
              !isActive && "text-muted-foreground hover:text-foreground border-l-2 border-transparent"
            )}
          >
            <Icon className={cn(
              "h-[22px] w-[22px] shrink-0 transition-all duration-200",
              isActive && "stroke-[2.5px] text-amber-600 dark:text-[#14B8A6]"
            )} />
            {expanded && (
              <span className="text-[13px] whitespace-nowrap tracking-tight">
                {item.label}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
