'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, MessageCircle, Share2, Bookmark, CornerDownRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { togglePostLike, addPostComment, togglePostBookmark, toggleCommentLike } from '@/app/actions/posts'
import { useFeed, type PostData } from '@/components/feed/feed-context'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ChangeEvent } from 'react'

type PostCardProps = PostData

export function PostCard(props: PostCardProps) {
  const router = useRouter()
  const { optimisticToggleLike, optimisticToggleBookmark, revertLike, revertBookmark } = useFeed()
  const [isPending, startTransition] = useTransition()
  const [comment, setComment] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null)
  const commentInputRef = useRef<HTMLInputElement>(null)
  const [likeAnimating, setLikeAnimating] = useState(false)
  const [bookmarkAnimating, setBookmarkAnimating] = useState(false)

  const [commentLikes, setCommentLikes] = useState<Map<string, { liked: boolean; count: number }>>(() => {
    const m = new Map<string, { liked: boolean; count: number }>()
    props.recentComments.forEach((c) => {
      m.set(c.id, { liked: c.likedByMe, count: c.likeCount })
      c.replies.forEach((r) => m.set(r.id, { liked: r.likedByMe, count: r.likeCount }))
    })
    return m
  })

  async function onLike() {
    const wasLiked = props.likedByMe
    optimisticToggleLike(props.id)
    setLikeAnimating(true)
    setTimeout(() => setLikeAnimating(false), 350)

    if (!wasLiked) {
      toast.success('Post liked', { duration: 1500 })
    }

    startTransition(async () => {
      const res = await togglePostLike(props.id)
      if ('error' in res && res.error) {
        revertLike(props.id)
        toast.error(res.error)
        return
      }
      router.refresh()
    })
  }

  async function onBookmark() {
    const wasBookmarked = props.bookmarkedByMe
    optimisticToggleBookmark(props.id)
    setBookmarkAnimating(true)
    setTimeout(() => setBookmarkAnimating(false), 350)

    toast.success(wasBookmarked ? 'Removed from saved' : 'Saved to collection', {
      duration: 1500,
    })

    startTransition(async () => {
      const res = await togglePostBookmark(props.id)
      if ('error' in res && res.error) {
        revertBookmark(props.id)
        toast.error(res.error)
        return
      }
      router.refresh()
    })
  }

  async function onAddComment() {
    const trimmed = comment.trim()
    if (!trimmed) return

    const parentId = replyingTo?.id || undefined
    startTransition(async () => {
      const res = await addPostComment(props.id, trimmed, parentId)
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      setComment('')
      setReplyingTo(null)
      toast.success('Comment posted', { duration: 1500 })
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
        toast.error(res.error)
      }
    })
  }

  function onShare() {
    const url = `${window.location.origin}/community?post=${props.id}`
    if (navigator.share) {
      navigator.share({ title: 'Check out this post', url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard', { duration: 1500 })
    }
  }

  const displayName = props.author.username || props.author.name || 'User'
  const when = new Date(props.createdAt).toLocaleString()

  return (
    <article className="py-4 feed-entrance">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3">
        <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
          <AvatarImage src={props.author.image || ''} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
            {displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <Link
            href={props.author.username ? `/profile/${props.author.username}` : '#'}
            className="text-sm font-semibold tracking-tight hover:underline underline-offset-2"
          >
            {displayName}
          </Link>
          <p className="text-[11px] text-muted-foreground" suppressHydrationWarning>{when}</p>
        </div>
      </div>

      {/* Content */}
      {props.content && (
        <div className="pb-3">
          <p className="text-[15px] leading-relaxed">{props.content}</p>
        </div>
      )}

      {/* Images */}
      {props.images.length > 0 && (
        <div className={cn(props.images.length === 1 ? '' : 'grid grid-cols-2 gap-0.5')}>
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
      <div className="flex items-center justify-between py-1 -mx-1">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            disabled={isPending}
            className="gap-1.5 text-muted-foreground hover:text-foreground h-9 px-2.5 rounded-xl"
          >
            <Heart
              className={cn(
                'h-[18px] w-[18px] transition-all duration-200',
                props.likedByMe && 'fill-rose-500 text-rose-500',
                likeAnimating && 'animate-heart-pop',
              )}
            />
            <span className="text-xs tabular-nums font-medium">
              {props.likeCount > 0 ? props.likeCount : ''}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments((prev) => !prev)}
            className={cn(
              'gap-1.5 text-muted-foreground hover:text-foreground h-9 px-2.5 rounded-xl',
              showComments && 'text-foreground bg-accent',
            )}
          >
            <MessageCircle className={cn('h-[18px] w-[18px] transition-all', showComments && 'fill-foreground')} />
            <span className="text-xs tabular-nums font-medium">
              {props.commentCount > 0 ? props.commentCount : ''}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="text-muted-foreground hover:text-foreground h-9 px-2.5 rounded-xl"
          >
            <Share2 className="h-[18px] w-[18px]" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onBookmark}
          disabled={isPending}
          className="text-muted-foreground hover:text-foreground h-9 px-2.5 rounded-xl"
        >
          <Bookmark
            className={cn(
              'h-[18px] w-[18px] transition-all duration-200',
              props.bookmarkedByMe && 'fill-amber-500 text-amber-500 dark:fill-sky-400 dark:text-sky-400',
              bookmarkAnimating && 'animate-bookmark-bounce',
            )}
          />
        </Button>
      </div>

      {/* ── Comment Section ── */}
      <div className="comment-collapse" data-open={showComments}>
        <div>
          <div className="border-t border-border/40 pt-4 pb-2 space-y-3">
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
                            <Avatar className="h-7 w-7 ring-1 ring-border">
                              <AvatarImage src={c.author.image || ''} />
                              <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                                {name[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0 bg-muted/50 rounded-xl px-3 py-2">
                            <div className="flex items-baseline gap-2">
                              <Link href={profileHref} className="text-[13px] font-semibold tracking-tight hover:underline underline-offset-2">
                                {name}
                              </Link>
                              <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[13px] text-foreground mt-0.5 leading-relaxed">{c.content}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-10">
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
                            <Heart className={cn('h-3 w-3 transition-colors', cLike.liked && 'fill-rose-500 text-rose-500')} />
                            {cLike.count > 0 && <span>{cLike.count}</span>}
                          </button>
                        </div>

                        {/* Nested replies */}
                        {c.replies && c.replies.length > 0 && (
                          <div className="ml-10 pl-3 border-l-2 border-border/50 space-y-2">
                            {c.replies.map((r) => {
                              const rName = r.author.username || r.author.name || 'User'
                              const rHref = r.author.username ? `/profile/${r.author.username}` : '#'
                              const rLike = commentLikes.get(r.id) ?? { liked: false, count: 0 }
                              return (
                                <div key={r.id} className="flex items-start gap-2">
                                  <Link href={rHref} className="shrink-0 mt-0.5">
                                    <Avatar className="h-5 w-5 ring-1 ring-border">
                                      <AvatarImage src={r.author.image || ''} />
                                      <AvatarFallback className="text-[8px] font-bold bg-primary/10 text-primary">
                                        {rName[0]?.toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  </Link>
                                  <div className="flex-1 min-w-0">
                                    <div className="bg-muted/50 rounded-lg px-2.5 py-1.5">
                                      <div className="flex items-baseline gap-2">
                                        <Link href={rHref} className="text-[12px] font-semibold tracking-tight hover:underline underline-offset-2">
                                          {rName}
                                        </Link>
                                        <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                                          {new Date(r.createdAt).toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="text-[12px] text-foreground mt-0.5 leading-relaxed">{r.content}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => onLikeComment(r.id)}
                                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-1 ml-2"
                                    >
                                      <Heart className={cn('h-3 w-3 transition-colors', rLike.liked && 'fill-rose-500 text-rose-500')} />
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
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
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
                className="text-[13px] rounded-xl bg-muted/50 border-border/60"
              />
              <Button
                onClick={onAddComment}
                disabled={isPending || !comment.trim()}
                size="sm"
                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[12px] tracking-wide font-semibold px-4"
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
