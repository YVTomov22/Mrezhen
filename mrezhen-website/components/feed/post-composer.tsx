'use client'

import { useMemo, useState, useTransition } from 'react'
import type { ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { uploadImages } from '@/app/actions/upload'
import { createPost } from '@/app/actions/posts'

export function PostComposer() {
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
        router.refresh()
      } catch (e: any) {
        setError(e?.message ?? 'Failed to post')
      }
    })
  }

  return (
    <Card className="border-zinc-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Create a post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={content}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="min-h-[90px]"
          disabled={isPending}
        />

        <div className="flex items-center justify-between gap-3">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
            disabled={isPending}
          />
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? 'Posting...' : 'Post'}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((p: { name: string; url: string }) => (
              // Use plain img to avoid Next remote config issues
              <img
                key={p.url}
                src={p.url}
                alt={p.name}
                className="h-24 w-full object-cover rounded-md border"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
