import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ layout?: string }>
}) {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/login")
  const t = await getTranslations("dashboard")
  
  const resolvedSearchParams = await searchParams
  const initialLayout = resolvedSearchParams.layout || undefined

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      activityLogs: {
        where: { createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: 'asc' }
      },
      milestones: {
        orderBy: { createdAt: 'desc' },
        include: { quests: {
            include: { 
               tasks: true 
             }
        } }
      },
      quests: {
        where: { status: "IN_PROGRESS" },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { tasks: { orderBy: { createdAt: 'asc' } } }
      }
    }
  })

  if (!user) redirect("/auth/login")

  const xpForNextLevel = 1000
  const xpProgress = (user.score % xpForNextLevel) / 10

  const activeMilestones = user.milestones.filter(m => m.status === 'IN_PROGRESS').slice(0, 3)
  const completedMilestones = user.milestones.filter(m => m.status === 'COMPLETED').length
  const weekXp = user.activityLogs.reduce((sum, l) => sum + l.xpGained, 0)

  return (
    <DashboardClient 
      user={user}
      activeMilestones={activeMilestones}
      completedMilestones={completedMilestones}
      weekXp={weekXp}
      xpProgress={xpProgress}
      xpForNextLevel={xpForNextLevel}
      initialLayout={initialLayout}
    />
  )
}