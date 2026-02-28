'use server'

import { prisma } from '@/lib/prisma'

/**
 * Extract hashtags from recent posts and return the most-used ones.
 */
export async function getTrendingHashtags(limit = 10): Promise<{ tag: string; count: number }[]> {
  // Fetch recent posts (last 30 days)
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const posts = await prisma.post.findMany({
    where: {
      content: { not: null },
      createdAt: { gte: since },
    },
    select: { content: true },
  })

  // Extract hashtags
  const hashtagCounts = new Map<string, number>()
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g

  for (const post of posts) {
    if (!post.content) continue
    const matches = post.content.matchAll(hashtagRegex)
    const seen = new Set<string>() // count each tag once per post
    for (const match of matches) {
      const tag = match[1].toLowerCase()
      if (!seen.has(tag)) {
        seen.add(tag)
        hashtagCounts.set(tag, (hashtagCounts.get(tag) ?? 0) + 1)
      }
    }
  }

  // Sort descending, return top N
  return Array.from(hashtagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }))
}
