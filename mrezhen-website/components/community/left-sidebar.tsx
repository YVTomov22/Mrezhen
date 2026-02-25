import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FileText, Hash, Users } from 'lucide-react'

type UserProfile = {
  id: string
  name: string | null
  username: string | null
  image: string | null
  level: number
  score: number
}

type LeftSidebarProps = {
  user: UserProfile
}

export function CommunityLeftSidebar({ user }: LeftSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Mini Profile */}
      <Link href={`/profile/${user.username}`} className="flex items-center gap-3 group">
        <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
          <AvatarImage src={user.image || ''} />
          <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight truncate group-hover:underline underline-offset-2">{user.name}</p>
          <p className="text-[11px] text-muted-foreground">
            Level {user.level} &middot; {user.score} XP
          </p>
        </div>
      </Link>

      <div className="h-px bg-border/60" />

      {/* Quick Navigation */}
      <nav className="space-y-1">
        <Link
          href="/community"
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium tracking-tight rounded-xl bg-primary/10 text-primary"
        >
          <Users className="h-4 w-4" />
          Community
        </Link>
        <Link
          href={`/profile/${user.username}`}
          className="flex items-center gap-3 px-3 py-2.5 text-sm tracking-tight text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors"
        >
          <FileText className="h-4 w-4" />
          My Posts
        </Link>
      </nav>

      <div className="h-px bg-border/60" />

      {/* Trending Topics */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground px-3 uppercase tracking-wider">
          Trending
        </h3>
        <div className="space-y-0.5">
          {['productivity', 'goals', 'motivation', 'learning', 'growth'].map((tag) => (
            <button
              key={tag}
              type="button"
              className="flex items-center gap-2.5 px-3 py-2 w-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors text-left"
            >
              <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <span className="truncate">{tag}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
