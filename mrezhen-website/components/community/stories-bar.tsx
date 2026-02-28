'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StoryComposer } from '@/components/story/story-composer'
import { StoryViewer } from '@/components/story/story-viewer'
import { StoryInsightsSheet } from '@/components/story/story-insights-sheet'
import { StoryShareDialog } from '@/components/story/story-share-dialog'

type StoryUser = {
  id: string
  name: string | null
  username: string | null
  image: string | null
  allViewed?: boolean
}

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

type StoriesBarProps = {
  currentUser: StoryUser
  storyUsers: StoryUser[]
  storyGroups: StoryGroup[]
  currentUserId: string
  hasOwnStory: boolean
  shareableUsers?: { id: string; name: string | null; username: string | null; image: string | null }[]
}

export function StoriesBar({
  currentUser,
  storyUsers,
  storyGroups,
  currentUserId,
  hasOwnStory,
  shareableUsers = [],
}: StoriesBarProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerGroupIndex, setViewerGroupIndex] = useState(0)

  const [insightsStoryId, setInsightsStoryId] = useState<string | null>(null)
  const [insightsOpen, setInsightsOpen] = useState(false)

  const [shareStoryId, setShareStoryId] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  function openViewer(groupIndex: number) {
    setViewerGroupIndex(groupIndex)
    setViewerOpen(true)
  }

  function handleOpenOwnStory() {
    // Find own story group index
    const idx = storyGroups.findIndex((g) => g.creatorId === currentUserId)
    if (idx >= 0) openViewer(idx)
  }

  return (
    <>
      <div className="flex flex-row items-start gap-5 py-2 overflow-x-auto no-scrollbar">
        {/* Your Story — wraps both composer and tap-to-view */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          {hasOwnStory ? (
            <button
              type="button"
              onClick={handleOpenOwnStory}
              className="group"
            >
              <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-full p-[2.5px] shadow-sm">
                <Avatar className="h-[60px] w-[60px] border-[2.5px] border-background">
                  <AvatarImage src={currentUser.image || ''} />
                  <AvatarFallback className="text-sm font-bold bg-foreground text-background">
                    {currentUser.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="editorial-caption text-muted-foreground group-hover:text-foreground transition-colors truncate w-14 text-center !text-[9px] block mt-1.5">
                Your story
              </span>
            </button>
          ) : (
            <StoryComposer />
          )}
        </div>

        {/* Add story button when user already has one */}
        {hasOwnStory && <StoryComposer />}

        {storyUsers.length > 0 && <div className="h-10 w-px self-center bg-border" />}

        {/* Other users' stories */}
        {storyUsers.map((user) => {
          const groupIdx = storyGroups.findIndex((g) => g.creatorId === user.id)
          if (groupIdx < 0) return null

          return (
            <button
              key={user.id}
              className="flex flex-col items-center gap-1.5 group shrink-0"
              type="button"
              onClick={() => openViewer(groupIdx)}
            >
              <div
                className={`rounded-full p-[2.5px] shadow-sm ${
                  user.allViewed
                    ? 'bg-muted-foreground/30'
                    : 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600'
                }`}
              >
                <Avatar className="h-[60px] w-[60px] border-[2.5px] border-background">
                  <AvatarImage src={user.image || ''} />
                  <AvatarFallback className="text-sm font-bold bg-foreground text-background">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="editorial-caption text-muted-foreground group-hover:text-foreground transition-colors truncate w-16 text-center !text-[9px]">
                {user.username || user.name?.split(' ')[0] || 'User'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Fullscreen story viewer */}
      {viewerOpen && storyGroups.length > 0 && (
        <StoryViewer
          groups={storyGroups}
          initialGroupIndex={viewerGroupIndex}
          currentUserId={currentUserId}
          onClose={() => setViewerOpen(false)}
          onShare={(id) => {
            setShareStoryId(id)
            setShareOpen(true)
          }}
          onInsights={(id) => {
            setInsightsStoryId(id)
            setInsightsOpen(true)
          }}
        />
      )}

      {/* Insights sheet */}
      <StoryInsightsSheet
        storyId={insightsStoryId}
        open={insightsOpen}
        onClose={() => { setInsightsOpen(false); setInsightsStoryId(null) }}
      />

      {/* Share dialog */}
      <StoryShareDialog
        storyId={shareStoryId}
        open={shareOpen}
        onClose={() => { setShareOpen(false); setShareStoryId(null) }}
        users={shareableUsers}
      />
    </>
  )
}
