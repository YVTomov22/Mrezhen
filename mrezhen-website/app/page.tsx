'use client'

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"


// --- COMPONENTS ---

function Hero({ t }: { t: any }) {
  return (
    <section className="border-b border-border">
      <div className="container px-6 mx-auto py-24 md:py-40 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <p className="editorial-caption text-muted-foreground mb-6">
            {t("heroDescription")}
          </p>
          <h1 className="editorial-headline text-5xl md:text-7xl lg:text-8xl">
            {t("heroTitle1")}<br />
            {t("heroTitle2")}<br />
            {t("heroTitle3")}
          </h1>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="h-12 px-10 text-[13px] tracking-wide uppercase bg-foreground text-background hover:bg-foreground/90 transition-all">
                {t("learnMore")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Features({ t }: { t: any }) {
  const features = [
    { title: t("featureChats"), desc: t("featureChatsDesc") },
    { title: t("featureAi"), desc: t("featureAiDesc") },
    { title: t("featureProof"), desc: t("featureProofDesc") },
    { title: t("featurePoints"), desc: t("featurePointsDesc") },
  ]

  return (
    <section id="features" className="py-24 bg-background border-b border-border">
      <div className="container px-6 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="editorial-headline text-3xl md:text-4xl">{t("featuresTitle")}</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px border border-border">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-8 bg-background border-b border-r border-border last:border-b-0 editorial-lift"
            >
              <span className="editorial-caption text-muted-foreground mb-3 block">0{i + 1}</span>
              <h3 className="editorial-subhead text-lg mb-2">{f.title}</h3>
              <p className="editorial-body text-muted-foreground text-[14px]">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Mission({ t }: { t: any }) {
  return (
    <section className="py-24 bg-muted/30 border-b border-border">
      <div className="container px-6 mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="editorial-body text-xl md:text-2xl leading-relaxed">
            {t("missionPre")}
            <strong className="text-foreground font-semibold">{t("missionHighlight1")}</strong>
            {t("missionMid")}
            <strong className="text-foreground font-semibold">{t("missionHighlight2")}</strong>
            {t("missionPost")}
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function Stats({ t }: { t: any }) {
  return (
    <section className="py-20 bg-background border-b border-border">
      <div className="container px-6 mx-auto max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-border">
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
              className="p-8 bg-background text-center border-r border-border last:border-r-0"
            >
              <div className="text-3xl md:text-4xl font-black tracking-tighter mb-2">
                {stat.value}
              </div>
              <div className="editorial-caption text-muted-foreground">
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
    <section className="py-24 bg-foreground text-background">
      <div className="container px-6 mx-auto text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-editorial text-4xl md:text-5xl font-black tracking-tighter leading-[0.92]">
            {t("ctaTitle")}
          </h2>
          <p className="mt-6 text-background/70 text-lg max-w-xl mx-auto leading-relaxed font-light">
            {t("ctaDescription")}
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="mt-10 h-12 px-10 text-[13px] tracking-wide uppercase bg-background text-foreground hover:bg-background/90 transition-all">
              {t("getStarted")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="mt-6 text-[11px] text-background/40 uppercase tracking-wide">{t("disclaimer")}</p>
        </motion.div>
      </div>
    </section>
  )
}

function Footer({ t }: { t: any }) {
  return (
    <footer className="py-10 bg-foreground text-background border-t border-background/10">
      <div className="container px-6 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-background text-foreground flex items-center justify-center">
              <span className="font-editorial text-sm font-black tracking-tight">M</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Mrezhen</span>
          </div>

          {/* Links */}
          <div className="flex gap-8 editorial-caption text-background/50">
            <Link href="#" className="hover:text-background transition-colors">{t("aboutUs")}</Link>
            <Link href="#" className="hover:text-background transition-colors">{t("terms")}</Link>
            <Link href="#" className="hover:text-background transition-colors">{t("privacy")}</Link>
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