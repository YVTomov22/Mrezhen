'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StoryViewer } from '@/components/story/story-viewer'
import { StoryInsightsSheet } from '@/components/story/story-insights-sheet'
import { getUserStories } from '@/app/actions/story'

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
  userId: string
  image: string | null
  name: string | null
  hasActiveStory: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const sizeMap = {
  xs: { avatar: 'h-9 w-9', ring: 'p-[2px]', text: 'text-xs' },
  sm: { avatar: 'h-10 w-10', ring: 'p-[2px]', text: 'text-xs' },
  md: { avatar: 'h-12 w-12', ring: 'p-[2.5px]', text: 'text-sm' },
  lg: { avatar: 'h-20 w-20', ring: 'p-[3px]', text: 'text-2xl' },
}

export function StoryAvatarRing({ userId, image, name, hasActiveStory, size = 'lg' }: Props) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(false)

  const [insightsStoryId, setInsightsStoryId] = useState<string | null>(null)
  const [insightsOpen, setInsightsOpen] = useState(false)

  const s = sizeMap[size]

  async function handleClick() {
    if (!hasActiveStory) return

    setLoading(true)
    try {
      const result = await getUserStories(userId)
      if (result.stories.length > 0) {
        setStoryGroups(result.stories)
        setCurrentUserId(result.currentUserId)
        setViewerOpen(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || !hasActiveStory}
        className={`shrink-0 rounded-full ${
          hasActiveStory
            ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 cursor-pointer hover:scale-105 transition-transform'
            : ''
        } ${hasActiveStory ? s.ring : ''}`}
      >
        <Avatar className={`${s.avatar} ${hasActiveStory ? 'border-[2.5px] border-background' : 'border border-border'}`}>
          <AvatarImage src={image || ''} />
          <AvatarFallback className={`${s.text} font-black bg-foreground text-background`}>
            {name?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Fullscreen Story Viewer */}
      {viewerOpen && storyGroups.length > 0 && (
        <StoryViewer
          groups={storyGroups}
          initialGroupIndex={0}
          currentUserId={currentUserId}
          onClose={() => setViewerOpen(false)}
          onInsights={(id) => {
            setInsightsStoryId(id)
            setInsightsOpen(true)
          }}
        />
      )}

      <StoryInsightsSheet
        storyId={insightsStoryId}
        open={insightsOpen}
        onClose={() => { setInsightsOpen(false); setInsightsStoryId(null) }}
      />
    </>
  )
}
