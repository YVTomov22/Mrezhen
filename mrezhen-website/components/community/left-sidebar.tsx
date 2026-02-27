import Link from 'next/link'
import { StoryAvatarRing } from '@/components/story/story-avatar-ring'
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
  hasActiveStory?: boolean
}

/* ── XP Progress Bar ────────────────────────────────── */
function XpProgressBar({ level, score }: { level: number; score: number }) {
  const xpPerLevel = 1000
  const xpInCurrentLevel = score % xpPerLevel
  const progress = Math.min((xpInCurrentLevel / xpPerLevel) * 100, 100)

  return (
    <div className="w-full mt-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium text-muted-foreground">Level {level}</span>
        <span className="text-[10px] tabular-nums text-muted-foreground">{xpInCurrentLevel} / {xpPerLevel} XP</span>
      </div>
      <div className="xp-bar-track h-[6px] w-full rounded-full bg-muted/80 overflow-hidden">
        <div
          className="xp-bar-fill h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export function CommunityLeftSidebar({ user, hasActiveStory = false }: LeftSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Mini Profile */}
      <div>
        <Link href={`/profile/${user.username ?? user.id}`} className="flex items-center gap-3 group">
          <StoryAvatarRing
            userId={user.id}
            image={user.image}
            name={user.name}
            hasActiveStory={hasActiveStory}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-tight truncate group-hover:underline underline-offset-2">{user.name}</p>
          </div>
        </Link>
        {/* Gamified XP Progress Bar */}
        <XpProgressBar level={user.level} score={user.score} />
      </div>

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
          href={`/profile/${user.username ?? user.id}`}
          className="flex items-center gap-3 px-3 py-2.5 text-sm tracking-tight text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors"
        >
          <FileText className="h-4 w-4" />
          My Posts
        </Link>
      </nav>

      <div className="h-px bg-border/60" />

      {/* Trending Topics — Interactive Pills */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground px-1 uppercase tracking-wider">
          Trending
        </h3>
        <div className="flex flex-wrap gap-2">
          {['productivity', 'goals', 'motivation', 'learning', 'growth'].map((tag) => (
            <button
              key={tag}
              type="button"
              className="trending-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-full border transition-all duration-200 text-muted-foreground bg-muted/40 border-border/60 hover:border-primary hover:text-primary hover:-translate-y-0.5 hover:shadow-sm"
            >
              <Hash className="h-3 w-3 shrink-0" />
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
