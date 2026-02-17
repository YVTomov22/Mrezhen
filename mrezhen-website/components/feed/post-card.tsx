'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { togglePostLike, addPostComment } from '@/app/actions/posts'
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
  recentComments: Comment[]
}

export function PostCard(props: PostCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onLike() {
    setError(null)
    startTransition(async () => {
      const res = await togglePostLike(props.id)
      if ('error' in res && res.error) {
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

  const displayName = props.author.username || props.author.name || 'User'
  const when = new Date(props.createdAt).toLocaleString()

  return (
    <Card className="border-border overflow-hidden shadow-sm hover:shadow-md transition-all">
      <CardHeader className="flex flex-row items-center gap-3 p-4">
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
      </CardHeader>

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

      <CardContent className="p-4 space-y-3">
        {props.content && (
          <p className="text-sm text-foreground whitespace-pre-wrap">{props.content}</p>
        )}

        <div className="flex items-center gap-3">
          <Button
            variant={props.likedByMe ? 'default' : 'outline'}
            size="sm"
            onClick={onLike}
            disabled={isPending}
          >
            <Heart className={props.likedByMe ? 'mr-2 h-4 w-4 fill-white' : 'mr-2 h-4 w-4'} />
            {props.likeCount}
          </Button>
          <div className="flex items-center text-sm text-muted-foreground">
            <MessageCircle className="mr-2 h-4 w-4" />
            {props.commentCount}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

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
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Input
          value={comment}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
          placeholder="Add a comment..."
          disabled={isPending}
        />
        <Button onClick={onAddComment} disabled={isPending || !comment.trim()}>
          Comment
        </Button>
      </CardFooter>
    </Card>
  )
}
