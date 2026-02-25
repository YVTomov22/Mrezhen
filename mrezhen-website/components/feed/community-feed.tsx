'use client'

import { Flame } from 'lucide-react'
import { FeedProvider, useFeed, type PostData } from '@/components/feed/feed-context'
import { PostCard } from '@/components/feed/post-card'
import { cn } from '@/lib/utils'

/* ── Inner content (uses context) ─────────────────── */

function FeedTabs() {
  const { posts } = useFeed()

  return (
    <div className="space-y-6">
      {/* Post list */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted/80 p-5 mb-4">
            <Flame className={cn('h-8 w-8', 'text-orange-400')} />
          </div>
          <h3 className="text-base font-semibold mb-1">No posts yet</h3>
          <p className="text-sm text-muted-foreground max-w-[260px]">Be the first to share something with the community!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>
      )}
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
