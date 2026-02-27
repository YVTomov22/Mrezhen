import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/app/auth"
import { getRecommendedUsers, type MatchReason } from "@/app/actions/recommend"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { FollowButton } from "@/components/follow-button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  Brain,
  Swords,
  Heart,
  ArrowLeft,
  Users,
} from "lucide-react"
import { getTranslations } from "next-intl/server"

export const dynamic = "force-dynamic"

/* ── tiny helper to render match‑reason badges ─────────────── */
function ReasonBadge({ reason }: { reason: MatchReason }) {
  switch (reason.type) {
    case "interests":
      return (
        <Badge variant="secondary" className="text-[10px] gap-1 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800/40">
          <Heart className="h-3 w-3" />
          {reason.shared.slice(0, 3).join(", ")}
        </Badge>
      )
    case "level":
      return (
        <Badge variant="secondary" className="text-[10px] gap-1 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800/40">
          <Sparkles className="h-3 w-3" />
          Lvl {reason.theirLevel}
        </Badge>
      )
    case "education":
      return (
        <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40">
          <GraduationCap className="h-3 w-3" />
          {reason.value}
        </Badge>
      )
    case "mathSkill":
      return (
        <Badge variant="secondary" className="text-[10px] gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40">
          <Brain className="h-3 w-3" />
          Math skill {reason.theirSkill}/5
        </Badge>
      )
    case "questCategories":
      return (
        <Badge variant="secondary" className="text-[10px] gap-1 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/40">
          <BookOpen className="h-3 w-3" />
          {reason.shared.slice(0, 3).join(", ")}
        </Badge>
      )
  }
}

export default async function SuggestedPeoplePage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/login")
  const t = await getTranslations("community")

  const recommended = await getRecommendedUsers()

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header Banner ───────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border bg-card">
        <div className="relative max-w-6xl mx-auto px-6 py-8">
          <Link href="/community/people" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t("backToPeople")}
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3 text-foreground">
            <Sparkles className="h-7 w-7" /> {t("suggestedTitle")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("suggestedDesc")}</p>
        </div>
      </div>

      {/* ── Grid ────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {recommended.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-border rounded-xl p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-teal-500" />
            </div>
            <p className="font-semibold text-foreground mb-1">{t("noSuggestions")}</p>
            <p className="text-sm text-muted-foreground">{t("noSuggestionsDesc")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((user) => (
              <Card key={user.id} className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-all border-border group">
                <CardHeader className="p-4 pb-3 flex flex-row items-center gap-3 space-y-0">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-teal-100 dark:border-teal-900 ring-2 ring-teal-500/20">
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback className="bg-teal-50 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 font-bold">
                        {user.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 overflow-hidden min-w-0">
                    <Link href={`/profile/${user.username}`} className="hover:underline decoration-foreground/50 underline-offset-2">
                      <h3 className="font-bold text-base truncate leading-tight">{user.name}</h3>
                    </Link>
                    <p className="text-muted-foreground text-xs font-medium">
                      {t("levelLabel")} {user.level} &bull; {user.score} XP
                    </p>
                  </div>
                  {/* Similarity % pill */}
                  <div className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm">
                    {user.similarityScore}% {t("matchLabel")}
                  </div>
                </CardHeader>

                {/* Match reasons */}
                <CardContent className="px-4 pb-4 flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {user.matchReasons.slice(0, 4).map((r, i) => (
                      <ReasonBadge key={i} reason={r} />
                    ))}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center justify-center p-2.5 bg-teal-50/50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800/30">
                      <span className="font-bold text-sm leading-none">{user.goalCount}</span>
                      <span className="text-[9px] uppercase text-muted-foreground font-bold mt-1">{t("goalsLabel")}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2.5 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800/30">
                      <Swords className="h-3.5 w-3.5 text-orange-500 mb-1" />
                      <span className="font-bold text-sm leading-none">{user.questCount}</span>
                      <span className="text-[9px] uppercase text-muted-foreground font-bold mt-1">{t("questsLabel")}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2.5 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
                      <span className="font-bold text-sm leading-none">{user.followerCount}</span>
                      <span className="text-[9px] uppercase text-muted-foreground font-bold mt-1">{t("followersLabel")}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <div className="w-full flex justify-center">
                    <FollowButton targetUserId={user.id} initialIsFollowing={false} />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
