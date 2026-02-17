import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CreateMilestoneBtn } from "@/components/game/creation-forms"
import { MilestoneItem } from "@/components/game/milestone-item" // Import the new component
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

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

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
            </div>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <CreateMilestoneBtn />
        </div>

        {/* Milestones List */}
        <div className="grid gap-8">
          {user.milestones.length === 0 && (
            <div className="text-center py-20 bg-card border-2 border-dashed border-border rounded-xl">
                <h3 className="text-lg font-medium text-foreground">{t("noMilestones")}</h3>
                <p className="text-muted-foreground mb-4">{t("startByCreating")}</p>
                <CreateMilestoneBtn />
            </div>
          )}

          {user.milestones.map((milestone) => (
            // Use the new collapsible component
            <MilestoneItem key={milestone.id} milestone={milestone} />
          ))}
        </div>

      </div>
    </div>
  )
}