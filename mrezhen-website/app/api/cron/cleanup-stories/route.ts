import { NextResponse, NextRequest } from 'next/server'
import { cleanupExpiredStoriesInternal } from '@/lib/cron-helpers'

// Intended to be called by a cron job (e.g., Vercel Cron or external service).
// Protected by CRON_SECRET via Authorization header.

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await cleanupExpiredStoriesInternal()
    return NextResponse.json({ success: true, deleted: result.deleted })
  } catch {
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
