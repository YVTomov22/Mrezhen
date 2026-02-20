'use client'

import { useMemo, useState, useTransition } from 'react'
import type { ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { uploadImages } from '@/app/actions/upload'
import { createPost } from '@/app/actions/posts'

export function PostComposer({ onSuccess }: { onSuccess?: () => void } = {}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const previews = useMemo(() => {
    return files.map((file: File) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files])

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFiles(selected)
  }

  async function onSubmit() {
    setError(null)

    startTransition(async () => {
      try {
        let imageUrls: string[] = []

        if (files.length > 0) {
          const formData = new FormData()
          for (const file of files) {
            formData.append('file', file)
          }

          const uploadResult = await uploadImages(formData)
          if ('error' in uploadResult && uploadResult.error) {
            setError(uploadResult.error)
            return
          }

          imageUrls = (uploadResult as any).urls ?? []
        }

        const result = await createPost({ content, imageUrls })
        if ('error' in result && result.error) {
          setError(result.error)
          return
        }

        setContent('')
        setFiles([])
        onSuccess ? onSuccess() : router.refresh()
      } catch (e: any) {
        setError(e?.message ?? 'Failed to post')
      }
    })
  }

  return (
    <div className="border-b border-border pb-6 mb-6">
      <h3 className="editorial-caption text-muted-foreground mb-3">New Post</h3>
      <div className="space-y-3">
        <Textarea
          value={content}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="min-h-[90px] resize-none text-[15px] border-border"
          disabled={isPending}
        />

        <div className="flex items-center justify-between gap-3">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
            disabled={isPending}
            className="text-[13px]"
          />
          <Button onClick={onSubmit} disabled={isPending} className="bg-foreground text-background hover:bg-foreground/90 dark:bg-[#0095F6] dark:hover:bg-[#0080D6] dark:text-white text-[12px] tracking-wide uppercase">
            {isPending ? 'Posting...' : 'Publish'}
          </Button>
        </div>

        {error && (
          <p className="text-[12px] text-foreground">{error}</p>
        )}

        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((p: { name: string; url: string }) => (
              <img
                key={p.url}
                src={p.url}
                alt={p.name}
                className="h-24 w-full object-cover border border-border"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
