'use client'

import { useState } from 'react'
import { Heart, Bookmark, Flame } from 'lucide-react'
import { FeedProvider, useFeed, type PostData } from '@/components/feed/feed-context'
import { PostCard } from '@/components/feed/post-card'
import { cn } from '@/lib/utils'

/* ── Tab definitions ──────────────────────────────── */

const TABS = [
  { id: 'feed', label: 'For You', icon: Flame },
  { id: 'liked', label: 'Liked', icon: Heart },
  { id: 'saved', label: 'Saved', icon: Bookmark },
] as const

type TabId = (typeof TABS)[number]['id']

/* ── Inner content (uses context) ─────────────────── */

function FeedTabs() {
  const { posts, likedPosts, savedPosts } = useFeed()
  const [activeTab, setActiveTab] = useState<TabId>('feed')

  const tabPosts: Record<TabId, PostData[]> = {
    feed: posts,
    liked: likedPosts,
    saved: savedPosts,
  }

  const current = tabPosts[activeTab]

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-2xl p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 transition-all duration-200',
                  isActive && tab.id === 'liked' && 'text-rose-500',
                  isActive && tab.id === 'saved' && 'text-amber-500 dark:text-sky-400',
                  isActive && tab.id === 'feed' && 'text-orange-500',
                )}
              />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Post list */}
      {current.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-4">
          {current.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Empty states ─────────────────────────────────── */

function EmptyState({ tab }: { tab: TabId }) {
  const config = {
    feed: {
      icon: Flame,
      title: 'No posts yet',
      description: 'Be the first to share something with the community!',
      color: 'text-orange-400',
    },
    liked: {
      icon: Heart,
      title: 'No liked posts',
      description: 'Posts you like will appear here. Start exploring!',
      color: 'text-rose-400',
    },
    saved: {
      icon: Bookmark,
      title: 'No saved posts',
      description: 'Bookmark posts to find them easily later.',
      color: 'text-amber-400 dark:text-sky-400',
    },
  }

  const { icon: Icon, title, description, color } = config[tab]

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-muted/80 p-5 mb-4">
        <Icon className={cn('h-8 w-8', color)} />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[260px]">{description}</p>
    </div>
  )
}

/* ── Exported wrapper (provides context) ──────────── */

export function CommunityFeed({ initialPosts }: { initialPosts: PostData[] }) {
  return (
    <FeedProvider initialPosts={initialPosts}>
      <FeedTabs />
    </FeedProvider>
  )
}
