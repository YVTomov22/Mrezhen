'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, MessageCircle, Share2, Bookmark, CornerDownRight } from 'lucide-react'
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

type CommentReply = {
  id: string
  content: string
  createdAt: string
  author: Author
}

type Comment = {
  id: string
  content: string
  createdAt: string
  author: Author
  replies: CommentReply[]
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
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null)
  const commentInputRef = useRef<HTMLInputElement>(null)

  async function onLike() {
    setError(null)
    setLiked((prev) => !prev)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
    startTransition(async () => {
      const res = await togglePostLike(props.id)
      if ('error' in res && res.error) {
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
    const parentId = replyingTo?.id || undefined
    startTransition(async () => {
      const res = await addPostComment(props.id, trimmed, parentId)
      if ('error' in res && res.error) {
        setError(res.error)
        return
      }
      setComment('')
      setReplyingTo(null)
      router.refresh()
    })
  }

  function onReply(commentId: string, authorName: string) {
    setReplyingTo({ id: commentId, name: authorName })
    setShowComments(true)
    setTimeout(() => commentInputRef.current?.focus(), 100)
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

      {/* ── Animated Comment Section (slide-down / fade-in) ── */}
      <div className="comment-collapse" data-open={showComments}>
        <div>
          <div className="border-t border-border px-4 py-3 space-y-3">
            {props.recentComments.length > 0 && (
              <div className="space-y-3">
                {props.recentComments
                  .slice()
                  .reverse()
                  .map((c) => {
                    const name = c.author.username || c.author.name || 'User'
                    return (
                      <div key={c.id} className="space-y-2">
                        {/* ─ Parent comment ─ */}
                        <div className="flex items-start gap-2.5">
                          <Avatar className="h-7 w-7 mt-0.5 shrink-0 border border-border">
                            <AvatarImage src={c.author.image || ''} />
                            <AvatarFallback className="text-[10px] font-bold">
                              {name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-semibold">{name}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-foreground mt-0.5">{c.content}</p>
                            <button
                              type="button"
                              onClick={() => onReply(c.id, name)}
                              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground mt-1 transition-colors"
                            >
                              <CornerDownRight className="h-3 w-3" />
                              Reply
                            </button>
                          </div>
                        </div>

                        {/* ─ Nested replies ─ */}
                        {c.replies && c.replies.length > 0 && (
                          <div className="ml-9 pl-3 border-l-2 border-border space-y-2">
                            {c.replies.map((r) => {
                              const rName = r.author.username || r.author.name || 'User'
                              return (
                                <div key={r.id} className="flex items-start gap-2">
                                  <Avatar className="h-6 w-6 mt-0.5 shrink-0 border border-border">
                                    <AvatarImage src={r.author.image || ''} />
                                    <AvatarFallback className="text-[9px] font-bold">
                                      {rName[0]?.toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-xs font-semibold">{rName}</span>
                                      <span className="text-[10px] text-muted-foreground">
                                        {new Date(r.createdAt).toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="text-xs text-foreground mt-0.5">{r.content}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Reply indicator */}
            {replyingTo && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                <CornerDownRight className="h-3 w-3 shrink-0" />
                <span>
                  Replying to <strong className="text-foreground">{replyingTo.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Comment input */}
            <div className="flex gap-2">
              <Input
                ref={commentInputRef}
                value={comment}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
                placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : 'Add a comment...'}
                disabled={isPending}
                onKeyDown={(e) => e.key === 'Enter' && onAddComment()}
              />
              <Button onClick={onAddComment} disabled={isPending || !comment.trim()} size="sm">
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
