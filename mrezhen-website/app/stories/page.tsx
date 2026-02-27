import { redirect } from 'next/navigation'
import { auth } from '@/app/auth'
import { getStoryFeed } from '@/app/actions/story'
import { prisma } from '@/lib/prisma'
import { StoriesPageClient } from '@/components/story/stories-page-client'

export const dynamic = 'force-dynamic'

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>
}) {
  const session = await auth()
  if (!session?.user?.email) redirect('/auth/login')

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })

  if (!currentUser) redirect('/auth/login')

  const storyFeed = await getStoryFeed()

  // Optional: open on a specific user's stories
  const params = await searchParams
  const targetUser = params.user
  let initialGroupIndex = 0
  if (targetUser && storyFeed.stories.length > 0) {
    const idx = storyFeed.stories.findIndex(
      (g) => g.creator.username === targetUser || g.creatorId === targetUser
    )
    if (idx >= 0) initialGroupIndex = idx
  }

  // Shareable users (people current user follows)
  const shareableUsers = await prisma.user.findMany({
    where: {
      id: { not: currentUser.id },
      followedBy: { some: { followerId: currentUser.id } },
    },
    select: { id: true, name: true, username: true, image: true },
    take: 50,
  })

  return (
    <StoriesPageClient
      groups={storyFeed.stories}
      currentUserId={storyFeed.currentUserId || currentUser.id}
      initialGroupIndex={initialGroupIndex}
      shareableUsers={shareableUsers}
    />
  )
}
