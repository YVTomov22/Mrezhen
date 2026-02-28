import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ posts: [] }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) return NextResponse.json({ posts: [] }, { status: 401 })

  const likes = await prisma.postLike.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      post: {
        include: {
          images: { select: { url: true } },
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
  })

  const posts = likes.map(l => l.post)

  return NextResponse.json({ posts })
}
