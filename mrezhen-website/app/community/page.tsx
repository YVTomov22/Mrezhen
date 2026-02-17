import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/app/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { PostComposer } from '@/components/feed/post-composer'
import { PostCard } from '@/components/feed/post-card'
import { Sparkles } from 'lucide-react'
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

  const posts = await prisma.post.findMany({
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
  })

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
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{t('description')}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/community/suggested">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:opacity-90">
                <Sparkles className="mr-2 h-4 w-4" /> {t('suggested')}
              </Button>
            </Link>
            <Link href="/community/people">
              <Button variant="outline">{t('findPeople')}</Button>
            </Link>
          </div>
        </div>

        <PostComposer />

        <div className="space-y-4">
          {serialized.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-6 text-sm text-muted-foreground">
              {t('noPosts')}
            </div>
          ) : (
            serialized.map((post) => <PostCard key={post.id} {...post} />)
          )}
        </div>
      </div>
    </div>
  )
}