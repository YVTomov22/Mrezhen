'use client'

import { useState, useRef, useEffect } from "react"
import { Plus, Trash2, Pencil, Check, X, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  createAiChatSession,
  renameAiChatSession,
  deleteAiChatSession,
} from "@/app/actions/ai-chat-sessions"
import { useTranslations } from "next-intl"

export type ChatSessionSummary = {
  id: string
  title: string
  updatedAt: Date
}

interface AiChatSidebarProps {
  sessions: ChatSessionSummary[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onSessionsChange: (sessions: ChatSessionSummary[]) => void
}

export function AiChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onSessionsChange,
}: AiChatSidebarProps) {
  const t = useTranslations("aiChat")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus()
  }, [editingId])

  const handleNew = async () => {
    setIsCreating(true)
    const result = await createAiChatSession()
    if (result.data) {
      const newSession: ChatSessionSummary = {
        id: result.data.id,
        title: result.data.title,
        updatedAt: result.data.updatedAt,
      }
      onSessionsChange([newSession, ...sessions])
      onSelectSession(newSession.id)
    }
    setIsCreating(false)
  }

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null)
      return
    }
    await renameAiChatSession(id, editTitle)
    onSessionsChange(
      sessions.map((s) => (s.id === id ? { ...s, title: editTitle.trim().slice(0, 100) } : s))
    )
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    await deleteAiChatSession(id)
    const remaining = sessions.filter((s) => s.id !== id)
    onSessionsChange(remaining)
    if (activeSessionId === id) {
      onSelectSession(remaining[0]?.id ?? "")
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* New chat button */}
      <div className="p-2 border-b border-border">
        <Button
          onClick={handleNew}
          disabled={isCreating}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("newChat")}
        </Button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 && (
          <div className="p-4 text-xs text-muted-foreground text-center">
            {t("noChats")}
          </div>
        )}

        {sessions.map((s) => {
          const isActive = s.id === activeSessionId
          const isEditing = editingId === s.id

          return (
            <div
              key={s.id}
              className={cn(
                "group flex items-center gap-1 px-2 py-2 text-sm cursor-pointer border-b border-border/50 hover:bg-accent/50 transition-colors",
                isActive && "bg-accent"
              )}
              onClick={() => {
                if (!isEditing) onSelectSession(s.id)
              }}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

              {isEditing ? (
                <form
                  className="flex-1 flex items-center gap-1"
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleRename(s.id)
                  }}
                >
                  <Input
                    ref={editRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-6 text-xs px-1"
                    maxLength={100}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="submit"
                    className="p-0.5 text-green-600 hover:text-green-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="p-0.5 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingId(null)
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </form>
              ) : (
                <>
                  <span className="flex-1 truncate text-xs">{s.title}</span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      className="p-0.5 text-muted-foreground hover:text-foreground"
                      title={t("rename")}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingId(s.id)
                        setEditTitle(s.title)
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      className="p-0.5 text-muted-foreground hover:text-destructive"
                      title={t("deleteChat")}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(s.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
