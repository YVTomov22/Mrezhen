import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { QuestCard } from "@/components/game/quest-card"
import { CreateMilestoneBtn, CreateQuestBtn } from "@/components/game/creation-forms"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export const dynamic = 'force-dynamic'

export default async function GoalsPage() {
  const t = await getTranslations("profile")
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { username: true, id: true },
  })

  if (!user) redirect("/auth/login")

  redirect(`/profile/${user.username ?? user.id}`)
}