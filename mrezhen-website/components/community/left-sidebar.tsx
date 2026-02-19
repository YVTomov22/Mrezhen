import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Flame, Bookmark, Heart, FileText, Hash } from 'lucide-react'

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
    <div className="space-y-5">
      {/* Mini Profile Card */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-4 pb-3">
          <Link href={`/profile/${user.username}`} className="flex items-center gap-3 group">
            <Avatar className="h-10 w-10 border border-border shrink-0">
              <AvatarImage src={user.image || ''} />
              <AvatarFallback className="text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate group-hover:underline">{user.name}</p>
              <p className="text-[11px] text-muted-foreground">
                Level {user.level} &middot; {user.score} XP
              </p>
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <nav className="space-y-0.5">
        <Link
          href="/community"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground bg-accent/60 hover:bg-accent transition-colors"
        >
          <Flame className="h-4 w-4 text-orange-500" />
          For You
        </Link>
        <Link
          href="/community?filter=saved"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Bookmark className="h-4 w-4" />
          Saved Posts
        </Link>
        <Link
          href="/community?filter=liked"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Heart className="h-4 w-4" />
          Liked Posts
        </Link>
        <Link
          href={`/profile/${user.username}`}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <FileText className="h-4 w-4" />
          My Posts
        </Link>
      </nav>

      {/* Trending Topics */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3">
          Trending
        </h3>
        <div className="space-y-0.5">
          {['productivity', 'goals', 'motivation', 'learning', 'growth'].map((tag) => (
            <button
              key={tag}
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 w-full rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left"
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
