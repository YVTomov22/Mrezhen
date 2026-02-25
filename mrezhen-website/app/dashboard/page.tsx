import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { XpChart } from "@/components/dashboard/xp-chart"
import { MilestoneWidget } from "@/components/dashboard/milestone-widget"
import { QuestCard } from "@/components/game/quest-card"
import { GoalManager } from "@/components/dashboard/goal-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, Zap, Target, Trophy, TrendingUp, Flame } from "lucide-react"
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
      {/* ── Hero Banner ─────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-300 rounded-full blur-3xl translate-y-1/2" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-8 md:py-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-teal-200 text-sm font-medium mb-1">{t("title")}</p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t("welcome", { name: user.name ?? "User" })}</h1>
            </div>
            <div className="flex gap-2">
              <GoalManager milestones={user.milestones} />
              <Link href="/messages">
                <Button className="gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4" /> {t("assistant")}
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Quick Stat Chips ─────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-white/20 rounded-lg"><Trophy className="w-4 h-4" /></div>
                <span className="text-xs text-teal-100 font-medium">{t("currentLevel")}</span>
              </div>
              <p className="text-2xl font-bold">{user.level}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-white/20 rounded-lg"><Zap className="w-4 h-4" /></div>
                <span className="text-xs text-teal-100 font-medium">{t("totalXp")}</span>
              </div>
              <p className="text-2xl font-bold">{user.score.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-white/20 rounded-lg"><Flame className="w-4 h-4" /></div>
                <span className="text-xs text-teal-100 font-medium">{t("weeklyXp")}</span>
              </div>
              <p className="text-2xl font-bold">+{weekXp}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-white/20 rounded-lg"><Target className="w-4 h-4" /></div>
                <span className="text-xs text-teal-100 font-medium">{t("goalsCompleted")}</span>
              </div>
              <p className="text-2xl font-bold">{completedMilestones}</p>
            </div>
          </div>

          {/* ── Level Progress Bar ──────────────────── */}
          <div className="mt-5 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-teal-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> {t("levelProgress")}
              </span>
              <span className="text-xs text-teal-200">
                {t("xpToLevel", { xp: user.score % xpForNextLevel, needed: xpForNextLevel, level: user.level + 1 })}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div className="bg-gradient-to-r from-emerald-300 to-white h-3 rounded-full transition-all shadow-sm shadow-emerald-400/50" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left Column ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Activity Chart */}
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="pb-2 bg-muted/30">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-500" />
                  {t("activity")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <XpChart logs={user.activityLogs} />
              </CardContent>
            </Card>

            {/* Active Quests */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                {t("nextUp")}
                <span className="bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold">{t("priority")}</span>
              </h3>
              {user.quests.length === 0 ? (
                <Card className="border-dashed border-2">
                  <CardContent className="p-8 text-center">
                    <div className="mx-auto w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-3">
                      <Target className="w-6 h-6 text-teal-500" />
                    </div>
                    <p className="text-muted-foreground mb-2">{t("noQuests")}</p>
                    <GoalManager milestones={user.milestones}>
                      <Button variant="outline" size="sm" className="text-teal-600 border-teal-200 hover:bg-teal-50 dark:border-teal-800 dark:hover:bg-teal-900/30">
                        {t("createOne")}
                      </Button>
                    </GoalManager>
                  </CardContent>
                </Card>
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
          <div className="space-y-6">
            {/* Active Goals */}
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">{t("activeGoals")}</CardTitle>
                  <Link href="/goals">
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400">
                      {t("viewAll")} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {activeMilestones.length === 0 ? (
                    <div className="py-6 text-center">
                      <div className="mx-auto w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-2">
                        <Target className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">{t("noMilestones")}</p>
                    </div>
                  ) : (
                    activeMilestones.map(m => (
                      <MilestoneWidget key={m.id} milestone={m} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="pb-3 bg-muted/30">
                <CardTitle className="text-sm font-medium">{t("quickActions")}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                <GoalManager milestones={user.milestones}>
                  <Button variant="outline" className="w-full justify-start gap-2 h-10 text-sm">
                    <Target className="w-4 h-4 text-teal-500" /> {t("newGoal")}
                  </Button>
                </GoalManager>
                <Link href="/ai-chat" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2 h-10 text-sm">
                    <Sparkles className="w-4 h-4 text-purple-500" /> {t("askAiForHelp")}
                  </Button>
                </Link>
                <Link href="/community" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2 h-10 text-sm">
                    <TrendingUp className="w-4 h-4 text-orange-500" /> {t("visitCommunity")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}