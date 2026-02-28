import Link from "next/link"
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { UserNav } from "@/components/user-nav"
import { UserStats } from "@/components/user-stats"
import { Button } from "@/components/ui/button"
import { Menu, Home, LayoutDashboard, Target, MessageSquareText, Sparkles, Heart, Settings, Search, PlusSquare, Trophy } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarLinks } from "@/components/sidebar-links"
import { SidebarShell } from "@/components/sidebar-shell"
import { SidebarBottom } from "@/components/sidebar-bottom"
import { SidebarLogo } from "@/components/sidebar-logo"
import { SidebarProfile } from "@/components/sidebar-profile"

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

  // Logged-out: no navbar
  if (!isLoggedIn) {
    return null
  }

  // Logged-in: sidebar
  const navItems: { href: string; label: string; icon: "home" | "dashboard" | "target" | "messages" | "heart" | "sparkles" | "search" | "plus" | "trophy" }[] = [
    { href: "/community", label: t("home"), icon: "home" },
    { href: "/community/people", label: t("search"), icon: "search" },
    { href: "/dashboard", label: t("dashboard"), icon: "dashboard" },
    { href: "/goals", label: t("goals"), icon: "target" },
    { href: "/leaderboard", label: t("leaderboard"), icon: "trophy" },
    { href: "/messages", label: t("messages"), icon: "messages" },
    { href: "/notifications", label: t("notifications"), icon: "heart" },
    { href: "/community?new=1", label: t("newPost"), icon: "plus" },
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
        <SidebarLogo />

        {/* Nav Links */}
        <nav className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
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
              <SidebarProfile user={user} />
            </>
          }
        >
          <SidebarLinks items={bottomItems} />
          <SidebarProfile user={user} />
        </SidebarBottom>
      </SidebarShell>

      {/* Mobile Top Bar + Hamburger */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b border-border bg-background">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-foreground text-background p-1.5 flex items-center justify-center">
              <span className="font-editorial text-sm font-black leading-none">M</span>
            </div>
            <Link href="/dashboard" className="editorial-subhead text-base">
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
                  <Link href="/leaderboard" className="flex items-center gap-3 text-lg font-medium">
                    <Trophy className="h-5 w-5" /> {t("leaderboard")}
                  </Link>
                  <Link href="/messages" className="flex items-center gap-3 text-lg font-medium">
                    <MessageSquareText className="h-5 w-5" /> {t("messages")}
                  </Link>
                  <Link href="/notifications" className="flex items-center gap-3 text-lg font-medium">
                    <Heart className="h-5 w-5" /> {t("notifications")}
                  </Link>
                  <div className="h-px bg-border my-2" />
                  <Link href="/ai-chat">
                    <Button className="w-full bg-foreground text-background hover:bg-foreground/90 border-0">
                      <Sparkles className="mr-2 h-4 w-4" /> {t("askAi")}
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