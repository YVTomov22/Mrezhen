'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PostComposer } from './post-composer'

function PostComposerModalInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isOpen = searchParams.get('new') === '1'

  function handleClose() {
    router.back()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="p-0 overflow-hidden max-w-lg" showCloseButton={false}>
        <PostComposer onSuccess={handleClose} />
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
