import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CreateMilestoneBtn } from "@/components/game/creation-forms"
import { MilestoneItem } from "@/components/game/milestone-item"
import { ArrowLeft, Target } from "lucide-react"
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
      {/* ── Header ───────────────────────────────────── */}
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-[12px] tracking-wide uppercase mb-3 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> {t("backToDashboard")}
              </Link>
              <h1 className="editorial-headline text-4xl md:text-5xl">{t("title")}</h1>
              <p className="editorial-body text-muted-foreground mt-2">{t("description")}</p>
            </div>
            <CreateMilestoneBtn />
          </div>

          {/* ── Stats Row ────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px mt-10 border border-border">
            <div className="p-5 bg-background">
              <p className="editorial-caption text-muted-foreground mb-1">{t("totalMilestones")}</p>
              <p className="text-3xl font-black tracking-tighter">{totalMilestones}</p>
            </div>
            <div className="p-5 bg-background border-l border-border">
              <p className="editorial-caption text-muted-foreground mb-1">{t("inProgressLabel")}</p>
              <p className="text-3xl font-black tracking-tighter">{inProgress}</p>
            </div>
            <div className="p-5 bg-background border-l border-border">
              <p className="editorial-caption text-muted-foreground mb-1">{t("completedLabel")}</p>
              <p className="text-3xl font-black tracking-tighter">{completed}</p>
            </div>
            <div className="p-5 bg-background border-l border-border">
              <p className="editorial-caption text-muted-foreground mb-1">{t("overallProgress")}</p>
              <p className="text-3xl font-black tracking-tighter">{overallProgress}%</p>
              <div className="w-full bg-muted h-1 mt-2">
                <div className="bg-foreground h-1 transition-all" style={{ width: `${overallProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Milestones List ──────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid gap-6">
          {user.milestones.length === 0 && (
            <div className="text-center py-20 border border-dashed border-border">
              <p className="editorial-caption text-muted-foreground mb-4">{t("noMilestones")}</p>
              <h3 className="editorial-subhead text-foreground mb-2">{t("startByCreating")}</h3>
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