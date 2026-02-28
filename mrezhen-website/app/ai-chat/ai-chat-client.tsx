'use client'

import { useState } from "react"
import ChatUI from "@/components/chat-ui"
import { AiChatSidebar, type ChatSessionSummary } from "@/components/ai-chat-sidebar"
import { useTranslations } from "next-intl"
import { PanelLeftOpen, PanelLeftClose } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AiChatPageClientProps {
  userId: string
  initialSessions: ChatSessionSummary[]
}

export function AiChatPageClient({ userId, initialSessions }: AiChatPageClientProps) {
  const t = useTranslations("aiChat")
  const [sessions, setSessions] = useState<ChatSessionSummary[]>(initialSessions)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessions[0]?.id ?? null
  )
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="w-full max-w-4xl flex gap-0 relative">
      {/* Toggle button (mobile & collapsed) */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -left-10 top-0 hidden md:flex z-10"
        onClick={() => setSidebarOpen((v) => !v)}
        title={sidebarOpen ? t("hideSidebar") : t("showSidebar")}
      >
        {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-56 shrink-0 border border-border rounded-xl bg-card shadow-sm overflow-hidden h-[600px] hidden md:flex flex-col">
          <AiChatSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onSessionsChange={setSessions}
          />
        </div>
      )}

      {/* Mobile sidebar toggle */}
      <div className="md:hidden mb-2 absolute -top-10 left-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen((v) => !v)}
          className="gap-1"
        >
          {sidebarOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
          {t("chats")}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setSidebarOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-64 bg-card border-r border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <AiChatSidebar
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={(id) => {
                setActiveSessionId(id)
                setSidebarOpen(false)
              }}
              onSessionsChange={setSessions}
            />
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 min-w-0 space-y-4">
        <ChatUI
          userId={userId}
          sessionId={activeSessionId}
          onTitleUpdate={(sid, title) => {
            setSessions((prev) =>
              prev.map((s) => (s.id === sid ? { ...s, title } : s))
            )
          }}
        />
        <div className="text-center text-xs text-muted-foreground">
          <p>{t("info")}</p>
        </div>
      </div>
    </div>
  )
}
