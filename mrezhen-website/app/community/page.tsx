import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/app/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PostComposer } from '@/components/feed/post-composer'
import { PostCard } from '@/components/feed/post-card'
import { FollowButton } from '@/components/follow-button'
import { StoriesBar } from '@/components/community/stories-bar'
import { CommunityLeftSidebar } from '@/components/community/left-sidebar'
import { Sparkles, MessageSquare, Search } from 'lucide-react'
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
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-background grid grid-cols-1 lg:grid-cols-[220px_1fr_320px]">
      {/* ── LEFT SIDEBAR ─────────────────────────────── */}
      <aside className="hidden lg:block border-r border-border p-4 overflow-y-auto no-scrollbar">
        <CommunityLeftSidebar user={currentUser} />
      </aside>

      {/* ── FEED (center, scrollable) ─────────────── */}
      <section className="overflow-y-auto no-scrollbar p-6">
        <div className="max-w-2xl mx-auto space-y-6">          {/* Horizontal stories strip */}
          <div className="border border-border bg-card/60">
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

          <div className="space-y-4">
            {serialized.length === 0 ? (
              <div className="bg-card border-2 border-dashed border-border rounded-xl p-10 text-center">
                <div className="mx-auto w-14 h-14 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-3">
                  <MessageSquare className="w-7 h-7 text-teal-500" />
                </div>
                <p className="text-muted-foreground font-medium">{t('noPosts')}</p>
              </div>
            ) : (
              serialized.map((post) => <PostCard key={post.id} {...post} />)
            )}
          </div>
        </div>
      </section>

      {/* ── RIGHT SIDEBAR ───────────────────────────── */}
      <aside className="hidden lg:flex flex-col gap-4 border-l border-border p-4 overflow-y-auto no-scrollbar">
        {/* Suggested People */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Sparkles className="h-4 w-4 text-amber-500" />
                {t('suggestedPeople')}
              </CardTitle>
              <Link href="/community/suggested" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                {t('viewAll')}
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sidebarPeople.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('noSuggestions')}</p>
            ) : (
              sidebarPeople.map((user) => (
                <div key={user.id} className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={user.image || ''} />
                    <AvatarFallback className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold">
                      {user.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${user.username}`} className="text-sm font-semibold truncate block hover:underline">
                      {user.name}
                    </Link>
                    <p className="text-[10px] text-muted-foreground">{t('levelLabel')} {user.level}</p>
                  </div>
                  <FollowButton targetUserId={user.id} initialIsFollowing={false} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Discover People */}
        <Card className="border-border shadow-sm">
          <CardContent className="py-4 space-y-2">
            <Link href="/community/people">
              <Button variant="outline" className="w-full gap-2 text-sm">
                <Search className="h-4 w-4" /> {t('findPeople')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}