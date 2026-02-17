import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CreateMilestoneBtn } from "@/components/game/creation-forms"
import { MilestoneItem } from "@/components/game/milestone-item"
import { ArrowLeft, Target, CheckCircle2, Clock, Trophy } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Progress } from "@/components/ui/progress"

export const dynamic = 'force-dynamic'

export default async function GoalsPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/login")
  const t = await getTranslations("goals")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      milestones: {
        orderBy: { createdAt: 'desc' },
        include: {
          quests: {
            orderBy: { createdAt: 'desc' },
            include: { tasks: { orderBy: { createdAt: 'asc' } } }
          }
        }
      }
    }
  })

  if (!user) return null

  const totalMilestones = user.milestones.length
  const inProgress = user.milestones.filter(m => m.status === 'IN_PROGRESS').length
  const completed = user.milestones.filter(m => m.status === 'COMPLETED').length
  const totalQuests = user.milestones.reduce((sum, m) => sum + m.quests.length, 0)
  const completedQuests = user.milestones.reduce((sum, m) => sum + m.quests.filter((q: any) => q.status === 'COMPLETED').length, 0)
  const overallProgress = totalQuests === 0 ? 0 : Math.round((completedQuests / totalQuests) * 100)

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header Banner ───────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-teal-200 hover:text-white text-sm mb-2 transition-colors">
                <ArrowLeft className="w-4 h-4" /> {t("backToDashboard")}
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t("title")}</h1>
              <p className="text-teal-200 mt-1">{t("description")}</p>
            </div>
            <CreateMilestoneBtn />
          </div>

          {/* ── Stats Row ────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-teal-200" />
                <span className="text-xs text-teal-100">{t("totalMilestones")}</span>
              </div>
              <p className="text-2xl font-bold">{totalMilestones}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-300" />
                <span className="text-xs text-teal-100">{t("inProgressLabel")}</span>
              </div>
              <p className="text-2xl font-bold">{inProgress}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span className="text-xs text-teal-100">{t("completedLabel")}</span>
              </div>
              <p className="text-2xl font-bold">{completed}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span className="text-xs text-teal-100">{t("overallProgress")}</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{overallProgress}%</p>
              </div>
              <Progress value={overallProgress} className="h-1.5 mt-2 bg-white/20 [&>div]:bg-emerald-300" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Milestones List ──────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid gap-6">
          {user.milestones.length === 0 && (
            <div className="text-center py-20 bg-card border-2 border-dashed border-border rounded-xl">
              <div className="mx-auto w-16 h-16 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-teal-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{t("noMilestones")}</h3>
              <p className="text-muted-foreground mb-4 mt-1">{t("startByCreating")}</p>
              <CreateMilestoneBtn />
            </div>
          )}

          {user.milestones.map((milestone) => (
            <MilestoneItem key={milestone.id} milestone={milestone} />
          ))}
        </div>
      </div>
    </div>
  )
}