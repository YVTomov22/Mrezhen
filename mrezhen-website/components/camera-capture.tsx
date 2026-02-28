'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, Video, Square, RotateCcw, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CameraCaptureProps = {
  /** Called when the user captures a photo or finishes recording a video */
  onCapture: (file: File) => void
  /** Called when the user cancels / closes the camera */
  onClose: () => void
  /** Which modes to allow */
  modes?: ('photo' | 'video')[]
}

export function CameraCapture({ onCapture, onClose, modes = ['photo', 'video'] }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [mode, setMode] = useState<'photo' | 'video'>(modes[0])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [preview, setPreview] = useState<{ url: string; file: File } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === 'video',
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setError(null)
    } catch {
      setError('Camera access denied. Please allow camera permissions.')
    }
  }, [facingMode, mode])

  useEffect(() => {
    if (!preview) {
      startCamera()
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [startCamera, preview])

  function takePhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Mirror if using front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      setPreview({ url, file })

      // Stop camera while previewing
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }, 'image/jpeg', 0.92)
  }

  function startRecording() {
    const stream = streamRef.current
    if (!stream) return

    chunksRef.current = []
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4'

    const recorder = new MediaRecorder(stream, { mimeType })
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const ext = mimeType.includes('webm') ? 'webm' : 'mp4'
      const file = new File([blob], `video-${Date.now()}.${ext}`, { type: mimeType })
      const url = URL.createObjectURL(blob)
      setPreview({ url, file })
      setIsRecording(false)
      setRecordingTime(0)
      if (timerRef.current) clearInterval(timerRef.current)

      // Stop camera while previewing
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }

    recorder.start(100)
    setIsRecording(true)
    setRecordingTime(0)
    timerRef.current = setInterval(() => {
      setRecordingTime(t => t + 1)
    }, 1000)
  }

  function stopRecording() {
    recorderRef.current?.stop()
  }

  function flipCamera() {
    setFacingMode(f => f === 'user' ? 'environment' : 'user')
  }

  function retake() {
    if (preview) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  function confirmCapture() {
    if (preview) {
      onCapture(preview.file)
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <Camera className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Mode switcher */}
      {modes.length > 1 && !preview && !isRecording && (
        <div className="flex justify-center gap-2">
          {modes.includes('photo') && (
            <button
              type="button"
              onClick={() => setMode('photo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                mode === 'photo'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-muted-foreground border-border hover:border-foreground/30'
              }`}
            >
              <Camera className="h-3 w-3" /> Photo
            </button>
          )}
          {modes.includes('video') && (
            <button
              type="button"
              onClick={() => setMode('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                mode === 'video'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-muted-foreground border-border hover:border-foreground/30'
              }`}
            >
              <Video className="h-3 w-3" /> Video
            </button>
          )}
        </div>
      )}

      {/* Viewfinder / Preview */}
      <div className="relative aspect-[9/16] max-h-[320px] w-full rounded-xl overflow-hidden bg-black">
        {preview ? (
          preview.file.type.startsWith('video/') ? (
            <video src={preview.url} className="w-full h-full object-contain" controls autoPlay loop />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.url} alt="Captured" className="w-full h-full object-contain" />
          )
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-xs font-medium tabular-nums">{formatTime(recordingTime)}</span>
              </div>
            )}
          </>
        )}

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {preview ? (
          <>
            <Button variant="outline" size="sm" onClick={retake} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Retake
            </Button>
            <Button size="sm" onClick={confirmCapture} className="gap-1.5">
              <Check className="h-3.5 w-3.5" /> Use {mode === 'photo' ? 'Photo' : 'Video'}
            </Button>
          </>
        ) : (
          <>
            {/* Flip camera */}
            <button
              type="button"
              onClick={flipCamera}
              className="p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Capture / Record */}
            {mode === 'photo' ? (
              <button
                type="button"
                onClick={takePhoto}
                className="h-14 w-14 rounded-full border-4 border-foreground/20 bg-foreground/10 flex items-center justify-center hover:bg-foreground/20 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-white" />
              </button>
            ) : isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="h-14 w-14 rounded-full border-4 border-red-500/40 bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
              >
                <Square className="h-5 w-5 text-red-500" fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="h-14 w-14 rounded-full border-4 border-red-500/40 bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-red-500" />
              </button>
            )}

            {/* Spacer for symmetry */}
            <div className="p-2 w-8" />
          </>
        )}
      </div>
    </div>
  )
}
