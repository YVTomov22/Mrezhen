'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import type { ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { uploadImages } from '@/app/actions/upload'
import { createPost } from '@/app/actions/posts'

export function PostComposer({ onSuccess, initialContent }: { onSuccess?: () => void; initialContent?: string } = {}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [content, setContent] = useState(initialContent ?? '')
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
    setFiles((prev) => [...prev, ...selected])
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
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

  const dropZoneRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
    if (dropped.length > 0) setFiles(dropped)
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function onDragLeave() {
    setIsDragOver(false)
  }

  return (
    <div className="homepage-card border-b border-border pb-6 mb-6 rounded-2xl px-5 pt-5">
      <h3 className="editorial-caption text-muted-foreground mb-3">New Post</h3>
      <div className="space-y-3">
        <Textarea
          value={content}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="min-h-[90px] resize-none text-[15px] border-border"
          disabled={isPending}
        />

        {/* Custom Drop Zone */}
        <div
          ref={dropZoneRef}
          onClick={() => fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`drop-zone flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 py-5 ${
            isDragOver
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/30'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className="text-xs text-muted-foreground">
            {files.length > 0 ? `${files.length} file(s) selected` : 'Drop images/videos or browse'}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={onFileChange}
            disabled={isPending}
            className="hidden"
          />
        </div>

        <div className="flex items-center justify-end">
          <Button onClick={onSubmit} disabled={isPending} className="bg-foreground text-background hover:bg-foreground/90 dark:bg-[#0095F6] dark:hover:bg-[#0080D6] dark:text-white text-[12px] tracking-wide uppercase">
            {isPending ? 'Posting...' : 'Publish'}
          </Button>
        </div>

        {error && (
          <p className="text-[12px] text-foreground">{error}</p>
        )}

        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {files.map((file, i) => {
              const p = previews[i]
              if (!p) return null
              return (
                <div key={p.url} className="relative group">
                  {file.type.startsWith('video/') ? (
                    <video
                      src={p.url}
                      className="h-24 w-full object-cover border border-border rounded"
                      muted
                      playsInline
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.url}
                      alt={p.name}
                      className="h-24 w-full object-cover border border-border rounded"
                    />
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
