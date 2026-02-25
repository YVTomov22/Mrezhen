import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/app/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { PostComposer } from '@/components/feed/post-composer'
import { PostCard } from '@/components/feed/post-card'
import { Sparkles, Users, MessageSquare, TrendingUp } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function CommunityFeedPage() {
  const session = await auth()
  if (!session?.user?.email) redirect('/auth/login')
  const t = await getTranslations('community')

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })

  if (!currentUser) redirect('/auth/login')

  const [posts, userCount, postCount] = await Promise.all([
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
        comments: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { name: true, username: true, image: true } },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.user.count(),
    prisma.post.count(),
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
    recentComments: p.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
    })),
  }))

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header Banner ───────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('title')}</h1>
              <p className="text-teal-200 mt-1">{t('description')}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/community/suggested">
                <Button className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm gap-2">
                  <Sparkles className="h-4 w-4" /> {t('suggested')}
                </Button>
              </Link>
              <Link href="/community/people">
                <Button className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm gap-2">
                  <Users className="h-4 w-4" /> {t('findPeople')}
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Quick Stats ─────────────────────────── */}
          <div className="flex gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10 flex items-center gap-3">
              <Users className="w-5 h-5 text-teal-200" />
              <div>
                <p className="text-lg font-bold">{userCount}</p>
                <p className="text-[11px] text-teal-200 uppercase font-medium">{t('membersLabel')}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10 flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-teal-200" />
              <div>
                <p className="text-lg font-bold">{postCount}</p>
                <p className="text-[11px] text-teal-200 uppercase font-medium">{t('postsLabel')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feed Content ────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
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
    </div>
  )
}