'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { shareStory } from '@/app/actions/story'
import { Search, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

type ShareUser = {
  id: string
  name: string | null
  username: string | null
  image: string | null
}

type Props = {
  storyId: string | null
  open: boolean
  onClose: () => void
  users: ShareUser[]
}

export function StoryShareDialog({ storyId, open, onClose, users }: Props) {
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [sentTo, setSentTo] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) {
      setSearch('')
      setSentTo(new Set())
    }
  }, [open])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    )
  })

  function handleShare(userId: string) {
    if (!storyId) return

    startTransition(async () => {
      const result = await shareStory(storyId, userId)
      if (result.success) {
        setSentTo((prev) => new Set([...prev, userId]))
        toast.success('Story shared!')
      } else {
        toast.error(result.error || 'Failed to share')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">Share Story</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            className="pl-9 h-10"
          />
        </div>

        {/* User list */}
        <div className="max-h-[300px] overflow-y-auto space-y-1 -mx-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
          ) : (
            filtered.map((user) => {
              const isSent = sentTo.has(user.id)
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-9 w-9 border border-border shrink-0">
                    <AvatarImage src={user.image || ''} />
                    <AvatarFallback className="text-xs font-bold bg-foreground text-background">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.username || user.name}</p>
                    {user.name && user.username && (
                      <p className="text-xs text-muted-foreground truncate">{user.name}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={isSent ? 'outline' : 'default'}
                    disabled={isPending || isSent}
                    onClick={() => handleShare(user.id)}
                    className="h-8 text-xs gap-1.5"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isSent ? (
                      'Sent'
                    ) : (
                      <><Send className="h-3.5 w-3.5" /> Send</>
                    )}
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
