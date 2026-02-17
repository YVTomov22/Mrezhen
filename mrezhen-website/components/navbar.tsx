import Link from "next/link"
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { UserNav } from "@/components/user-nav"
import { UserStats } from "@/components/user-stats"
import { Button } from "@/components/ui/button"
import { Bot, Menu, Sparkles, MessageSquareText } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { getTranslations } from "next-intl/server"

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      {/* 1. Added 'relative' to the container so we can absolute center the nav */}
      <div className="container mx-auto flex h-16 items-center justify-between px-4 relative">
        
        {/* LEFT: Logo */}
        <div className="flex items-center gap-2">
            <div className="bg-gray-600 text-white p-1.5 rounded-lg">
                <Image src="/favicon.ico" alt="Mrezhen Logo" height={20} width={20} />
            </div>
            <Link href="/dashboard" className="text-xl font-bold tracking-tight">
                Mrezhen
            </Link>
        </div>

        {/* MIDDLE: Desktop Navigation (Fixed Centering) */}
        <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">{t("dashboard")}</Link>
          <Link href="/goals" className="hover:text-foreground transition-colors">{t("goals")}</Link>
          <Link href="/community" className="hover:text-foreground transition-colors">{t("community")}</Link>
        </nav>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">
          
          {/* STATS BADGE */}
          {userStats && (
            <UserStats level={userStats.level} score={userStats.score} />
          )}

          {/* DM Button */}
          <Link href="/messages">
            <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-foreground">
                <MessageSquareText className="h-5 w-5" />
            </Button>
          </Link>

          {/* AI Chat Button */}
          <Link href="/ai-chat">
            <Button 
                className="hidden md:flex bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-0 hover:opacity-90 shadow-md"
            >
                <Sparkles className="mr-2 h-4 w-4 fill-white" />
                {t("askAi")}
            </Button>
          </Link>

          {/* User Profile */}
          {user ? (
            <UserNav user={user} />
          ) : (
            <div className="flex gap-2">
                <Link href="/auth/login"><Button variant="ghost">{t("logIn")}</Button></Link>
                <Link href="/auth/register"><Button>{t("signUp")}</Button></Link>
            </div>
          )}

          {/* Mobile Menu */}
          <div className="md:hidden">
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
                        <Link href="/dashboard" className="text-lg font-medium">{t("dashboard")}</Link>
                        <Link href="/goals" className="text-lg font-medium">{t("goals")}</Link>
                        <Link href="/community" className="text-lg font-medium">{t("community")}</Link>
                        
                        <div className="h-px bg-border my-2" />
                        
                        <Link href="/messages" className="flex items-center gap-2 text-lg font-medium">
                            <MessageSquareText className="h-5 w-5" /> {t("messages")}
                        </Link>
                        
                        <Link href="/messages">
                            <Button className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 border-0 mt-2">
                                <Sparkles className="mr-2 h-4 w-4" /> {t("askAi")}
                            </Button>
                        </Link>
                    </div>
                </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </header>
  )
}