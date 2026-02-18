'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { togglePostLike, addPostComment, togglePostBookmark } from '@/app/actions/posts'
import { cn } from '@/lib/utils'
import type { ChangeEvent } from 'react'

type Author = {
  name: string | null
  username: string | null
  image: string | null
}

type PostImage = {
  id: string
  url: string
}

type Comment = {
  id: string
  content: string
  createdAt: string
  author: Author
}

type PostCardProps = {
  id: string
  content: string | null
  createdAt: string
  author: Author
  images: PostImage[]
  likeCount: number
  commentCount: number
  likedByMe: boolean
  bookmarkedByMe: boolean
  recentComments: Comment[]
}

export function PostCard(props: PostCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [liked, setLiked] = useState(props.likedByMe)
  const [likeCount, setLikeCount] = useState(props.likeCount)
  const [bookmarked, setBookmarked] = useState(props.bookmarkedByMe)

  async function onLike() {
    setError(null)
    // Optimistic update
    setLiked((prev) => !prev)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
    startTransition(async () => {
      const res = await togglePostLike(props.id)
      if ('error' in res && res.error) {
        // Revert optimistic update
        setLiked((prev) => !prev)
        setLikeCount((prev) => (liked ? prev + 1 : prev - 1))
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  async function onBookmark() {
    setError(null)
    setBookmarked((prev) => !prev)
    startTransition(async () => {
      const res = await togglePostBookmark(props.id)
      if ('error' in res && res.error) {
        setBookmarked((prev) => !prev)
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  async function onAddComment() {
    const trimmed = comment.trim()
    if (!trimmed) return

    setError(null)
    startTransition(async () => {
      const res = await addPostComment(props.id, trimmed)
      if ('error' in res && res.error) {
        setError(res.error)
        return
      }
      setComment('')
      router.refresh()
    })
  }

  function onShare() {
    const url = `${window.location.origin}/community?post=${props.id}`
    if (navigator.share) {
      navigator.share({ title: 'Check out this post', url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  const displayName = props.author.username || props.author.name || 'User'
  const when = new Date(props.createdAt).toLocaleString()

  return (
    <div className="border-2 border-border rounded-xl bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={props.author.image || ''} />
          <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
            {displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={props.author.username ? `/profile/${props.author.username}` : '#'}
              className="font-bold text-sm truncate hover:underline"
            >
              {displayName}
            </Link>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{when}</span>
          </div>
        </div>
      </div>

      {/* Images */}
      {props.images.length > 0 && (
        <div className={props.images.length === 1 ? '' : 'grid grid-cols-2 gap-1'}>
          {props.images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt="Post image"
              className="w-full object-cover max-h-[520px] bg-muted"
            />
          ))}
        </div>
      )}

      {/* Content */}
      {props.content && (
        <div className="px-4 pt-3">
          <p className="text-sm text-foreground whitespace-pre-wrap">{props.content}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border mt-3">
        {/* Left: Like, Comment, Share */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            disabled={isPending}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Heart className={cn("h-5 w-5", liked && "fill-red-500 text-red-500")} />
            <span className="text-xs">{likeCount > 0 ? likeCount : ''}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments((prev) => !prev)}
            className={cn("gap-1.5 text-muted-foreground hover:text-foreground", showComments && "text-foreground")}
          >
            <MessageCircle className={cn("h-5 w-5", showComments && "fill-foreground")} />
            <span className="text-xs">{props.commentCount > 0 ? props.commentCount : ''}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Right: Save / Bookmark */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBookmark}
          disabled={isPending}
          className="text-muted-foreground hover:text-foreground"
        >
          <Bookmark className={cn("h-5 w-5", bookmarked && "fill-foreground text-foreground")} />
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 px-4 pb-2">{error}</p>}

      {/* Comments Section (collapsed by default) */}
      {showComments && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {props.recentComments.length > 0 && (
            <div className="space-y-2">
              {props.recentComments
                .slice()
                .reverse()
                .map((c) => {
                  const name = c.author.username || c.author.name || 'User'
                  return (
                    <div key={c.id} className="text-sm">
                      <span className="font-semibold mr-2">{name}</span>
                      <span className="text-foreground">{c.content}</span>
                    </div>
                  )
                })}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={comment}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
              placeholder="Add a comment..."
              disabled={isPending}
              onKeyDown={(e) => e.key === 'Enter' && onAddComment()}
            />
            <Button onClick={onAddComment} disabled={isPending || !comment.trim()} size="sm">
              Post
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
