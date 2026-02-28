'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StoryViewer } from '@/components/story/story-viewer'
import { StoryInsightsSheet } from '@/components/story/story-insights-sheet'
import { StoryShareDialog } from '@/components/story/story-share-dialog'

type StoryItem = {
  id: string
  mediaUrl: string | null
  mediaType: string
  caption: string | null
  backgroundColor: string | null
  textColor: string | null
  audience: string
  expiresAt: string
  createdAt: string
  viewedByMe: boolean
  likedByMe: boolean
  viewCount: number
  likeCount: number
  isOwn: boolean
}

type StoryGroup = {
  creatorId: string
  creator: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  }
  allViewed: boolean
  stories: StoryItem[]
}

type Props = {
  groups: StoryGroup[]
  currentUserId: string
  initialGroupIndex: number
  shareableUsers: { id: string; name: string | null; username: string | null; image: string | null }[]
}

export function StoriesPageClient({ groups, currentUserId, initialGroupIndex, shareableUsers }: Props) {
  const router = useRouter()

  const [insightsStoryId, setInsightsStoryId] = useState<string | null>(null)
  const [insightsOpen, setInsightsOpen] = useState(false)

  const [shareStoryId, setShareStoryId] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  if (groups.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <div className="text-center text-white/60">
          <p className="text-lg font-medium mb-2">No stories yet</p>
          <button
            type="button"
            onClick={() => router.push('/community')}
            className="text-sm text-white/40 hover:text-white transition-colors underline"
          >
            Go back to community
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <StoryViewer
        groups={groups}
        initialGroupIndex={initialGroupIndex}
        currentUserId={currentUserId}
        onClose={() => router.push('/community')}
        onShare={(id) => {
          setShareStoryId(id)
          setShareOpen(true)
        }}
        onInsights={(id) => {
          setInsightsStoryId(id)
          setInsightsOpen(true)
        }}
      />

      <StoryInsightsSheet
        storyId={insightsStoryId}
        open={insightsOpen}
        onClose={() => { setInsightsOpen(false); setInsightsStoryId(null) }}
      />

      <StoryShareDialog
        storyId={shareStoryId}
        open={shareOpen}
        onClose={() => { setShareOpen(false); setShareStoryId(null) }}
        users={shareableUsers}
      />
    </>
  )
}
