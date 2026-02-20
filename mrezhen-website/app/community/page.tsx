import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/app/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PostComposer } from '@/components/feed/post-composer'
import { PostComposerModal } from '@/components/feed/post-composer-modal'
import { PostCard } from '@/components/feed/post-card'
import { FollowButton } from '@/components/follow-button'
import { StoriesBar } from '@/components/community/stories-bar'
import { CommunityLeftSidebar } from '@/components/community/left-sidebar'
import { Search } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { getRecommendedUsers } from '@/app/actions/recommend'

export const dynamic = 'force-dynamic'

export default async function CommunityFeedPage() {
  const session = await auth()
  if (!session?.user?.email) redirect('/auth/login')
  const t = await getTranslations('community')

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, username: true, image: true, level: true, score: true },
  })

  if (!currentUser) redirect('/auth/login')

  const [posts, recommendedUsers, storyUsers] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: { select: { name: true, username: true, image: true } },
        images: true,
        likes: {
          where: { userId: currentUser.id },
          select: { userId: true },
        },
        bookmarks: {
          where: { userId: currentUser.id },
          select: { userId: true },
        },
        comments: {
          where: { parentId: null },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { name: true, username: true, image: true } },
            likes: {
              where: { userId: currentUser.id },
              select: { userId: true },
            },
            _count: { select: { likes: true } },
            replies: {
              take: 3,
              orderBy: { createdAt: 'asc' },
              include: {
                author: { select: { name: true, username: true, image: true } },
                likes: {
                  where: { userId: currentUser.id },
                  select: { userId: true },
                },
                _count: { select: { likes: true } },
              },
            },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    getRecommendedUsers(),
    prisma.user.findMany({
      where: { id: { not: currentUser.id }, image: { not: null } },
      select: { id: true, name: true, username: true, image: true },
      take: 15,
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  const serialized = posts.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt.toISOString(),
    author: p.author,
    images: p.images,
    likeCount: p._count.likes,
    commentCount: p._count.comments,
    likedByMe: p.likes.length > 0,
    bookmarkedByMe: p.bookmarks.length > 0,
    recentComments: p.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
      likedByMe: c.likes.length > 0,
      likeCount: c._count.likes,
      replies: c.replies.map((r) => ({
        id: r.id,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        author: r.author,
        likedByMe: r.likes.length > 0,
        likeCount: r._count.likes,
      })),
    })),
  }))

  const sidebarPeople = recommendedUsers.slice(0, 5)

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-background grid grid-cols-1 lg:grid-cols-[240px_1fr_300px]">
      <PostComposerModal />
      {/* ── LEFT SIDEBAR ─────────────────────────────── */}
      <aside className="hidden lg:flex flex-col gap-8 border-r border-border px-6 py-8 overflow-y-auto no-scrollbar">
        {/* Suggested People */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="editorial-caption text-muted-foreground">
              {t('suggestedPeople')}
            </h3>
            <Link href="/community/suggested" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors tracking-wide uppercase">
              {t('viewAll')}
            </Link>
          </div>
          <div className="space-y-4">
            {sidebarPeople.length === 0 ? (
              <p className="text-xs text-muted-foreground editorial-body">{t('noSuggestions')}</p>
            ) : (
              sidebarPeople.map((user) => (
                <div key={user.id} className="flex items-center gap-3 group">
                  <Avatar className="h-9 w-9 border border-border shrink-0">
                    <AvatarImage src={user.image || ''} />
                    <AvatarFallback className="bg-foreground text-background text-xs font-semibold">
                      {user.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${user.username}`} className="text-[13px] font-medium truncate block group-hover:underline tracking-tight">
                      {user.name}
                    </Link>
                    <p className="text-[10px] text-muted-foreground tracking-wide uppercase">{t('levelLabel')} {user.level}</p>
                  </div>
                  <FollowButton targetUserId={user.id} initialIsFollowing={false} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Discover People */}
        <div>
          <Link href="/community/people">
            <Button variant="outline" className="w-full gap-2 text-[13px] tracking-tight h-10 border-foreground/20 hover:bg-foreground hover:text-background transition-all duration-200">
              <Search className="h-4 w-4" /> {t('findPeople')}
            </Button>
          </Link>
        </div>
      </aside>

      {/* ── FEED (center, scrollable) ─────────────── */}
      <section className="overflow-y-auto no-scrollbar px-6 py-8">
        <div className="max-w-[640px] mx-auto space-y-8">
          {/* Horizontal stories strip */}
          <div className="border-b border-border pb-6">
            <StoriesBar
              currentUser={{
                id: currentUser.id,
                name: currentUser.name,
                username: currentUser.username,
                image: currentUser.image,
              }}
              users={storyUsers}
            />
          </div>

          <PostComposer />

          <div className="space-y-6">
            {serialized.length === 0 ? (
              <div className="border border-dashed border-border py-16 text-center">
                <p className="editorial-caption text-muted-foreground">{t('noPosts')}</p>
              </div>
            ) : (
              serialized.map((post) => <PostCard key={post.id} {...post} />)
            )}
          </div>
        </div>
      </section>

      {/* ── RIGHT SIDEBAR ───────────────────────────── */}
      <aside className="hidden lg:block border-l border-border px-6 py-8 overflow-y-auto no-scrollbar">
        <CommunityLeftSidebar user={currentUser} />
      </aside>
    </div>
  )
}