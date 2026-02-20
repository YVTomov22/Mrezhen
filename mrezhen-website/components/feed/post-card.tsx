'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, MessageCircle, Share2, Bookmark, CornerDownRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { togglePostLike, addPostComment, togglePostBookmark, toggleCommentLike } from '@/app/actions/posts'
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
  likedByMe: boolean
  likeCount: number
}

type Comment = {
  id: string
  content: string
  createdAt: string
  author: Author
  likedByMe: boolean
  likeCount: number
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

  const [commentLikes, setCommentLikes] = useState<Map<string, { liked: boolean; count: number }>>(() => {
    const m = new Map<string, { liked: boolean; count: number }>()
    props.recentComments.forEach((c) => {
      m.set(c.id, { liked: c.likedByMe, count: c.likeCount })
      c.replies.forEach((r) => m.set(r.id, { liked: r.likedByMe, count: r.likeCount }))
    })
    return m
  })

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

  function onLikeComment(id: string) {
    const cur = commentLikes.get(id) ?? { liked: false, count: 0 }
    setCommentLikes((prev) => {
      const next = new Map(prev)
      next.set(id, { liked: !cur.liked, count: cur.liked ? cur.count - 1 : cur.count + 1 })
      return next
    })
    startTransition(async () => {
      const res = await toggleCommentLike(id)
      if ('error' in res && res.error) {
        setCommentLikes((prev) => {
          const next = new Map(prev)
          next.set(id, cur)
          return next
        })
      }
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
    <article className="border-b border-border pb-8 mb-8 last:border-b-0 last:pb-0 last:mb-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-9 w-9 border border-border">
          <AvatarImage src={props.author.image || ''} />
          <AvatarFallback className="bg-foreground text-background text-xs font-bold">
            {displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <Link
            href={props.author.username ? `/profile/${props.author.username}` : '#'}
            className="text-[13px] font-semibold tracking-tight hover:underline underline-offset-2"
          >
            {displayName}
          </Link>
          <p className="editorial-caption text-muted-foreground !text-[10px]">{when}</p>
        </div>
      </div>

      {/* Content */}
      {props.content && (
        <div className="mb-4">
          <p className="editorial-body text-[15px]">{props.content}</p>
        </div>
      )}

      {/* Images */}
      {props.images.length > 0 && (
        <div className={cn("mb-4", props.images.length === 1 ? '' : 'grid grid-cols-2 gap-1')}>
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

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            disabled={isPending}
            className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2"
          >
            <Heart className={cn("h-[18px] w-[18px] transition-colors", liked && "fill-amber-500 text-amber-500 dark:fill-[#22D3EE] dark:text-[#22D3EE]")} />
            <span className="text-[11px] tabular-nums">{likeCount > 0 ? likeCount : ''}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments((prev) => !prev)}
            className={cn("gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2", showComments && "text-foreground")}
          >
            <MessageCircle className={cn("h-[18px] w-[18px]", showComments && "fill-foreground")} />
            <span className="text-[11px] tabular-nums">{props.commentCount > 0 ? props.commentCount : ''}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="text-muted-foreground hover:text-foreground h-8 px-2"
          >
            <Share2 className="h-[18px] w-[18px]" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onBookmark}
          disabled={isPending}
          className="text-muted-foreground hover:text-foreground h-8 px-2"
        >
          <Bookmark className={cn("h-[18px] w-[18px]", bookmarked && "fill-foreground text-foreground dark:fill-[#0095F6] dark:text-[#0095F6]")} />
        </Button>
      </div>

      {error && <p className="text-[12px] text-foreground mt-2">{error}</p>}

      {/* ── Comment Section ── */}
      <div className="comment-collapse" data-open={showComments}>
        <div>
          <div className="border-t border-border mt-4 pt-4 space-y-3">
            {props.recentComments.length > 0 && (
              <div className="space-y-3">
                {props.recentComments
                  .slice()
                  .reverse()
                  .map((c) => {
                    const name = c.author.username || c.author.name || 'User'
                    const profileHref = c.author.username ? `/profile/${c.author.username}` : '#'
                    const cLike = commentLikes.get(c.id) ?? { liked: false, count: 0 }
                    return (
                      <div key={c.id} className="space-y-2">
                        <div className="flex items-start gap-2.5">
                          <Link href={profileHref} className="shrink-0 mt-0.5">
                            <Avatar className="h-6 w-6 border border-border">
                              <AvatarImage src={c.author.image || ''} />
                              <AvatarFallback className="text-[9px] font-bold bg-foreground text-background">
                                {name[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <Link href={profileHref} className="text-[13px] font-semibold tracking-tight hover:underline underline-offset-2">
                                {name}
                              </Link>
                              <span className="text-[10px] text-muted-foreground tracking-wide uppercase">
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[13px] text-foreground mt-0.5 leading-relaxed">{c.content}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <button
                                type="button"
                                onClick={() => onReply(c.id, name)}
                                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <CornerDownRight className="h-3 w-3" />
                                Reply
                              </button>
                              <button
                                type="button"
                                onClick={() => onLikeComment(c.id)}
                                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Heart className={cn('h-3 w-3', cLike.liked && 'fill-foreground text-foreground dark:fill-[#0095F6] dark:text-[#0095F6]')} />
                                {cLike.count > 0 && <span>{cLike.count}</span>}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Nested replies */}
                        {c.replies && c.replies.length > 0 && (
                          <div className="ml-8 pl-3 border-l border-border space-y-2">
                            {c.replies.map((r) => {
                              const rName = r.author.username || r.author.name || 'User'
                              const rHref = r.author.username ? `/profile/${r.author.username}` : '#'
                              const rLike = commentLikes.get(r.id) ?? { liked: false, count: 0 }
                              return (
                                <div key={r.id} className="flex items-start gap-2">
                                  <Link href={rHref} className="shrink-0 mt-0.5">
                                    <Avatar className="h-5 w-5 border border-border">
                                      <AvatarImage src={r.author.image || ''} />
                                      <AvatarFallback className="text-[8px] font-bold bg-foreground text-background">
                                        {rName[0]?.toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  </Link>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                      <Link href={rHref} className="text-[12px] font-semibold tracking-tight hover:underline underline-offset-2">
                                        {rName}
                                      </Link>
                                      <span className="text-[10px] text-muted-foreground">
                                        {new Date(r.createdAt).toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="text-[12px] text-foreground mt-0.5 leading-relaxed">{r.content}</p>
                                    <button
                                      type="button"
                                      onClick={() => onLikeComment(r.id)}
                                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-1"
                                    >
                                      <Heart className={cn('h-3 w-3', rLike.liked && 'fill-foreground text-foreground dark:fill-[#0095F6] dark:text-[#0095F6]')} />
                                      {rLike.count > 0 && <span>{rLike.count}</span>}
                                    </button>
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
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground border border-border px-3 py-1.5">
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
                className="text-[13px]"
              />
              <Button onClick={onAddComment} disabled={isPending || !comment.trim()} size="sm" className="bg-amber-600 hover:bg-amber-700 dark:bg-[#14B8A6] dark:hover:bg-[#0F9688] text-white text-[12px] tracking-wide uppercase">
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
