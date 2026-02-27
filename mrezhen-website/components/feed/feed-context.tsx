'use client'

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react'

/* ── Shared types ─────────────────────────────────── */

export type Author = {
  id?: string
  name: string | null
  username: string | null
  image: string | null
}

export type PostImage = {
  id: string
  url: string
}

export type CommentReply = {
  id: string
  content: string
  createdAt: string
  author: Author
  likedByMe: boolean
  likeCount: number
}

export type Comment = {
  id: string
  content: string
  createdAt: string
  author: Author
  likedByMe: boolean
  likeCount: number
  replies: CommentReply[]
}

export type PostData = {
  id: string
  content: string | null
  createdAt: string
  author: Author
  authorHasActiveStory?: boolean
  images: PostImage[]
  likeCount: number
  commentCount: number
  likedByMe: boolean
  bookmarkedByMe: boolean
  recentComments: Comment[]
}

/* ── Context value ────────────────────────────────── */

type FeedContextValue = {
  posts: PostData[]
  likedPosts: PostData[]
  savedPosts: PostData[]
  optimisticToggleLike: (postId: string) => void
  optimisticToggleBookmark: (postId: string) => void
  revertLike: (postId: string) => void
  revertBookmark: (postId: string) => void
}

const FeedContext = createContext<FeedContextValue | null>(null)

/* ── Provider ─────────────────────────────────────── */

export function FeedProvider({
  initialPosts,
  children,
}: {
  initialPosts: PostData[]
  children: ReactNode
}) {
  const [posts, setPosts] = useState<PostData[]>(initialPosts)

  const optimisticToggleLike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
            }
          : p,
      ),
    )
  }, [])

  const optimisticToggleBookmark = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, bookmarkedByMe: !p.bookmarkedByMe } : p,
      ),
    )
  }, [])

  const revertLike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
            }
          : p,
      ),
    )
  }, [])

  const revertBookmark = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, bookmarkedByMe: !p.bookmarkedByMe } : p,
      ),
    )
  }, [])

  const likedPosts = useMemo(() => posts.filter((p) => p.likedByMe), [posts])
  const savedPosts = useMemo(() => posts.filter((p) => p.bookmarkedByMe), [posts])

  const value = useMemo<FeedContextValue>(
    () => ({
      posts,
      likedPosts,
      savedPosts,
      optimisticToggleLike,
      optimisticToggleBookmark,
      revertLike,
      revertBookmark,
    }),
    [posts, likedPosts, savedPosts, optimisticToggleLike, optimisticToggleBookmark, revertLike, revertBookmark],
  )

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>
}

/* ── Hook ─────────────────────────────────────────── */

export function useFeed() {
  const ctx = useContext(FeedContext)
  if (!ctx) throw new Error('useFeed must be used within FeedProvider')
  return ctx
}
