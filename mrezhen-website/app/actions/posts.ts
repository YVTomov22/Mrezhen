'use server'

import { auth } from '@/app/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createPostSchema = z.object({
  content: z.string().trim().max(2000).optional().or(z.literal('')),
  imageUrls: z.array(z.string().url()).max(10).optional(),
})

export async function createPost(input: unknown) {
  const session = await auth()
  if (!session?.user?.email) return { error: 'Unauthorized' }

  const parsed = createPostSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid post data' }

  const content = parsed.data.content?.trim() || null
  const imageUrls = parsed.data.imageUrls ?? []

  if (!content && imageUrls.length === 0) {
    return { error: 'Add text or at least one image' }
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })

  if (!user) return { error: 'User not found' }

  const post = await prisma.post.create({
    data: {
      content,
      authorId: user.id,
      images: {
        create: imageUrls.map((url: string) => ({ url })),
      },
    },
    include: {
      author: { select: { id: true, name: true, username: true, image: true } },
      images: true,
      _count: { select: { comments: true, likes: true } },
    },
  })

  revalidatePath('/community')
  return { success: true, post }
}

export async function togglePostLike(postId: string) {
  const session = await auth()
  if (!session?.user?.email) return { error: 'Unauthorized' }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  if (!user) return { error: 'User not found' }

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
    select: { postId: true },
  })

  if (existing) {
    await prisma.postLike.delete({
      where: { postId_userId: { postId, userId: user.id } },
    })
    revalidatePath('/community')
    return { success: true, liked: false }
  }

  await prisma.postLike.create({
    data: { postId, userId: user.id },
  })
  revalidatePath('/community')
  return { success: true, liked: true }
}

export async function addPostComment(postId: string, content: string) {
  const session = await auth()
  if (!session?.user?.email) return { error: 'Unauthorized' }

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Comment cannot be empty' }
  if (trimmed.length > 1000) return { error: 'Comment is too long' }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  if (!user) return { error: 'User not found' }

  await prisma.postComment.create({
    data: {
      postId,
      authorId: user.id,
      content: trimmed,
    },
  })

  revalidatePath('/community')
  return { success: true }
}

export async function togglePostBookmark(postId: string) {
  const session = await auth()
  if (!session?.user?.email) return { error: 'Unauthorized' }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  if (!user) return { error: 'User not found' }

  const existing = await prisma.postBookmark.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
    select: { postId: true },
  })

  if (existing) {
    await prisma.postBookmark.delete({
      where: { postId_userId: { postId, userId: user.id } },
    })
    revalidatePath('/community')
    return { success: true, bookmarked: false }
  }

  await prisma.postBookmark.create({
    data: { postId, userId: user.id },
  })
  revalidatePath('/community')
  return { success: true, bookmarked: true }
}
