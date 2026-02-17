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
} from "lucide-react"

export const dynamic = "force-dynamic"

/* ── tiny helper to render match‑reason badges ─────────────── */
function ReasonBadge({ reason }: { reason: MatchReason }) {
  switch (reason.type) {
    case "interests":
      return (
        <Badge variant="secondary" className="text-[10px] gap-1 bg-pink-50 text-pink-600 border-pink-200">
          <Heart className="h-3 w-3" />
          {reason.shared.slice(0, 3).join(", ")}
        </Badge>
      )
    case "level":
      return (
        <Badge variant="secondary" className="text-[10px] gap-1 bg-blue-50 text-blue-600 border-blue-200">
          <Sparkles className="h-3 w-3" />
          Lvl {reason.theirLevel}
        </Badge>
      )
    case "education":
      return (
        <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-50 text-emerald-600 border-emerald-200">
          <GraduationCap className="h-3 w-3" />
          {reason.value}
        </Badge>
      )
    case "mathSkill":
      return (
        <Badge variant="secondary" className="text-[10px] gap-1 bg-amber-50 text-amber-600 border-amber-200">
          <Brain className="h-3 w-3" />
          Math skill {reason.theirSkill}/5
        </Badge>
      )
    case "questCategories":
      return (
        <Badge variant="secondary" className="text-[10px] gap-1 bg-violet-50 text-violet-600 border-violet-200">
          <BookOpen className="h-3 w-3" />
          {reason.shared.slice(0, 3).join(", ")}
        </Badge>
      )
  }
}

export default async function SuggestedPeoplePage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/login")

  const recommended = await getRecommendedUsers()

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <Link
              href="/community/people"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Back to all people
            </Link>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              People You May Like
            </h1>
            <p className="text-muted-foreground text-sm">
              Based on your interests, experience level, and knowledge sectors.
            </p>
          </div>
        </div>

        {/* Grid */}
        {recommended.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium mb-1">No suggestions yet</p>
            <p className="text-xs text-muted-foreground">
              Complete your profile and add interests so we can find people you may like.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((user) => (
              <Card
                key={user.id}
                className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow border-border"
              >
                <CardHeader className="p-4 pb-3 flex flex-row items-center gap-3 space-y-0">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback className="bg-purple-50 text-purple-600 font-bold">
                      {user.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden min-w-0">
                    <Link
                      href={`/profile/${user.username}`}
                      className="hover:underline decoration-zinc-900 decoration-1 underline-offset-2"
                    >
                      <h3 className="font-bold text-base truncate leading-tight">
                        {user.name}
                      </h3>
                    </Link>
                    <p className="text-muted-foreground text-xs font-medium">
                      Lvl {user.level} &bull; {user.score} XP
                    </p>
                  </div>
                  {/* Similarity % pill */}
                  <div className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    {user.similarityScore}% match
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
                    <div className="flex flex-col items-center justify-center p-2 bg-accent rounded-lg border border-border">
                      <span className="font-bold text-sm leading-none">
                        {user.goalCount}
                      </span>
                      <span className="text-[9px] uppercase text-muted-foreground font-bold mt-1">
                        Goals
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-accent rounded-lg border border-border">
                      <Swords className="h-3.5 w-3.5 text-orange-500 mb-1" />
                      <span className="font-bold text-sm leading-none">
                        {user.questCount}
                      </span>
                      <span className="text-[9px] uppercase text-muted-foreground font-bold mt-1">
                        Quests
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-accent rounded-lg border border-border">
                      <span className="font-bold text-sm leading-none">
                        {user.followerCount}
                      </span>
                      <span className="text-[9px] uppercase text-muted-foreground font-bold mt-1">
                        Followers
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <div className="w-full flex justify-center">
                    <FollowButton
                      targetUserId={user.id}
                      initialIsFollowing={false}
                    />
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
