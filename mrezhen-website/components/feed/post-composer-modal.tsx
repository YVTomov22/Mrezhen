'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { PostComposer } from './post-composer'

function PostComposerModalInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isOpen = searchParams.get('new') === '1'
  const dashboardParam = searchParams.get('dashboard')

  // Build initial content when sharing a dashboard layout
  const initialContent = dashboardParam
    ? `🎨 Check out my custom dashboard layout! Click to use it.\n\n[dashboard:${dashboardParam}]`
    : undefined

  function handleClose() {
    router.back()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="p-6 overflow-hidden max-w-3xl w-full" showCloseButton={false}>
        <VisuallyHidden>
          <DialogTitle>New Post</DialogTitle>
        </VisuallyHidden>
        <PostComposer onSuccess={handleClose} initialContent={initialContent} />
      </DialogContent>
    </Dialog>
  )
}

export function PostComposerModal() {
  return (
    <Suspense>
      <PostComposerModalInner />
    </Suspense>
  )
}
