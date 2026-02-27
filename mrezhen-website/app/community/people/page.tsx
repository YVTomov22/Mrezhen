import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { FollowButton } from "@/components/follow-button"
import { Map as MapIcon, Sparkles, Swords, Users, ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"
import { PeopleSearchBar } from "@/components/community/people-search-bar"

export const dynamic = 'force-dynamic'

export default async function CommunityPeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/login")
  const t = await getTranslations("community")
  
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams.q || ""

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { following: true }
  })

  if (!currentUser) return null

  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUser.id },
      ...(query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } }
        ]
      } : {})
    },
    take: 50,
    orderBy: { score: 'desc' },
    include: {
      _count: {
        select: {
          followedBy: true,
          milestones: true
        }
      },
      milestones: {
        select: {
          _count: {
            select: { quests: true }
          }
        }
      }
    }
  })

  const followingIds = new Set(currentUser.following.map(f => f.followingId))

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header Banner ───────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border bg-card">
        <div className="relative max-w-6xl mx-auto px-6 py-8">
          <Link href="/community" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t("backToFeed")}
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3 text-foreground">
                <Users className="w-8 h-8" /> {t("findPeopleTitle")}
              </h1>
              <p className="text-muted-foreground mt-1">{t("findPeopleDesc")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/community/suggested">
                <Button variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" /> {t("suggested")}
                </Button>
              </Link>
              <div className="text-xs font-bold bg-secondary px-4 py-2 rounded-xl border border-border text-secondary-foreground">
                {users.length} {t("membersLabel")}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <PeopleSearchBar />
          </div>
        </div>
      </div>

      {/* ── User Grid ───────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No people found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => {
              const totalQuests = user.milestones.reduce((acc, m) => acc + m._count.quests, 0)
            
            return (
              <Card key={user.id} className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-all border-border group">
                <CardHeader className="p-4 pb-3 flex flex-row items-center gap-3 space-y-0">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-teal-100 dark:border-teal-900 ring-2 ring-teal-500/20">
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback className="bg-teal-50 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 font-bold">
                        {user.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-teal-500 rounded-full border-2 border-card flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white">{user.level}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden min-w-0">
                    <Link href={`/profile/${user.username}`} className="hover:underline decoration-foreground/50 underline-offset-2">
                      <h3 className="font-bold text-base truncate leading-tight">{user.name}</h3>
                    </Link>
                    <p className="text-muted-foreground text-xs font-medium">{t("levelLabel")} {user.level} • {user.score} XP</p>
                  </div>
                </CardHeader>
                
                <CardContent className="px-4 pb-4 flex-1">
                  <div className="grid grid-cols-3 gap-2 h-full">
                    <div className="flex flex-col items-center justify-center p-2.5 bg-teal-50/50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800/30 transition-colors">
                      <MapIcon className="h-4 w-4 text-teal-500 mb-1" />
                      <span className="font-bold text-sm leading-none">{user._count.milestones}</span>
                      <span className="text-[9px] uppercase text-muted-foreground font-bold mt-1">{t("goalsLabel")}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2.5 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800/30 transition-colors">
                      <Swords className="h-4 w-4 text-orange-500 mb-1" />
                      <span className="font-bold text-sm leading-none">{totalQuests}</span>
                      <span className="text-[9px] uppercase text-muted-foreground font-bold mt-1">{t("questsLabel")}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2.5 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30 transition-colors">
                      <Users className="h-4 w-4 text-purple-500 mb-1" />
                      <span className="font-bold text-sm leading-none">{user._count.followedBy}</span>
                      <span className="text-[9px] uppercase text-muted-foreground font-bold mt-1">{t("followersLabel")}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <div className="w-full flex justify-center">
                    <FollowButton 
                      targetUserId={user.id} 
                      initialIsFollowing={followingIds.has(user.id)} 
                    />
                  </div>
                </CardFooter>
              </Card>
            )
          })}
          </div>
        )}
      </div>
    </div>
  )
}
