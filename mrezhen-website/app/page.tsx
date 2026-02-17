'use client'

import Link from "next/link"
import { motion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import { ArrowRight, Bot, CheckCircle2, Sparkles, Target, Trophy, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useTranslations } from "next-intl"


// --- COMPONENTS ---

function Hero({ t }: { t: any }) {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, 200])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9])
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [0, 10])

  return (
    <section ref={containerRef} className="relative min-h-[110vh] flex flex-col items-center justify-center overflow-hidden pt-20 pb-32">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

      <div className="container px-4 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="px-3 py-1 text-xs font-medium bg-muted border border-border rounded-full text-muted-foreground mb-6 inline-block">
            {t("badge")}
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
            {t("heroTitle1")} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              {t("heroTitle2")}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t("heroDescription")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="rounded-full h-12 px-8 text-base bg-foreground hover:bg-foreground/90 text-background shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                {t("startJourney")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base border-border hover:bg-accent">
                {t("logIn")}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* 3D Dashboard Preview */}
      <motion.div
        style={{ y, opacity, scale, rotateX, perspective: 1000 }}
        className="container mt-16 relative z-10 max-w-5xl"
      >
        <div className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden p-2">
          <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-transparent to-transparent z-10 pointer-events-none" />
          <img
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
            alt="Dashboard Preview"
            className="rounded-lg shadow-inner w-full object-cover opacity-90 border border-border"
          />

          {/* Floating UI Elements (Decoration) */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-6 top-10 bg-card p-4 rounded-xl shadow-xl border border-border hidden md:block"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full"><Trophy className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t("questCompleted")}</p>
                <p className="text-sm font-bold">{t("xpGained")}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-6 bottom-20 bg-card p-4 rounded-xl shadow-xl border border-border hidden md:block"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full"><Bot className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t("aiAssistant")}</p>
                <p className="text-sm font-bold">{t("aiQuote")}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

function Features({ t }: { t: any }) {
  return (
    <section className="py-24 bg-muted">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">{t("featuresTitle")}</h2>
          <p className="text-muted-foreground text-lg">{t("featuresDescription")}</p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">

          {/* Card 1: Large Left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2 bg-card rounded-3xl p-8 border border-border shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t("featureMilestones")}</h3>
              <p className="text-muted-foreground max-w-md">{t("featureMilestonesDesc")}</p>
            </div>
            <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-blue-50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          </motion.div>

          {/* Card 2: Small Right */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-zinc-900 text-white rounded-3xl p-8 shadow-sm relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t("featureAiCoach")}</h3>
              <p className="text-zinc-400">{t("featureAiCoachDesc")}</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>

          {/* Card 3: Small Left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card rounded-3xl p-8 border border-border shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 text-green-600">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t("featureCommunity")}</h3>
              <p className="text-muted-foreground">{t("featureCommunityDesc")}</p>
            </div>
          </motion.div>

          {/* Card 4: Large Right */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-card rounded-3xl p-8 border border-border shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t("featureAnalytics")}</h3>
              <p className="text-muted-foreground max-w-md">{t("featureAnalyticsDesc")}</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

function Stats({ t }: { t: any }) {
  return (
    <section className="py-20 border-y border-border bg-card">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: t("activeUsers"), value: "10k+" },
            { label: t("questsCompleted"), value: "1.2M" },
            { label: t("goalsSmashed"), value: "50k+" },
            { label: t("aiInteractions"), value: "500k+" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-foreground to-muted-foreground mb-2">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA({ t }: { t: any }) {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-zinc-900 z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0" />

      <div className="container px-4 mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t("ctaTitle")}
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10">
            {t("ctaDescription")}
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-zinc-200">
              {t("getStarted")}
            </Button>
          </Link>
          <p className="mt-6 text-xs text-zinc-500">{t("disclaimer")}</p>
        </motion.div>
      </div>
    </section>
  )
}

function Footer({ t }: { t: any }) {
  return (
    <footer className="py-12 bg-card border-t border-border">
      <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="bg-gray-600 text-white p-1.5 rounded-lg">
            <Image src="/favicon.ico" alt="Mrezhen Logo" height={20} width={20} />
          </div>
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            Mrezhen
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("allRights", { year: new Date().getFullYear() })}
        </p>
        <div className="flex gap-6 text-sm font-medium text-muted-foreground">
          <Link href="#" className="hover:text-foreground">{t("privacy")}</Link>
          <Link href="#" className="hover:text-foreground">{t("terms")}</Link>
          <Link href="#" className="hover:text-foreground">Twitter</Link>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  const t = useTranslations("home")

  return (
    <main className="min-h-screen bg-background">
      <Hero t={t} />
      <Stats t={t} />
      <Features t={t} />
      <CTA t={t} />
      <Footer t={t} />
    </main>
  )
}