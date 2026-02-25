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
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <SettingsView user={user} />
      </div>
    </div>
  )
}