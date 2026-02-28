
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { UserInfoWizard } from "@/components/user-wizard"
import { getTranslations } from "next-intl/server"

export default async function OnboardingPage() {
    const t = await getTranslations("onboarding")
    const session = await auth()

    if (!session?.user?.email) redirect("/login")

    // Redirect if user already completed onboarding
    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })
    if (user?.dateOfBirth) {
        redirect("/dashboard")
    }


    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="text-center mb-10 space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>

            <UserInfoWizard />
        </div>
    )
}