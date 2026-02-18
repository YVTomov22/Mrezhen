import Link from "next/link"
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { UserNav } from "@/components/user-nav"
import { UserStats } from "@/components/user-stats"
import { Button } from "@/components/ui/button"
import { Menu, Home, LayoutDashboard, Target, MessageSquareText, Sparkles, Heart, Settings } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarLinks } from "@/components/sidebar-links"
import { SidebarShell } from "@/components/sidebar-shell"
import { SidebarBottom } from "@/components/sidebar-bottom"

export async function Navbar() {
  const session = await auth()
  const user = session?.user
  const t = await getTranslations("nav")

  let userStats = null
  if (user?.email) {
    userStats = await prisma.user.findUnique({
        where: { email: user.email },
        select: { level: true, score: true }
    })
  }

  const isLoggedIn = !!user

  // ─── Logged-out: horizontal top bar ────────────────────
  if (!isLoggedIn) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 text-white p-1.5 rounded-lg">
              <Image src="/favicon.ico" alt="Mrezhen Logo" height={20} width={20} />
            </div>
            <Link href="/" className="text-xl font-bold tracking-tight text-white">
              Mrezhen
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link href="/#features" className="hover:text-white transition-colors">{t("features")}</Link>
            <Link href="/community" className="hover:text-white transition-colors">{t("community")}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle className="hidden md:flex text-gray-300 hover:text-white hover:bg-white/10" />
            <Link href="/auth/login">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white border-0 rounded-lg">
                {t("logIn")} / {t("signUp")}
              </Button>
            </Link>
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white"><Menu className="h-5 w-5" /></Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col gap-4 mt-8">
                    <Link href="/#features" className="text-lg font-medium">{t("features")}</Link>
                    <Link href="/community" className="text-lg font-medium">{t("community")}</Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    )
  }

  // ─── Logged-in: vertical sidebar (Instagram-style) ────────────────────
  const navItems: { href: string; label: string; icon: "home" | "dashboard" | "target" | "messages" | "heart" | "sparkles" }[] = [
    { href: "/community", label: t("home"), icon: "home" },
    { href: "/dashboard", label: t("dashboard"), icon: "dashboard" },
    { href: "/goals", label: t("goals"), icon: "target" },
    { href: "/messages", label: t("messages"), icon: "messages" },
    { href: "/notifications", label: t("notifications"), icon: "heart" },
    { href: "/ai-chat", label: t("askAi"), icon: "sparkles" },
  ]

  const bottomItems: { href: string; label: string; icon: "settings" }[] = [
    { href: "/settings", label: t("settings"), icon: "settings" },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <SidebarShell>
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 px-3 mb-8">
          <div className="bg-teal-600 text-white p-1.5 rounded-lg shrink-0">
            <Image src="/favicon.ico" alt="Mrezhen Logo" height={24} width={24} />
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1">
          <SidebarLinks items={navItems} />
        </nav>

        {/* Bottom: Settings + Profile */}
        <SidebarBottom
          expandedChildren={
            <>
              {userStats && (
                <div className="mb-2 px-1">
                  <UserStats level={userStats.level} score={userStats.score} />
                </div>
              )}
              <SidebarLinks items={bottomItems} />
              <div className="flex justify-start mt-1">
                <UserNav user={user} />
              </div>
            </>
          }
        >
          <SidebarLinks items={bottomItems} />
          <div className="flex justify-center mt-1">
            <UserNav user={user} />
          </div>
        </SidebarBottom>
      </SidebarShell>

      {/* Mobile Top Bar + Hamburger */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 text-white p-1.5 rounded-lg">
              <Image src="/favicon.ico" alt="Mrezhen Logo" height={20} width={20} />
            </div>
            <Link href="/dashboard" className="text-lg font-bold tracking-tight">
              Mrezhen
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <UserNav user={user} />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 mt-8">
                  {userStats && (
                    <div className="mb-4">
                      <UserStats level={userStats.level} score={userStats.score} />
                    </div>
                  )}
                  <Link href="/community" className="flex items-center gap-3 text-lg font-medium">
                    <Home className="h-5 w-5" /> {t("home")}
                  </Link>
                  <Link href="/dashboard" className="flex items-center gap-3 text-lg font-medium">
                    <LayoutDashboard className="h-5 w-5" /> {t("dashboard")}
                  </Link>
                  <Link href="/goals" className="flex items-center gap-3 text-lg font-medium">
                    <Target className="h-5 w-5" /> {t("goals")}
                  </Link>
                  <Link href="/messages" className="flex items-center gap-3 text-lg font-medium">
                    <MessageSquareText className="h-5 w-5" /> {t("messages")}
                  </Link>
                  <Link href="/notifications" className="flex items-center gap-3 text-lg font-medium">
                    <Heart className="h-5 w-5" /> {t("notifications")}
                  </Link>
                  <div className="h-px bg-border my-2" />
                  <Link href="/ai-chat">
                    <Button className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-0">
                      <Sparkles className="mr-2 h-4 w-4 fill-white" /> {t("askAi")}
                    </Button>
                  </Link>
                  <Link href="/settings" className="flex items-center gap-3 text-lg font-medium">
                    <Settings className="h-5 w-5" /> {t("settings")}
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  )
}