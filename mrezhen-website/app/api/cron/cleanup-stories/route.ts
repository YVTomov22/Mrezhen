import { NextResponse } from 'next/server'
import { cleanupExpiredStories } from '@/app/actions/story'

// Intended to be called by a cron job (e.g., Vercel Cron or external service).
// Add CRON_SECRET to your env to protect this endpoint.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await cleanupExpiredStories()

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true, deleted: result.deleted })
}
