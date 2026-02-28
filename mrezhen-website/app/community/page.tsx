import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/app/auth'
import { prisma } from '@/lib/prisma'
import { PostComposerModal } from '@/components/feed/post-composer-modal'
import { CommunityFeed } from '@/components/feed/community-feed'
import { FollowButton } from '@/components/follow-button'
import { StoriesBar } from '@/components/community/stories-bar'
import { CommunityLeftSidebar } from '@/components/community/left-sidebar'
import { LeftAsideShell } from '@/components/community/left-aside-shell'
import { getTranslations } from 'next-intl/server'
import { getRecommendedUsers } from '@/app/actions/recommend'
import { getUsersWithActiveStories, getStoryFeed } from '@/app/actions/story'
import { StoryAvatarRing } from '@/components/story/story-avatar-ring'
import { FindPeopleButton } from '@/components/community/find-people-button'
import { getTrendingHashtags } from '@/app/actions/hashtags'

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

  const [posts, recommendedUsers, storyFeedData, storyBarData, trendingHashtags] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
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
            author: { select: { id: true, name: true, username: true, image: true } },
            likes: {
              where: { userId: currentUser.id },
              select: { userId: true },
            },
            _count: { select: { likes: true } },
            replies: {
              take: 3,
              orderBy: { createdAt: 'asc' },
              include: {
                author: { select: { id: true, name: true, username: true, image: true } },
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
    getStoryFeed(),
    getUsersWithActiveStories(),
    getTrendingHashtags(),
  ])

  // Check which users have active stories
  const allAuthorIds = [...new Set(posts.map((p) => p.authorId))]
  const allIdsToCheck = [...allAuthorIds, ...recommendedUsers.slice(0, 5).map((u) => u.id), currentUser.id]
  const usersWithStories = await prisma.story.findMany({
    where: { creatorId: { in: allIdsToCheck }, expiresAt: { gt: new Date() } },
    select: { creatorId: true },
    distinct: ['creatorId'],
  })
  const storyUserSet = new Set(usersWithStories.map((s) => s.creatorId))

  // Shareable users (followed)
  const shareableUsers = await prisma.user.findMany({
    where: {
      id: { not: currentUser.id },
      followedBy: { some: { followerId: currentUser.id } },
    },
    select: { id: true, name: true, username: true, image: true },
    take: 50,
  })

  const serialized = posts.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt.toISOString(),
    author: p.author,
    authorHasActiveStory: storyUserSet.has(p.authorId),
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
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-background grid grid-cols-1 lg:grid-cols-[240px_1fr_300px_180px]">
      <PostComposerModal />
      {/* Left Sidebar */}
      <LeftAsideShell>
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
                  <StoryAvatarRing
                    userId={user.id}
                    image={user.image}
                    name={user.name}
                    hasActiveStory={storyUserSet.has(user.id)}
                    size="xs"
                  />
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
          <FindPeopleButton label={t('findPeople')} />
        </div>
      </LeftAsideShell>

      {/* Feed */}
      <section className="overflow-y-auto no-scrollbar px-6 py-8">
        <div className="max-w-[640px] mx-auto space-y-6">
          {/* Horizontal stories strip */}
          <div className="pb-4">
            <StoriesBar
              currentUser={{
                id: currentUser.id,
                name: currentUser.name,
                username: currentUser.username,
                image: currentUser.image,
              }}
              storyUsers={storyBarData.storyUsers}
              storyGroups={storyFeedData.stories}
              currentUserId={storyFeedData.currentUserId || currentUser.id}
              hasOwnStory={storyBarData.hasOwnStory}
              shareableUsers={shareableUsers}
            />
          </div>

          <CommunityFeed initialPosts={serialized} currentUser={currentUser} />
        </div>
      </section>

      {/* Right Sidebar */}
      <aside className="hidden lg:flex lg:flex-col border-l border-r border-border/60 px-6 py-8 overflow-y-auto no-scrollbar">
        <CommunityLeftSidebar user={currentUser} hasActiveStory={storyUserSet.has(currentUser.id)} trendingHashtags={trendingHashtags} />

        {/* Footer links */}
        <div className="mt-auto pt-8">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/terms#privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-2">&copy; {new Date().getFullYear()} Mrezhen</p>
        </div>
      </aside>

      {/* Right Gutter */}
      <div className="hidden lg:block" aria-hidden="true" />
    </div>
  )
}