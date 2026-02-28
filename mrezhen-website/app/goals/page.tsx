import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CreateMilestoneBtn } from "@/components/game/creation-forms"
import { MilestoneItem } from "@/components/game/milestone-item"
import { ArrowLeft, Target } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Progress } from "@/components/ui/progress"
import { CategoryFilter } from "@/components/game/category-filter"
import { GOAL_CATEGORIES } from "@/lib/constants"

export const dynamic = 'force-dynamic'

interface GoalsPageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function GoalsPage({ searchParams }: GoalsPageProps) {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/login")
  const t = await getTranslations("goals")

  // Parse category filter from URL
  const params = await searchParams
  const categoryParam = params.category?.trim() || ""
  const CATEGORY_REGEX = /^[a-zA-Z0-9\s\-_]+$/
  const activeCategories = categoryParam
    ? categoryParam.split(",").map(c => c.trim().toLowerCase()).filter(c => c.length > 0 && CATEGORY_REGEX.test(c))
    : []

  // Build Prisma where clause
  const where: Record<string, unknown> = {
    user: { email: session.user.email },
  }

  if (activeCategories.length === 1) {
    where.category = { equals: activeCategories[0], mode: "insensitive" }
  } else if (activeCategories.length > 1) {
    where.category = { in: activeCategories, mode: "insensitive" }
  }

  const milestones = await prisma.milestone.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      quests: {
        orderBy: { createdAt: "desc" },
        include: { tasks: { orderBy: { createdAt: "asc" } } },
      },
    },
  })

  const totalMilestones = milestones.length
  const inProgress = milestones.filter(m => m.status === 'IN_PROGRESS').length
  const completed = milestones.filter(m => m.status === 'COMPLETED').length
  const totalQuests = milestones.reduce((sum, m) => sum + m.quests.length, 0)
  const completedQuests = milestones.reduce((sum, m) => sum + m.quests.filter((q: any) => q.status === 'COMPLETED').length, 0)
  const overallProgress = totalQuests === 0 ? 0 : Math.round((completedQuests / totalQuests) * 100)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] dark:backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.04)] dark:shadow-none border border-transparent dark:border-white/5">
              <p className="editorial-caption text-muted-foreground mb-1">{t("totalMilestones")}</p>
              <p className="text-3xl font-black tracking-tighter">{totalMilestones}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] dark:backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.04)] dark:shadow-none border border-transparent dark:border-white/5">
              <p className="editorial-caption text-muted-foreground mb-1">{t("inProgressLabel")}</p>
              <p className="text-3xl font-black tracking-tighter">{inProgress}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] dark:backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.04)] dark:shadow-none border border-transparent dark:border-white/5">
              <p className="editorial-caption text-muted-foreground mb-1">{t("completedLabel")}</p>
              <p className="text-3xl font-black tracking-tighter">{completed}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] dark:backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.04)] dark:shadow-none border border-transparent dark:border-white/5">
              <p className="editorial-caption text-muted-foreground mb-1">{t("overallProgress")}</p>
              <p className="text-3xl font-black tracking-tighter">{overallProgress}%</p>
              <div className="w-full h-1.5 mt-2 rounded-full bg-black/10 dark:bg-white/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] overflow-hidden">
                <div className="bg-foreground h-full transition-all" style={{ width: `${overallProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter + Milestones List */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <CategoryFilter
          categories={GOAL_CATEGORIES as unknown as string[]}
          activeCategories={activeCategories}
        />

        <div className="grid gap-6">
          {milestones.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed rounded-xl bg-primary/5 border-primary/30 dark:bg-white/[0.02] dark:border-white/20">
              <div className="mx-auto w-16 h-16 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-teal-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {activeCategories.length > 0 ? t("noFilteredMilestones") : t("noMilestones")}
              </h3>
              <p className="text-muted-foreground mb-4 mt-1">{t("startByCreating")}</p>
              <CreateMilestoneBtn />
            </div>
          )}

          {milestones.map((milestone) => (
            <MilestoneItem key={milestone.id} milestone={milestone} />
          ))}
        </div>
      </div>
    </div>
  )
}