'use client'

import Link from "next/link"
import { useEffect, useRef } from "react"
import { useTranslations } from "next-intl"

// Components

function Hero({ t }: { t: any }) {
  return (
    <section id="hero" className="relative z-10 min-h-screen flex flex-col justify-center px-[10vw]">
      <div className="max-w-4xl">
        <span className="fade-in block text-sm uppercase tracking-widest opacity-70 mb-4 text-white">Signal from Noise</span>
        <h1 className="fade-in text-[clamp(3rem,8vw,8rem)] font-bold tracking-[-0.04em] leading-[0.95] mb-6 text-white" style={{ transitionDelay: '0.1s' }}>
          {t("heroTitle1")}<br />
          {t("heroTitle2")}<br />
          {t("heroTitle3")}
        </h1>
        <p className="fade-in text-[#888888] text-lg md:text-xl max-w-[50ch] leading-relaxed" style={{ transitionDelay: '0.2s' }}>
          {t("heroDescription")}
        </p>
      </div>
    </section>
  )
}

function Synthesis({ t }: { t: any }) {
  return (
    <section id="synthesis" className="relative z-10 min-h-screen flex flex-col justify-center px-[10vw]">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span className="fade-in block text-sm uppercase tracking-widest opacity-70 mb-4 text-white">Real-time processing</span>
          <h2 className="fade-in text-[clamp(2rem,4vw,4rem)] font-bold tracking-[-0.04em] leading-[0.95] mb-4 text-white">
            {t("featureChats")}<br />Instantly.
          </h2>
          <p className="fade-in text-[#888888] text-lg leading-relaxed">
            {t("featureChatsDesc")}
          </p>
        </div>
        <div className="fade-in h-[50vh] bg-white/5 rounded-3xl backdrop-blur-md border border-white/10 flex items-center justify-center gap-1.5 overflow-hidden">
          <div className="bar-anim w-1.5 rounded-full bg-white" style={{ animationDelay: '0.1s' }}></div>
          <div className="bar-anim w-1.5 rounded-full bg-[#888888]" style={{ animationDelay: '0.3s' }}></div>
          <div className="bar-anim w-1.5 rounded-full bg-white/50" style={{ animationDelay: '0.5s' }}></div>
          <div className="bar-anim w-1.5 rounded-full bg-white" style={{ animationDelay: '0.2s' }}></div>
          <div className="bar-anim w-1.5 rounded-full bg-[#888888]" style={{ animationDelay: '0.4s' }}></div>
          <div className="bar-anim w-1.5 rounded-full bg-white" style={{ animationDelay: '0.1s' }}></div>
          <div className="bar-anim w-1.5 rounded-full bg-white/50" style={{ animationDelay: '0.3s' }}></div>
        </div>
      </div>
    </section>
  )
}

function Context({ t }: { t: any }) {
  return (
    <section id="context" className="relative z-10 min-h-screen flex flex-col justify-center px-[10vw]">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div className="fade-in h-[50vh] bg-white/5 rounded-3xl backdrop-blur-md border border-white/10 relative flex items-center justify-center order-2 md:order-1">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center after:content-[''] after:w-5 after:h-5 after:bg-[#FFCC00] after:rounded-full after:shadow-[0_0_20px_#FFCC00]"></div>
          <div className="satellite-anim absolute w-3 h-3 bg-[#888888] rounded-full" style={{ animationDelay: '0s' }}></div>
          <div className="satellite-anim absolute w-2 h-2 bg-[#888888]/70 rounded-full" style={{ animationDelay: '-1.3s' }}></div>
          <div className="satellite-anim absolute w-1.5 h-1.5 bg-[#888888]/50 rounded-full" style={{ animationDelay: '-2.7s' }}></div>
        </div>
        <div className="order-1 md:order-2">
          <span className="fade-in block text-sm uppercase tracking-widest opacity-70 mb-4 text-white">Adaptive Learning</span>
          <h2 className="fade-in text-[clamp(2rem,4vw,4rem)] font-bold tracking-[-0.04em] leading-[0.95] mb-4 text-white">
            {t("featureAi")}<br />Awareness.
          </h2>
          <p className="fade-in text-[#888888] text-lg leading-relaxed">
            {t("featureAiDesc")}
          </p>
        </div>
      </div>
    </section>
  )
}

function Download({ t }: { t: any }) {
  return (
    <section id="download" className="relative z-10 min-h-screen flex flex-col justify-center items-center text-center px-[10vw]">
      <h2 className="fade-in text-[clamp(2rem,4vw,4rem)] font-bold tracking-[-0.04em] leading-[0.95] mb-8 text-white">
        {t("ctaTitle")}
      </h2>
      <Link href="/auth/register" className="fade-in px-16 h-20 inline-flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-2xl font-semibold text-white hover:bg-white/20 hover:scale-[1.02] transition-all duration-300">
        {t("getStarted")}
      </Link>
      <div className="fade-in mt-8 opacity-50 text-sm text-white" style={{ transitionDelay: '0.2s' }}>
        {t("disclaimer")}
      </div>
    </section>
  )
}

export default function LandingPage() {
  const t = useTranslations("home")
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rootRef.current) return

    const root = rootRef.current
    const sections = root.querySelectorAll('section')
    const timeline = root.querySelector('#timeline')
    const orbs = {
      1: root.querySelector('#orb-1') as HTMLElement,
      2: root.querySelector('#orb-2') as HTMLElement,
      3: root.querySelector('#orb-3') as HTMLElement
    }

    if (timeline) {
      timeline.innerHTML = ''
      for (let i = 0; i < 50; i++) {
        const tick = document.createElement('div')
        tick.className = 'flex-1 h-2 bg-white/20 transition-all duration-300'
        timeline.appendChild(tick)
      }
    }
    const ticks = timeline?.querySelectorAll('div')

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id
          const index = Array.from(sections).indexOf(entry.target as HTMLElement)
          
          entry.target.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'))

          if (id === 'hero') {
            if (orbs[1]) { orbs[1].style.transform = 'translate(0,0) scale(1)'; orbs[1].style.background = '#FF3B30'; }
            if (orbs[2]) { orbs[2].style.transform = 'translate(0,0) scale(1)'; orbs[2].style.background = '#FFCC00'; }
            if (orbs[3]) { orbs[3].style.opacity = '0'; }
          } else if (id === 'synthesis') {
            if (orbs[1]) { orbs[1].style.transform = 'translate(-20%, 30%) scale(0.8)'; orbs[1].style.background = '#34C759'; }
            if (orbs[2]) { orbs[2].style.transform = 'translate(-30%, -20%) scale(1.2)'; orbs[2].style.background = '#007AFF'; orbs[2].style.opacity = '0.5'; }
            if (orbs[3]) { orbs[3].style.transform = 'translate(10%, -10%) scale(1)'; orbs[3].style.opacity = '0.8'; orbs[3].style.background = '#34C759'; }
          } else if (id === 'context') {
            if (orbs[1]) { orbs[1].style.transform = 'translate(40%, -10%) scale(1.5)'; orbs[1].style.background = '#FFCC00'; orbs[1].style.opacity = '0.3'; }
            if (orbs[2]) { orbs[2].style.transform = 'translate(-20%, 20%) scale(0.5)'; orbs[2].style.background = '#FFFFFF'; orbs[2].style.opacity = '0.2'; }
            if (orbs[3]) { orbs[3].style.transform = 'translate(0,0) scale(1.1)'; orbs[3].style.background = '#FFCC00'; orbs[3].style.opacity = '0.6'; }
          }

          if (ticks && ticks.length > 0) {
            const ticksPerSection = Math.floor(ticks.length / sections.length)
            const start = index * ticksPerSection
            ticks.forEach((t, i) => {
              if (i >= start && i < start + ticksPerSection) {
                t.style.height = '30px'
                t.style.backgroundColor = '#F0F0F0'
              } else {
                t.style.height = '8px'
                t.style.backgroundColor = 'rgba(255,255,255,0.2)'
              }
            })
          }
        }
      })
    }, { threshold: 0.5 })

    sections.forEach(s => observer.observe(s))

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={rootRef} className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#F0F0F0] font-sans selection:bg-white selection:text-black">
      <style dangerouslySetInnerHTML={{__html: `
        :root { --ease-out: cubic-bezier(0.16, 1, 0.3, 1); }
        .orb { filter: blur(80px); transition: transform 2s var(--ease-out), background 2s ease, opacity 2s ease; mix-blend-mode: screen; }
        .fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.8s ease, transform 0.8s var(--ease-out); }
        .fade-in.visible { opacity: 1; transform: translateY(0); }
        @keyframes equalize { 0%, 100% { height: 20px; } 50% { height: 120px; } }
        .bar-anim { animation: equalize 1s infinite ease-in-out; }
        @keyframes orbit { from { transform: rotate(0deg) translateX(80px) rotate(0deg); } to { transform: rotate(360deg) translateX(80px) rotate(-360deg); } }
        .satellite-anim { animation: orbit 4s infinite linear; }
      `}} />

      {/* Orb System */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div id="orb-1" className="orb absolute w-[60vh] h-[60vh] top-[20%] left-[20%] rounded-full bg-[#FF3B30] opacity-60"></div>
        <div id="orb-2" className="orb absolute w-[50vh] h-[50vh] top-[30%] right-[20%] rounded-full bg-[#FFCC00] opacity-60"></div>
        <div id="orb-3" className="orb absolute w-[40vh] h-[40vh] bottom-[10%] left-[40%] rounded-full bg-[#34C759] opacity-0"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full p-8 flex justify-between items-start z-[100] mix-blend-difference">
        <div className="font-bold tracking-tight text-xl text-white">MREZHEN</div>
        <div className="font-bold tracking-tight text-xl text-white">v1.0</div>
      </nav>

      <Hero t={t} />
      <Synthesis t={t} />
      <Context t={t} />
      <Download t={t} />

      {/* Timeline UI */}
      <div id="timeline" className="fixed bottom-12 left-12 right-12 h-16 flex items-end gap-1 z-50 pointer-events-none overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
      </div>
    </div>
  )
}