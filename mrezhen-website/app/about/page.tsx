import { Sparkles, Target, Users, Shield, Heart, Globe } from "lucide-react"

export const dynamic = "force-static"

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
      {/* Hero */}
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-foreground text-background mx-auto">
          <span className="font-editorial text-2xl font-black leading-none">M</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">About Mrezhen</h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
          Smart choices, better lives. We help people set meaningful goals,
          track progress, and grow — powered by AI and a supportive community.
        </p>
      </div>

      {/* Mission */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          Our Mission
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We believe everyone deserves the tools to become their best self.
          Mrezhen combines cutting-edge AI coaching with gamified goal tracking
          to make self-improvement engaging, measurable, and social. Whether
          you&apos;re learning a new skill, building healthier habits, or
          leveling up your career — we&apos;re here to help you stay on track.
        </p>
      </section>

      {/* Features grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-center">What Makes Us Different</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: Sparkles,
              title: "AI-Powered Coaching",
              description:
                "Get personalised roadmaps, task verification, and smart recommendations from our AI assistant.",
            },
            {
              icon: Target,
              title: "Gamified Progress",
              description:
                "Milestones, quests, XP, levels, and 1v1 battles turn your goals into an adventure.",
            },
            {
              icon: Users,
              title: "Community-Driven",
              description:
                "Share progress, follow friends, compete on leaderboards, and inspire each other.",
            },
            {
              icon: Shield,
              title: "Privacy First",
              description:
                "Granular privacy controls let you decide who sees what. Your data is never sold.",
            },
            {
              icon: Globe,
              title: "Global & Accessible",
              description:
                "Available in 19+ languages with full accessibility support — screen readers, high contrast, and more.",
            },
            {
              icon: Heart,
              title: "Built With Care",
              description:
                "A remote-first team passionate about well-being, self-improvement, and clean software.",
            },
          ].map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Company Overview */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-lg font-semibold">About the Platform</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
          <p>
            Mrezhen started as a research project exploring how AI and behavioural
            science can make self-improvement more effective. It grew into a
            full-featured platform used by people worldwide to set goals, build
            habits, and support each other.
          </p>
          <p>
            The platform is built with modern, open-source technologies — Next.js,
            PostgreSQL, Python, and real-time messaging — and is maintained by a
            small, dedicated team that values quality, privacy, and user experience.
          </p>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center space-y-3 pb-6">
        <p className="text-sm text-muted-foreground">
          Questions or want to collaborate?
        </p>
        <a
          href="/contact"
          className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          Get in Touch
        </a>
      </div>
    </div>
  )
}
