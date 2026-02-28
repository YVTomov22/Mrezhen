import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getAiChatSessions } from "@/app/actions/ai-chat-sessions"
import { AiChatPageClient } from "./ai-chat-client"

export const maxDuration = 60;

export default async function AIChatPage() {
  let session = await auth()
  if (!session?.user?.email) redirect("/auth/login")
  const t = await getTranslations("aiChat")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  })

  if (!user) redirect("/auth/login")

  const sessions = await getAiChatSessions()

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 flex flex-col md:flex-row justify-center items-start pt-10 gap-4">
      
      {/* Back Button */}
      <div className="md:sticky md:top-10 shrink-0">
          <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
              title={t("backToDashboard")}
          >
              <div className="p-2 bg-card border border-border rounded-full shadow-sm group-hover:bg-accent transition-all">
                  <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium md:hidden lg:inline-block">{t("back")}</span>
          </Link>
      </div>

      {/* Sidebar + Chat */}
      <AiChatPageClient
        userId={user.id}
        initialSessions={sessions.map((s) => ({
          id: s.id,
          title: s.title,
          updatedAt: s.updatedAt,
        }))}
      />
    </div>
  )
}