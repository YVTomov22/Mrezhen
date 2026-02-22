import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SettingsView } from "@/components/settings-view"
import { getTranslations } from "next-intl/server"

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.email) redirect('/auth/login')
  const t = await getTranslations('settings')

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email },
    include: { accounts: { select: { provider: true } } }
  })

  if (!user) redirect('/auth/login')

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col py-10 px-4">
      {/* gap-6 instead of space-y-6: margins break min-h-0 flex containment, gap does not */}
      <div className="max-w-5xl w-full mx-auto flex flex-col flex-1 min-h-0 gap-6">
        <div className="shrink-0">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <SettingsView user={user} />
      </div>
    </div>
  )
}