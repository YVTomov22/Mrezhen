'use server'

import { auth } from '@/app/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Helpers

async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.email) return null

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, hiddenFromStory: true, closeFriends: true },
  })

  return user
}

const STORY_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// Create Story

const createStorySchema = z.object({
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(['image', 'video', 'text']).default('image'),
  caption: z.string().trim().max(500).optional(),
  backgroundColor: z.string().max(20).optional(),
  textColor: z.string().max(20).optional(),
  audience: z.enum(['everyone', 'close_friends']).default('everyone'),
})

export async function createStory(input: unknown) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = createStorySchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid story data' }

  const { mediaUrl, mediaType, caption, backgroundColor, textColor, audience } = parsed.data

  // Must have either media or text content
  if (mediaType === 'text' && !caption) {
    return { error: 'Text stories require a caption' }
  }
  if (mediaType !== 'text' && !mediaUrl) {
    return { error: 'Image/video stories require media' }
  }

  try {
    const story = await prisma.story.create({
      data: {
        mediaUrl: mediaUrl || null,
        mediaType,
        caption: caption || null,
        backgroundColor: backgroundColor || null,
        textColor: textColor || null,
        audience,
        expiresAt: new Date(Date.now() + STORY_TTL_MS),
        creatorId: user.id,
      },
    })

    revalidatePath('/community')
    return { success: true, story }
  } catch {
    return { error: 'Failed to create story' }
  }
}

// Get Story Feed
// Returns active stories grouped by creator, ordered by recency.

export async function getStoryFeed() {
  const user = await getCurrentUser()
  if (!user) return { stories: [], currentUserId: '' }

  const now = new Date()

  // Get IDs of users the current user follows
  const followedIds = await prisma.follows.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  }).then((rows) => rows.map((r) => r.followingId))

  // Include own + followed users only
  const allowedCreators = [user.id, ...followedIds]

  // Fetch all non-expired stories from followed users + own
  const stories = await prisma.story.findMany({
    where: {
      expiresAt: { gt: now },
      creatorId: { in: allowedCreators },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      creator: {
        select: { id: true, name: true, username: true, image: true, hiddenFromStory: true, closeFriends: true },
      },
      views: {
        where: { viewerId: user.id },
        select: { viewerId: true },
      },
      likes: {
        where: { userId: user.id },
        select: { userId: true },
      },
      _count: { select: { views: true, likes: true } },
    },
  })

  // Post-filter: remove stories where currentUser is in creator's hiddenFromStory
  // or stories with audience=close_friends where currentUser is NOT in closeFriends
  const filtered = stories.filter((s) => {
    if (s.creator.hiddenFromStory.includes(user.id)) return false
    if (s.audience === 'close_friends' && s.creatorId !== user.id) {
      if (!s.creator.closeFriends.includes(user.id)) return false
    }
    return true
  })

  // Group by creator
  const grouped = new Map<string, typeof filtered>()
  for (const story of filtered) {
    const existing = grouped.get(story.creatorId) || []
    existing.push(story)
    grouped.set(story.creatorId, existing)
  }

  // Serialize + group
  const storyGroups = Array.from(grouped.entries()).map(([creatorId, userStories]) => {
    const creator = userStories[0].creator
    const allViewed = userStories.every((s) => s.views.length > 0)
    return {
      creatorId,
      creator: {
        id: creator.id,
        name: creator.name,
        username: creator.username,
        image: creator.image,
      },
      allViewed,
      stories: userStories.map((s) => ({
        id: s.id,
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        caption: s.caption,
        backgroundColor: s.backgroundColor,
        textColor: s.textColor,
        audience: s.audience,
        expiresAt: s.expiresAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
        viewedByMe: s.views.length > 0,
        likedByMe: s.likes.length > 0,
        viewCount: s._count.views,
        likeCount: s._count.likes,
        isOwn: s.creatorId === user.id,
      })),
    }
  })

  // Sort: own stories first, then unviewed, then viewed
  storyGroups.sort((a, b) => {
    if (a.creatorId === user.id) return -1
    if (b.creatorId === user.id) return 1
    if (a.allViewed !== b.allViewed) return a.allViewed ? 1 : -1
    return 0
  })

  return { stories: storyGroups, currentUserId: user.id }
}

// Mark Story as Viewed

export async function viewStory(storyId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await prisma.storyView.upsert({
      where: {
        storyId_viewerId: { storyId, viewerId: user.id },
      },
      create: { storyId, viewerId: user.id },
      update: { viewedAt: new Date() },
    })
    return { success: true }
  } catch {
    return { error: 'Failed to record view' }
  }
}

// Toggle Story Like

export async function toggleStoryLike(storyId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Unauthorized' }

  const existing = await prisma.storyLike.findUnique({
    where: {
      storyId_userId: { storyId, userId: user.id },
    },
  })

  try {
    if (existing) {
      await prisma.storyLike.delete({
        where: { storyId_userId: { storyId, userId: user.id } },
      })
      return { success: true, liked: false }
    } else {
      await prisma.storyLike.create({
        data: { storyId, userId: user.id },
      })
      return { success: true, liked: true }
    }
  } catch {
    return { error: 'Failed to toggle like' }
  }
}

// Send Story Comment (as DM)

export async function sendStoryComment(storyId: string, content: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Unauthorized' }

  const trimmed = content.trim()
  if (!trimmed || trimmed.length > 2000) {
    return { error: 'Invalid message' }
  }

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { creatorId: true, mediaUrl: true, caption: true, mediaType: true },
  })

  if (!story) return { error: 'Story not found' }
  if (story.creatorId === user.id) return { error: 'Cannot comment on your own story' }

  try {
    // Create a DM to the story creator with story context
    const messageContent = `💬 Replied to your story: "${trimmed}"`

    const attachments = story.mediaUrl ? [{ url: story.mediaUrl }] : []

    await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: story.creatorId,
        content: messageContent,
        attachments: {
          create: attachments,
        },
      },
    })

    revalidatePath('/messages')
    return { success: true }
  } catch {
    return { error: 'Failed to send comment' }
  }
}

// Share Story (as DM to another user)

export async function shareStory(storyId: string, targetUserId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Unauthorized' }

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: {
      creator: { select: { username: true, name: true, allowResharing: true } },
    },
  })

  if (!story) return { error: 'Story not found' }
  if (!story.creator.allowResharing && story.creatorId !== user.id) {
    return { error: 'This user has disabled story resharing' }
  }

  try {
    const creatorName = story.creator.username || story.creator.name || 'someone'
    const messageContent = `📖 Shared a story from @${creatorName}${story.caption ? `: "${story.caption.slice(0, 100)}"` : ''}`

    const attachments = story.mediaUrl ? [{ url: story.mediaUrl }] : []

    await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: targetUserId,
        content: messageContent,
        attachments: {
          create: attachments,
        },
      },
    })

    revalidatePath('/messages')
    return { success: true }
  } catch {
    return { error: 'Failed to share story' }
  }
}

// Story Insights (creator only)

export async function getStoryInsights(storyId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Unauthorized' }

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: {
      views: {
        include: {
          viewer: { select: { id: true, name: true, username: true, image: true } },
        },
        orderBy: { viewedAt: 'desc' },
      },
      likes: {
        include: {
          user: { select: { id: true, name: true, username: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { views: true, likes: true } },
    },
  })

  if (!story) return { error: 'Story not found' }
  if (story.creatorId !== user.id) return { error: 'Not authorized' }

  return {
    success: true,
    insights: {
      viewCount: story._count.views,
      likeCount: story._count.likes,
      viewers: story.views.map((v) => ({
        ...v.viewer,
        viewedAt: v.viewedAt.toISOString(),
      })),
      likers: story.likes.map((l) => ({
        ...l.user,
        likedAt: l.createdAt.toISOString(),
      })),
    },
  }
}

// Delete Story

export async function deleteStory(storyId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Unauthorized' }

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { creatorId: true },
  })

  if (!story) return { error: 'Story not found' }
  if (story.creatorId !== user.id) return { error: 'Not authorized' }

  try {
    await prisma.story.delete({ where: { id: storyId } })
    revalidatePath('/community')
    return { success: true }
  } catch {
    return { error: 'Failed to delete story' }
  }
}

// Cleanup Expired Stories (cron/API)

export async function cleanupExpiredStories() {
  try {
    const result = await prisma.story.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
    return { success: true, deleted: result.count }
  } catch {
    return { error: 'Cleanup failed' }
  }
}

// Get Users With Active Stories (for StoriesBar)

export async function getUsersWithActiveStories() {
  const user = await getCurrentUser()
  if (!user) return { storyUsers: [], hasOwnStory: false }

  const now = new Date()

  // Current user's own active stories
  const ownStoryCount = await prisma.story.count({
    where: { creatorId: user.id, expiresAt: { gt: now } },
  })

  // Get IDs of users the current user follows
  const followedIds = await prisma.follows.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  }).then((rows) => rows.map((r) => r.followingId))

  // Only show stories from followed users
  const usersWithStories = await prisma.user.findMany({
    where: {
      id: { in: followedIds },
      stories: {
        some: { expiresAt: { gt: now } },
      },
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      hiddenFromStory: true,
      stories: {
        where: { expiresAt: { gt: now } },
        select: {
          views: {
            where: { viewerId: user.id },
            select: { viewerId: true },
          },
        },
      },
    },
    take: 20,
  })

  // Filter out users who hid the current user from stories
  const filtered = usersWithStories
    .filter((u) => !u.hiddenFromStory.includes(user.id))
    .map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      image: u.image,
      allViewed: u.stories.every((s) => s.views.length > 0),
    }))

  // Sort: unviewed first
  filtered.sort((a, b) => {
    if (a.allViewed !== b.allViewed) return a.allViewed ? 1 : -1
    return 0
  })

  return { storyUsers: filtered, hasOwnStory: ownStoryCount > 0 }
}

// Check if user has active story (profile ring indicator)

export async function checkUserHasActiveStory(userId: string) {
  const now = new Date()
  const count = await prisma.story.count({
    where: { creatorId: userId, expiresAt: { gt: now } },
  })
  return count > 0
}

// Get a single user's stories (from profile)

export async function getUserStories(targetUserId: string) {
  const user = await getCurrentUser()
  if (!user) return { stories: [], currentUserId: '' }

  const now = new Date()

  const stories = await prisma.story.findMany({
    where: {
      creatorId: targetUserId,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      creator: {
        select: { id: true, name: true, username: true, image: true, hiddenFromStory: true, closeFriends: true },
      },
      views: {
        where: { viewerId: user.id },
        select: { viewerId: true },
      },
      likes: {
        where: { userId: user.id },
        select: { userId: true },
      },
      _count: { select: { views: true, likes: true } },
    },
  })

  // Privacy filter
  const filtered = stories.filter((s) => {
    if (s.creator.hiddenFromStory.includes(user.id) && s.creatorId !== user.id) return false
    if (s.audience === 'close_friends' && s.creatorId !== user.id) {
      if (!s.creator.closeFriends.includes(user.id)) return false
    }
    return true
  })

  if (filtered.length === 0) return { stories: [], currentUserId: user.id }

  const creator = filtered[0].creator
  const group = {
    creatorId: targetUserId,
    creator: {
      id: creator.id,
      name: creator.name,
      username: creator.username,
      image: creator.image,
    },
    allViewed: filtered.every((s) => s.views.length > 0),
    stories: filtered.map((s) => ({
      id: s.id,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      caption: s.caption,
      backgroundColor: s.backgroundColor,
      textColor: s.textColor,
      audience: s.audience,
      expiresAt: s.expiresAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      viewedByMe: s.views.length > 0,
      likedByMe: s.likes.length > 0,
      viewCount: s._count.views,
      likeCount: s._count.likes,
      isOwn: s.creatorId === user.id,
    })),
  }

  return { stories: [group], currentUserId: user.id }
}
