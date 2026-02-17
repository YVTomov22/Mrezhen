'use client'

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Bot, CheckCircle2, MessageCircle, Sparkles, Star, Target, Trophy, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useTranslations } from "next-intl"


// --- COMPONENTS ---

function Hero({ t }: { t: any }) {
  return (
    <section className="relative overflow-hidden">
      {/* Teal gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 -z-10" />
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10 -z-[5]">
        <div className="absolute top-10 right-10 w-20 h-20 border-2 border-white/30 rounded-lg rotate-12" />
        <div className="absolute top-32 right-40 w-14 h-14 border-2 border-white/20 rounded-full" />
        <div className="absolute bottom-20 right-20 w-16 h-16 border-2 border-white/25 rounded-lg -rotate-6" />
        <div className="absolute top-20 right-72 w-10 h-10 border-2 border-white/20 rounded-md rotate-45" />
        <div className="absolute bottom-32 right-56 w-12 h-12 border-2 border-white/15 rounded-full" />
      </div>

      <div className="container px-4 mx-auto py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
              {t("heroTitle1")}<br />
              {t("heroTitle2")}<br />
              {t("heroTitle3")}
            </h1>
            <p className="mt-6 text-lg text-teal-100/90 max-w-lg leading-relaxed">
              {t("heroDescription")}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="h-12 px-8 text-base rounded-lg bg-white text-teal-800 hover:bg-teal-50 font-semibold shadow-lg transition-all hover:scale-105">
                  {t("learnMore")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right: decorative floating icons */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:flex items-center justify-center relative h-80"
          >
            {/* AI Bot icon */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-4 right-12 bg-white/15 backdrop-blur-md p-5 rounded-2xl border border-white/20"
            >
              <Bot className="w-10 h-10 text-white" />
            </motion.div>
            {/* Chat icon */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-8 left-8 bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20"
            >
              <MessageCircle className="w-8 h-8 text-white" />
            </motion.div>
            {/* Target icon */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-20 left-16 bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20"
            >
              <Target className="w-8 h-8 text-white" />
            </motion.div>
            {/* Users icon */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute bottom-4 right-24 bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20"
            >
              <Users className="w-8 h-8 text-white" />
            </motion.div>
            {/* Center star */}
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Features({ t }: { t: any }) {
  const features = [
    {
      icon: <MessageCircle className="w-6 h-6 text-teal-600" />,
      title: t("featureChats"),
      desc: t("featureChatsDesc"),
    },
    {
      icon: <Bot className="w-6 h-6 text-teal-600" />,
      title: t("featureAi"),
      desc: t("featureAiDesc"),
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-teal-600" />,
      title: t("featureProof"),
      desc: t("featureProofDesc"),
    },
    {
      icon: <Star className="w-6 h-6 text-teal-600" />,
      title: t("featurePoints"),
      desc: t("featurePointsDesc"),
    },
  ]

  return (
    <section className="py-20 bg-background">
      <div className="container px-4 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl font-bold tracking-tight mb-3">{t("featuresTitle")}</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-11 h-11 bg-teal-100 dark:bg-teal-900/40 rounded-xl flex items-center justify-center">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Mission({ t }: { t: any }) {
  return (
    <section className="py-16 bg-muted">
      <div className="container px-4 mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            {t("missionPre")}
            <span className="text-teal-600 dark:text-teal-400 font-semibold">{t("missionHighlight1")}</span>
            {t("missionMid")}
            <span className="text-teal-600 dark:text-teal-400 font-semibold">{t("missionHighlight2")}</span>
            {t("missionPost")}
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function Stats({ t }: { t: any }) {
  return (
    <section className="py-16 bg-background border-y border-border">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: t("activeUsers"), value: "10k+" },
            { label: t("questsCompleted"), value: "1.2M" },
            { label: t("goalsSmashed"), value: "50k+" },
            { label: t("aiInteractions"), value: "500k+" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-extrabold text-teal-600 dark:text-teal-400 mb-1">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 z-0" />

      <div className="container px-4 mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("ctaTitle")}
          </h2>
          <p className="text-teal-100/80 text-lg max-w-xl mx-auto mb-8">
            {t("ctaDescription")}
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="h-13 px-8 text-base rounded-lg bg-white text-teal-800 hover:bg-teal-50 font-semibold shadow-lg transition-all hover:scale-105">
              {t("getStarted")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="mt-5 text-xs text-teal-200/60">{t("disclaimer")}</p>
        </motion.div>
      </div>
    </section>
  )
}

function Footer({ t }: { t: any }) {
  return (
    <footer className="py-10 bg-card border-t border-border">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 text-white p-1.5 rounded-lg">
              <Image src="/favicon.ico" alt="Mrezhen Logo" height={20} width={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">Mrezhen</span>
          </div>

          {/* Links */}
          <div className="flex gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">{t("aboutUs")}</Link>
            <Link href="#" className="hover:text-foreground transition-colors">{t("terms")}</Link>
            <Link href="#" className="hover:text-foreground transition-colors">{t("privacy")}</Link>
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            {t("allRights", { year: new Date().getFullYear() })}
          </p>
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
      <Features t={t} />
      <Mission t={t} />
      <Stats t={t} />
      <CTA t={t} />
      <Footer t={t} />
    </main>
  )
}