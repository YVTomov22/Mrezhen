'use client'

import { useState, useRef, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { uploadImages } from '@/app/actions/upload'
import { createStory } from '@/app/actions/story'
import { Plus, Image as ImageIcon, Type, Camera, X, Loader2, Users, Globe } from 'lucide-react'
import { CameraCapture } from '@/components/camera-capture'
import { toast } from 'sonner'

const BG_COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', '#e94560',
  '#533483', '#2b2d42', '#8d99ae', '#ef233c',
  '#2d6a4f', '#40916c', '#d4a373', '#264653',
  '#e76f51', '#f4a261', '#2a9d8f', '#023047',
]

export function StoryComposer() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Tab state
  const [tab, setTab] = useState<'image' | 'text' | 'camera'>('image')

  // Image story
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Text story
  const [backgroundColor, setBackgroundColor] = useState(BG_COLORS[0])
  const [textColor, setTextColor] = useState('#ffffff')

  // Shared
  const [caption, setCaption] = useState('')
  const [audience, setAudience] = useState<'everyone' | 'close_friends'>('everyone')
  const [error, setError] = useState<string | null>(null)

  const preview = useMemo(() => {
    if (!file) return null
    return URL.createObjectURL(file)
  }, [file])

  function reset() {
    setFile(null)
    setCaption('')
    setBackgroundColor(BG_COLORS[0])
    setTextColor('#ffffff')
    setAudience('everyone')
    setError(null)
    setTab('image')
  }

  async function onSubmit() {
    setError(null)

    startTransition(async () => {
      try {
        if (tab === 'image' || tab === 'camera') {
          if (!file) {
            setError('Select an image or video')
            return
          }

          const formData = new FormData()
          formData.append('file', file)
          const uploadResult = await uploadImages(formData)

          if ('error' in uploadResult && uploadResult.error) {
            setError(uploadResult.error)
            return
          }

          const urls = (uploadResult as { urls: string[] }).urls
          const isVideo = file.type.startsWith('video/')

          const result = await createStory({
            mediaUrl: urls[0],
            mediaType: isVideo ? 'video' : 'image',
            caption: caption || undefined,
            audience,
          })

          if ('error' in result && result.error) {
            setError(result.error)
            return
          }
        } else {
          // Text story
          if (!caption.trim()) {
            setError('Enter some text for your story')
            return
          }

          const result = await createStory({
            mediaType: 'text',
            caption,
            backgroundColor,
            textColor,
            audience,
          })

          if ('error' in result && result.error) {
            setError(result.error)
            return
          }
        }

        toast.success('Story published!')
        reset()
        setOpen(false)
        router.refresh()
      } catch {
        setError('Something went wrong')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <button className="flex flex-col items-center gap-1.5 group shrink-0" type="button">
          <div className="relative">
            <div className="h-[60px] w-[60px] rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center bg-muted/50 group-hover:border-foreground/60 transition-colors">
              <Plus className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </div>
          <span className="editorial-caption text-muted-foreground group-hover:text-foreground transition-colors truncate w-14 text-center !text-[9px]">
            Add story
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-semibold tracking-tight">Create Story</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'image' | 'text' | 'camera')} className="w-full">
          <div className="px-6">
            <TabsList className="w-full">
              <TabsTrigger value="image" className="flex-1 gap-2">
                <ImageIcon className="h-4 w-4" /> Upload
              </TabsTrigger>
              <TabsTrigger value="camera" className="flex-1 gap-2">
                <Camera className="h-4 w-4" /> Camera
              </TabsTrigger>
              <TabsTrigger value="text" className="flex-1 gap-2">
                <Type className="h-4 w-4" /> Text
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Image / Video Story */}
          <TabsContent value="image" className="px-6 pb-6 pt-4 space-y-4 mt-0">
            {/* File selector */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setFile(f)
                }}
              />
              {preview ? (
                <div className="relative aspect-[9/16] max-h-[280px] w-auto mx-auto rounded-xl overflow-hidden bg-black">
                  {file?.type.startsWith('video/') ? (
                    <video src={preview} className="w-full h-full object-contain" controls />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                  )}
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[9/16] max-h-[200px] rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-foreground/50 transition-colors bg-muted/30"
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload</span>
                </button>
              )}
            </div>

            {/* Caption */}
            <div className="space-y-1.5">
              <Label htmlFor="img-caption" className="text-xs text-muted-foreground">Caption (optional)</Label>
              <Textarea
                id="img-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Write a caption..."
                className="resize-none text-sm"
              />
            </div>
          </TabsContent>

          {/* Camera Capture Story */}
          <TabsContent value="camera" className="px-6 pb-6 pt-4 space-y-4 mt-0">
            {preview ? (
              <div className="space-y-4">
                <div className="relative aspect-[9/16] max-h-[280px] w-auto mx-auto rounded-xl overflow-hidden bg-black">
                  {file?.type.startsWith('video/') ? (
                    <video src={preview} className="w-full h-full object-contain" controls />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                  )}
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {/* Caption */}
                <div className="space-y-1.5">
                  <Label htmlFor="cam-caption" className="text-xs text-muted-foreground">Caption (optional)</Label>
                  <Textarea
                    id="cam-caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="Write a caption..."
                    className="resize-none text-sm"
                  />
                </div>
              </div>
            ) : (
              <CameraCapture
                modes={['photo', 'video']}
                onCapture={(captured) => setFile(captured)}
                onClose={() => setTab('image')}
              />
            )}
          </TabsContent>

          {/* Text Story */}
          <TabsContent value="text" className="px-6 pb-6 pt-4 space-y-4 mt-0">
            {/* Preview */}
            <div
              className="w-full aspect-[9/16] max-h-[200px] rounded-xl flex items-center justify-center p-6 overflow-hidden"
              style={{ backgroundColor }}
            >
              <p
                className="text-center text-lg font-semibold leading-snug break-words max-w-full"
                style={{ color: textColor }}
              >
                {caption || 'Your text here...'}
              </p>
            </div>

            {/* Text input */}
            <div className="space-y-1.5">
              <Label htmlFor="text-caption" className="text-xs text-muted-foreground">Story text</Label>
              <Textarea
                id="text-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="What's on your mind?"
                className="resize-none text-sm"
              />
            </div>

            {/* Background color picker */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Background color</Label>
              <div className="flex flex-wrap gap-2">
                {BG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-7 w-7 rounded-full border-2 transition-all ${
                      backgroundColor === color ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setBackgroundColor(color)}
                  />
                ))}
              </div>
            </div>

            {/* Text color */}
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground">Text color</Label>
              <div className="flex gap-2">
                {['#ffffff', '#000000', '#f4a261', '#e76f51', '#2a9d8f'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-6 w-6 rounded-full border-2 transition-all ${
                      textColor === c ? 'border-foreground scale-110' : 'border-muted-foreground/30'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setTextColor(c)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Audience + Submit */}
        <div className="px-6 pb-6 space-y-4 border-t pt-4">
          {/* Audience selector */}
          <div className="flex items-center gap-3">
            <Label className="text-xs text-muted-foreground shrink-0">Audience</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as 'everyone' | 'close_friends')}>
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">
                  <span className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> Everyone</span>
                </SelectItem>
                <SelectItem value="close_friends">
                  <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Close Friends</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            onClick={onSubmit}
            disabled={isPending}
            className="w-full h-10"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publishing...</>
            ) : (
              'Share Story'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
