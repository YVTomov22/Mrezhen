'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  viewStory,
  toggleStoryLike,
  sendStoryComment,
  deleteStory,
} from '@/app/actions/story'
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Trash2,
  Send,
  BarChart3,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

// ── Types ────────────────────────────────────────────

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

type StoryViewerProps = {
  groups: StoryGroup[]
  initialGroupIndex?: number
  currentUserId: string
  onClose: () => void
  onShare?: (storyId: string) => void
  onInsights?: (storyId: string) => void
}

// ── Constants ────────────────────────────────────────

const STORY_DURATION = 6000 // 6 seconds per story

// ── Component ────────────────────────────────────────

export function StoryViewer({
  groups,
  initialGroupIndex = 0,
  currentUserId,
  onClose,
  onShare,
  onInsights,
}: StoryViewerProps) {
  const router = useRouter()

  const [groupIndex, setGroupIndex] = useState(initialGroupIndex)
  const [storyIndex, setStoryIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showComment, setShowComment] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set())
  const [isCommenting, setIsCommenting] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const commentInputRef = useRef<HTMLInputElement>(null)

  const currentGroup = groups[groupIndex]
  const currentStory = currentGroup?.stories[storyIndex]
  const isOwn = currentStory?.isOwn ?? false

  // Initialize liked state from server data
  useEffect(() => {
    const initial = new Set<string>()
    for (const group of groups) {
      for (const story of group.stories) {
        if (story.likedByMe) initial.add(story.id)
      }
    }
    setLikedStories(initial)
  }, [groups])

  // ── Mark as viewed ──
  useEffect(() => {
    if (!currentStory || currentStory.isOwn || currentStory.viewedByMe) return
    viewStory(currentStory.id)
  }, [currentStory])

  // ── Navigation helpers ──
  const goNextStory = useCallback(() => {
    if (!currentGroup) return

    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((i) => i + 1)
      setProgress(0)
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1)
      setStoryIndex(0)
      setProgress(0)
    } else {
      onClose()
    }
  }, [currentGroup, storyIndex, groupIndex, groups.length, onClose])

  const goPrevStory = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1)
      setProgress(0)
    } else if (groupIndex > 0) {
      setGroupIndex((i) => i - 1)
      const prevGroup = groups[groupIndex - 1]
      setStoryIndex(prevGroup.stories.length - 1)
      setProgress(0)
    }
  }, [storyIndex, groupIndex, groups])

  // ── Auto-advance timer ──
  useEffect(() => {
    if (isPaused || showComment) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    const interval = 50 // update every 50ms
    const step = (interval / STORY_DURATION) * 100

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goNextStory()
          return 0
        }
        return prev + step
      })
    }, interval)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, showComment, goNextStory])

  // ── Keyboard navigation ──
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (showComment) return
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        goNextStory()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrevStory()
      } else if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'p') {
        setIsPaused((p) => !p)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNextStory, goPrevStory, onClose, showComment])

  // ── Actions ──
  async function handleLike() {
    if (!currentStory) return
    const result = await toggleStoryLike(currentStory.id)
    if (result.success) {
      setLikedStories((prev) => {
        const next = new Set(prev)
        if (result.liked) {
          next.add(currentStory.id)
        } else {
          next.delete(currentStory.id)
        }
        return next
      })
    }
  }

  async function handleComment() {
    if (!currentStory || !commentText.trim()) return
    setIsCommenting(true)
    const result = await sendStoryComment(currentStory.id, commentText)
    setIsCommenting(false)
    if (result.success) {
      toast.success('Reply sent as DM')
      setCommentText('')
      setShowComment(false)
    } else {
      toast.error(result.error || 'Failed to send')
    }
  }

  async function handleDelete() {
    if (!currentStory) return
    const result = await deleteStory(currentStory.id)
    if (result.success) {
      toast.success('Story deleted')
      goNextStory()
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to delete')
    }
  }

  if (!currentGroup || !currentStory) return null

  const isLiked = likedStories.has(currentStory.id)

  // ── Time ago ──
  const createdAt = new Date(currentStory.createdAt)
  const hoursAgo = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60))
  const minsAgo = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60))
  const timeLabel = hoursAgo > 0 ? `${hoursAgo}h ago` : `${minsAgo}m ago`

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-white/80 hover:text-white transition-colors"
      >
        <X className="h-7 w-7" />
      </button>

      {/* Left nav */}
      {(groupIndex > 0 || storyIndex > 0) && (
        <button
          type="button"
          onClick={goPrevStory}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-10 w-10" />
        </button>
      )}

      {/* Right nav */}
      {(groupIndex < groups.length - 1 || storyIndex < currentGroup.stories.length - 1) && (
        <button
          type="button"
          onClick={goNextStory}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white/60 hover:text-white transition-colors"
        >
          <ChevronRight className="h-10 w-10" />
        </button>
      )}

      {/* Story card */}
      <div className="relative w-full max-w-[420px] h-full max-h-[780px] rounded-2xl overflow-hidden mx-auto bg-neutral-900 flex flex-col">
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-40 flex gap-1 px-3 pt-2">
          {currentGroup.stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-75 ease-linear"
                style={{
                  width:
                    i < storyIndex
                      ? '100%'
                      : i === storyIndex
                        ? `${Math.min(progress, 100)}%`
                        : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-5 left-0 right-0 z-40 flex items-center gap-3 px-4">
          <Link href={`/profile/${currentGroup.creator.username}`} className="shrink-0">
            <Avatar className="h-9 w-9 border-2 border-white/30">
              <AvatarImage src={currentGroup.creator.image || ''} />
              <AvatarFallback className="text-xs font-bold bg-white/20 text-white">
                {currentGroup.creator.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${currentGroup.creator.username}`}
              className="text-white text-sm font-semibold truncate block hover:underline"
            >
              {currentGroup.creator.username || currentGroup.creator.name}
            </Link>
            <p className="text-white/50 text-[11px]">{timeLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="text-white/70 hover:text-white transition-colors"
          >
            {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </button>
        </div>

        {/* Story content */}
        <div
          className="flex-1 flex items-center justify-center"
          onClick={(e) => {
            // Tap left/right halves
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            if (x < rect.width / 3) goPrevStory()
            else if (x > (rect.width * 2) / 3) goNextStory()
            else setIsPaused((p) => !p)
          }}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {currentStory.mediaType === 'text' ? (
            <div
              className="w-full h-full flex items-center justify-center p-8"
              style={{ backgroundColor: currentStory.backgroundColor || '#1a1a2e' }}
            >
              <p
                className="text-center text-2xl font-bold leading-snug break-words max-w-full"
                style={{ color: currentStory.textColor || '#ffffff' }}
              >
                {currentStory.caption}
              </p>
            </div>
          ) : currentStory.mediaType === 'video' ? (
            <video
              key={currentStory.id}
              src={currentStory.mediaUrl || ''}
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
              loop
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={currentStory.id}
              src={currentStory.mediaUrl || ''}
              alt={currentStory.caption || 'Story'}
              className="w-full h-full object-contain"
              draggable={false}
            />
          )}

          {/* Caption overlay for image/video stories */}
          {currentStory.mediaType !== 'text' && currentStory.caption && (
            <div className="absolute bottom-24 left-0 right-0 px-4">
              <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2.5">
                <p className="text-white text-sm leading-relaxed">{currentStory.caption}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="absolute bottom-0 left-0 right-0 z-40">
          {/* Comment input */}
          {showComment && !isOwn && (
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                <Input
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="Reply to story..."
                  className="flex-1 bg-transparent border-none text-white placeholder:text-white/40 text-sm focus-visible:ring-0 h-8"
                  maxLength={2000}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleComment}
                  disabled={isCommenting || !commentText.trim()}
                  className="text-white/80 hover:text-white disabled:opacity-40 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex items-center gap-4">
              {/* Like */}
              <button
                type="button"
                onClick={handleLike}
                className="text-white/80 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Heart
                  className={`h-6 w-6 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
                />
                {isOwn && currentStory.likeCount > 0 && (
                  <span className="text-white/70 text-xs">{currentStory.likeCount}</span>
                )}
              </button>

              {/* Comment (DM) — not on own stories */}
              {!isOwn && (
                <button
                  type="button"
                  onClick={() => {
                    setShowComment((v) => !v)
                    setTimeout(() => commentInputRef.current?.focus(), 100)
                  }}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <MessageCircle className="h-6 w-6" />
                </button>
              )}

              {/* Share */}
              {onShare && (
                <button
                  type="button"
                  onClick={() => onShare(currentStory.id)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <Share2 className="h-6 w-6" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Insights (own stories) */}
              {isOwn && (
                <>
                  <button
                    type="button"
                    onClick={() => onInsights?.(currentStory.id)}
                    className="text-white/80 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <BarChart3 className="h-5 w-5" />
                  </button>
                  <span className="text-white/50 text-xs flex items-center gap-1">
                    <Eye className="h-4 w-4" /> {currentStory.viewCount}
                  </span>
                </>
              )}

              {/* Delete (own stories) */}
              {isOwn && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-white/80 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
