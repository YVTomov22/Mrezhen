import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { XpChart } from "@/components/dashboard/xp-chart"
import { MilestoneWidget } from "@/components/dashboard/milestone-widget"
import { QuestCard } from "@/components/game/quest-card"
import { GoalManager } from "@/components/dashboard/goal-manager"
import { Button } from "@/components/ui/button"
import { ArrowRight, Target } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/login")
  const t = await getTranslations("dashboard")

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
    <div className="min-h-screen bg-background">
      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-10 md:py-14">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <p className="editorial-caption text-muted-foreground mb-2">{t("title")}</p>
              <h1 className="editorial-headline text-4xl md:text-5xl">{t("welcome", { name: user.name ?? "User" })}</h1>
            </div>
            <div className="flex gap-3">
              <GoalManager milestones={user.milestones} />
              <Link href="/messages">
                <Button variant="outline" className="gap-2 text-[12px] tracking-wide uppercase border-border hover:bg-foreground hover:text-background transition-colors">
                  {t("assistant")}
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Stat Row ─────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px mt-10 border border-border">
            <div className="p-5 bg-background">
              <p className="editorial-caption text-muted-foreground mb-1">{t("currentLevel")}</p>
              <p className="text-3xl font-black tracking-tighter">{user.level}</p>
            </div>
            <div className="p-5 bg-background border-l border-border">
              <p className="editorial-caption text-muted-foreground mb-1">{t("totalXp")}</p>
              <p className="text-3xl font-black tracking-tighter">{user.score.toLocaleString()}</p>
            </div>
            <div className="p-5 bg-background border-l border-border">
              <p className="editorial-caption text-muted-foreground mb-1">{t("weeklyXp")}</p>
              <p className="text-3xl font-black tracking-tighter">+{weekXp}</p>
            </div>
            <div className="p-5 bg-background border-l border-border">
              <p className="editorial-caption text-muted-foreground mb-1">{t("goalsCompleted")}</p>
              <p className="text-3xl font-black tracking-tighter">{completedMilestones}</p>
            </div>
          </div>

          {/* ── Level Progress ──────────────────────── */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="editorial-caption text-muted-foreground">
                {t("levelProgress")}
              </span>
              <span className="editorial-caption text-muted-foreground">
                {t("xpToLevel", { xp: user.score % xpForNextLevel, needed: xpForNextLevel, level: user.level + 1 })}
              </span>
            </div>
            <div className="w-full bg-muted h-1.5">
              <div className="bg-foreground h-1.5 transition-all" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ── Left Column ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-10">
            {/* Activity Chart */}
            <div>
              <h2 className="editorial-caption text-muted-foreground mb-4">{t("activity")}</h2>
              <div className="border border-border p-6">
                <XpChart logs={user.activityLogs} />
              </div>
            </div>

            {/* Active Quests */}
            <div>
              <div className="flex items-baseline gap-3 mb-6">
                <h2 className="editorial-subhead text-xl">{t("nextUp")}</h2>
                <span className="editorial-caption text-muted-foreground">{t("priority")}</span>
              </div>
              {user.quests.length === 0 ? (
                <div className="border border-dashed border-border p-10 text-center">
                  <p className="editorial-caption text-muted-foreground mb-3">{t("noQuests")}</p>
                  <GoalManager milestones={user.milestones}>
                    <Button variant="outline" size="sm" className="text-[12px] tracking-wide uppercase">
                      {t("createOne")}
                    </Button>
                  </GoalManager>
                </div>
              ) : (
                <div className="space-y-4">
                  {user.quests.map(quest => (
                    <QuestCard key={quest.id} quest={quest as any} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column ─────────────────────────── */}
          <div className="space-y-8">
            {/* Active Goals */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="editorial-caption text-muted-foreground">{t("activeGoals")}</h2>
                <Link href="/goals">
                  <Button variant="ghost" size="sm" className="h-6 text-[11px] tracking-wide uppercase text-muted-foreground hover:text-foreground">
                    {t("viewAll")} <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="border border-border divide-y divide-border">
                {activeMilestones.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="editorial-caption text-muted-foreground">{t("noMilestones")}</p>
                  </div>
                ) : (
                  activeMilestones.map(m => (
                    <div key={m.id} className="p-4">
                      <MilestoneWidget milestone={m} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="editorial-caption text-muted-foreground mb-4">{t("quickActions")}</h2>
              <div className="space-y-2">
                <GoalManager milestones={user.milestones}>
                  <Button variant="outline" className="w-full justify-start gap-3 h-10 text-[13px] tracking-tight border-border">
                    <Target className="w-4 h-4" /> {t("newGoal")}
                  </Button>
                </GoalManager>
                <Link href="/ai-chat" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 h-10 text-[13px] tracking-tight border-border">
                    {t("askAiForHelp")}
                  </Button>
                </Link>
                <Link href="/community" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 h-10 text-[13px] tracking-tight border-border">
                    {t("visitCommunity")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}