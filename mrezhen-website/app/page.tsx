'use client'

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Bot, CheckCircle2, ChevronLeft, MessageCircle, Sparkles, Star, Target, Trophy, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useTranslations } from "next-intl"


// --- COMPONENTS ---

function Hero({ t }: { t: any }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 dark:from-teal-800 dark:via-teal-900 dark:to-emerald-950">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
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
    <section id="features" className="py-20 bg-background">
      <div className="container px-4 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl font-bold tracking-tight mb-3 flex items-center justify-center gap-1">
            <ChevronLeft className="w-7 h-7 text-teal-600" />
            {t("featuresTitle")}
          </h2>
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
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 dark:from-teal-900 dark:via-teal-950 dark:to-emerald-950">
      <div className="container px-4 mx-auto relative text-center">
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
    <footer className="py-10 bg-slate-900 dark:bg-slate-950 text-white">
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
          <div className="flex gap-6 text-sm font-medium text-gray-400">
            <Link href="#" className="hover:text-white transition-colors">{t("aboutUs")}</Link>
            <Link href="#" className="hover:text-white transition-colors">{t("terms")}</Link>
            <Link href="#" className="hover:text-white transition-colors">{t("privacy")}</Link>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-3">
            <a href="#" className="w-9 h-9 rounded-full bg-gray-700 hover:bg-teal-600 flex items-center justify-center transition-colors" aria-label="Twitter">
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-gray-700 hover:bg-teal-600 flex items-center justify-center transition-colors" aria-label="Twitter Alt">
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-gray-700 hover:bg-teal-600 flex items-center justify-center transition-colors" aria-label="YouTube">
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  const t = useTranslations("home")

  return (
    <div className="min-h-screen bg-background">
      <Hero t={t} />
      <Features t={t} />
      <Mission t={t} />
      <Stats t={t} />
      <CTA t={t} />
      <Footer t={t} />
    </div>
  )
}