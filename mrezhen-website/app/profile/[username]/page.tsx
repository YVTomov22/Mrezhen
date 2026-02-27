import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FollowButton } from "@/components/follow-button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MessageSquare } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { checkUserHasActiveStory } from "@/app/actions/story"
import { StoryAvatarRing } from "@/components/story/story-avatar-ring"

// Next.js 15: params is a Promise
export default async function PublicProfilePage(props: { params: Promise<{ username: string }> }) {
  const t = await getTranslations("profile")
  const params = await props.params;
  const { username } = params;
  const session = await auth()

  // Fetch target user public info (supports both username and user ID lookups)
  let user = await prisma.user.findUnique({
    where: { username },
    include: {
      _count: {
        select: {
          followedBy: true,
          following: true,
          milestones: true,
          quests: true 
        }
      },
      quests: {
        where: { status: "COMPLETED" },
        take: 5,
        orderBy: { updatedAt: 'desc' }
      }
    }
  })

  // Fallback: try looking up by user ID (for users without a username)
  if (!user) {
    user = await prisma.user.findUnique({
      where: { id: username },
      include: {
        _count: {
          select: {
            followedBy: true,
            following: true,
            milestones: true,
            quests: true 
          }
        },
        quests: {
          where: { status: "COMPLETED" },
          take: 5,
          orderBy: { updatedAt: 'desc' }
        }
      }
    })
  }

  if (!user) return notFound()

  // Check if viewing own profile
  const isOwnProfile = session?.user?.email === user.email
  
  // Check follow status
  let isFollowing = false
  if (session?.user?.email && !isOwnProfile) {
    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { following: true }
    })
    isFollowing = currentUser?.following.some(f => f.followingId === user.id) ?? false
  }

  // Check if user has active (non-expired) stories
  const hasActiveStory = await checkUserHasActiveStory(user.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-start gap-6">
            <StoryAvatarRing
              userId={user.id}
              image={user.image}
              name={user.name}
              hasActiveStory={hasActiveStory}
              size="lg"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="editorial-headline text-3xl">{user.name}</h1>
                  <p className="editorial-caption text-muted-foreground mt-1">{t("levelExplorer", { level: user.level })}</p>
                </div>
                
                {!isOwnProfile && session?.user && (
                  <div className="flex gap-2 shrink-0">
                    <Link 
                      href={`/messages?username=${user.username}`}
                      className="inline-flex items-center gap-2 px-4 py-2 text-[12px] tracking-wide uppercase text-foreground border border-border hover:bg-foreground hover:text-background transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {t("message")}
                    </Link>
                    <FollowButton targetUserId={user.id} initialIsFollowing={isFollowing} />
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-4 editorial-caption text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {t("joined", { year: new Date(user.createdAt).getFullYear() })}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {user._count.followedBy} {t("followers")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-border">
          <StatCard label={t("totalXp")} value={user.score} />
          <StatCard label={t("questsDone")} value={user.quests.length} />
          <StatCard label={t("activeGoals")} value={user._count.milestones} />
          <StatCard label={t("following")} value={user._count.following} />
        </div>

        {/* Recent Achievements */}
        <div>
          <h3 className="editorial-caption text-muted-foreground mb-4">{t("recentAchievements")}</h3>
          {user.quests.length === 0 ? (
            <p className="editorial-body text-muted-foreground text-sm">{t("noCompletedQuests")}</p>
          ) : (
            <div className="divide-y divide-border border border-border">
              {user.quests.map(quest => (
                <div key={quest.id} className="flex items-center justify-between p-4">
                  <span className="text-[13px] font-semibold tracking-tight text-foreground">{quest.title}</span>
                  <Badge variant="secondary" className="bg-muted text-foreground border border-border text-[11px]">
                    +{quest.completionPoints} XP
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-5 bg-background border-r border-border last:border-r-0 text-center">
      <p className="text-2xl font-black tracking-tighter text-foreground">{value}</p>
      <p className="editorial-caption text-muted-foreground mt-1">{label}</p>
    </div>
  )
}