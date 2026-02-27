'use server'

import { auth } from '@/app/auth'
import { prisma } from '@/lib/prisma'

export type SearchPerson = {
  id: string
  name: string | null
  username: string | null
  image: string | null
  level: number
  score: number
  followerCount: number
  goalCount: number
  isFollowing: boolean
}

export async function searchPeople(query: string): Promise<SearchPerson[]> {
  const session = await auth()
  if (!session?.user?.email) return []

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, following: { select: { followingId: true } } },
  })
  if (!currentUser) return []

  const followingIds = new Set(currentUser.following.map((f) => f.followingId))

  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUser.id },
      ...(query.trim()
        ? {
            OR: [
              { name: { contains: query.trim(), mode: 'insensitive' } },
              { username: { contains: query.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    take: 30,
    orderBy: { score: 'desc' },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      level: true,
      score: true,
      _count: { select: { followedBy: true, milestones: true } },
    },
  })

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    image: u.image,
    level: u.level,
    score: u.score,
    followerCount: u._count.followedBy,
    goalCount: u._count.milestones,
    isFollowing: followingIds.has(u.id),
  }))
}
