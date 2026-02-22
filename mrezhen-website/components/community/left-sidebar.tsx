import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bookmark, Heart, FileText, Hash } from 'lucide-react'

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
        <Avatar className="h-9 w-9 border border-border shrink-0">
          <AvatarImage src={user.image || ''} />
          <AvatarFallback className="text-xs font-bold bg-foreground text-background">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold tracking-tight truncate group-hover:underline underline-offset-2">{user.name}</p>
          <p className="editorial-caption text-muted-foreground !text-[10px]">
            Level {user.level} &middot; {user.score} XP
          </p>
        </div>
      </Link>

      <div className="h-px bg-border" />

      {/* Quick Navigation */}
      <nav className="space-y-0.5">
        <Link
          href="/community"
          className="flex items-center gap-3 px-2 py-2 text-[13px] font-semibold tracking-tight text-amber-700 dark:text-[#22D3EE] dark:bg-[#042F2E] border-l-2 border-amber-500 dark:border-[#22D3EE]/60"
        >
          For You
        </Link>
        <Link
          href="/community?filter=saved"
          className="flex items-center gap-3 px-2 py-2 text-[13px] tracking-tight text-muted-foreground hover:text-amber-700 dark:hover:text-[#14B8A6] border-l-2 border-transparent hover:border-amber-400 dark:hover:border-[#14B8A6]/50 transition-colors"
        >
          <Bookmark className="h-3.5 w-3.5" />
          Saved
        </Link>
        <Link
          href="/community?filter=liked"
          className="flex items-center gap-3 px-2 py-2 text-[13px] tracking-tight text-muted-foreground hover:text-amber-700 dark:hover:text-[#14B8A6] border-l-2 border-transparent hover:border-amber-400 dark:hover:border-[#14B8A6]/50 transition-colors"
        >
          <Heart className="h-3.5 w-3.5" />
          Liked
        </Link>
        <Link
          href={`/profile/${user.username}`}
          className="flex items-center gap-3 px-2 py-2 text-[13px] tracking-tight text-muted-foreground hover:text-amber-700 dark:hover:text-[#14B8A6] border-l-2 border-transparent hover:border-amber-400 dark:hover:border-[#14B8A6]/50 transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
          My Posts
        </Link>
      </nav>

      <div className="h-px bg-border" />

      {/* Trending Topics */}
      <div className="space-y-2">
        <h3 className="editorial-caption text-muted-foreground px-2">
          Trending
        </h3>
        <div className="space-y-0.5">
          {['productivity', 'goals', 'motivation', 'learning', 'growth'].map((tag) => (
            <button
              key={tag}
              type="button"
              className="flex items-center gap-2 px-2 py-1.5 w-full text-[13px] text-muted-foreground hover:text-foreground transition-colors text-left tracking-tight"
            >
              <Hash className="h-3 w-3 shrink-0 text-muted-foreground/60" />
              <span className="truncate">{tag}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
