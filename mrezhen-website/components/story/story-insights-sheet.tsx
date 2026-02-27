'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getStoryInsights } from '@/app/actions/story'
import { Eye, Heart, Loader2 } from 'lucide-react'
import Link from 'next/link'

type InsightsUser = {
  id: string
  name: string | null
  username: string | null
  image: string | null
  viewedAt?: string
  likedAt?: string
}

type InsightsData = {
  viewCount: number
  likeCount: number
  viewers: InsightsUser[]
  likers: InsightsUser[]
}

type Props = {
  storyId: string | null
  open: boolean
  onClose: () => void
}

export function StoryInsightsSheet({ storyId, open, onClose }: Props) {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!storyId || !open) return

    setLoading(true)
    getStoryInsights(storyId).then((result) => {
      if ('insights' in result && result.insights) {
        setData(result.insights)
      }
      setLoading(false)
    })
  }, [storyId, open])

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold tracking-tight">Story Insights</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="mt-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-3">
                <div className="bg-blue-500/10 p-2.5 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{data.viewCount}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-3">
                <div className="bg-red-500/10 p-2.5 rounded-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{data.likeCount}</p>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </div>
              </div>
            </div>

            <Tabs defaultValue="viewers">
              <TabsList className="w-full">
                <TabsTrigger value="viewers" className="flex-1 gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> Viewers ({data.viewCount})
                </TabsTrigger>
                <TabsTrigger value="likers" className="flex-1 gap-1.5">
                  <Heart className="h-3.5 w-3.5" /> Likes ({data.likeCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="viewers" className="mt-4 space-y-2 max-h-[35vh] overflow-y-auto">
                {data.viewers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No viewers yet</p>
                ) : (
                  data.viewers.map((v) => (
                    <UserRow key={v.id} user={v} timeLabel={v.viewedAt} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="likers" className="mt-4 space-y-2 max-h-[35vh] overflow-y-auto">
                {data.likers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No likes yet</p>
                ) : (
                  data.likers.map((l) => (
                    <UserRow key={l.id} user={l} timeLabel={l.likedAt} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">Failed to load insights</p>
        )}
      </SheetContent>
    </Sheet>
  )
}

function UserRow({ user, timeLabel }: { user: InsightsUser; timeLabel?: string }) {
  const timeAgo = timeLabel ? formatTimeAgo(new Date(timeLabel)) : ''

  return (
    <Link
      href={`/profile/${user.username}`}
      className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <Avatar className="h-9 w-9 border border-border">
        <AvatarImage src={user.image || ''} />
        <AvatarFallback className="text-xs font-bold bg-foreground text-background">
          {user.name?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.username || user.name}</p>
        {user.name && user.username && (
          <p className="text-xs text-muted-foreground truncate">{user.name}</p>
        )}
      </div>
      {timeAgo && (
        <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
      )}
    </Link>
  )
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}
