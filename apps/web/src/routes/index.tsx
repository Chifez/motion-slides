import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { ChevronRight, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { LandingNavbar } from '@/components/LandingNavbar'
import { LandingFooter } from '@/components/LandingFooter'
import { getSessionFn } from '@/lib/auth-actions'
import { LandingShowcase } from '@/components/marketing/LandingShowcase'
import { LandingPillars } from '@/components/marketing/LandingPillars'
import { LandingGitDiffFeature } from '@/components/marketing/LandingGitDiffFeature'
import { LandingAIStudioFeature } from '@/components/marketing/LandingAIStudioFeature'
import { LandingComparison } from '@/components/marketing/LandingComparison'
import { LandingExportOffline } from '@/components/marketing/LandingExportOffline'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await getSessionFn()
    if (session?.user) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LandingPage,
})


function LandingPage() {
  return (
    <div className="min-h-screen text-white overflow-y-auto" style={{ background: '#050507' }}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap"
        rel="stylesheet"
      />

      {/* ── Animated background orbs ─────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Primary blue orb - top center */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.12, 0.2, 0.12],
            x: ['-50%', '-45%', '-55%', '-50%'],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute"
          style={{
            top: '-80px',
            left: '50%',
            width: 800,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,1) 0%, transparent 70%)',
            filter: 'blur(80px)',
            transform: 'translateX(-50%)',
          }}
        />
        {/* Purple orb - bottom right */}
        <motion.div
          animate={{
            scale: [1, 1.2, 0.9, 1],
            opacity: [0.08, 0.14, 0.08],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute"
          style={{
            bottom: '5%',
            right: '-5%',
            width: 600,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,1) 0%, transparent 70%)',
            filter: 'blur(90px)',
          }}
        />
        {/* Emerald orb - mid left */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.1, 0.05],
            y: [0, -30, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          className="absolute"
          style={{
            top: '40%',
            left: '-8%',
            width: 500,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,1) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
      </div>

      <LandingNavbar />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center pt-36 pb-16 md:min-h-screen md:py-20 px-6 text-center overflow-hidden z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center max-w-4xl w-full"
        >
          {/* Badge */}
          <div
            className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full px-3.5 py-1 text-xs text-blue-400 font-medium mb-6 md:mb-8"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <Zap size={11} />
            Motion-First Presentation Engine
          </div>

          {/* Heading */}
          <h1 className="leading-none mb-5 md:mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            <span
              className="block text-[clamp(52px,8vw,96px)] text-neutral-200 font-normal italic mb-1"
              style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
            >
              Slides that move.
            </span>
            <span
              className="block text-[clamp(36px,5vw,64px)] font-bold tracking-[-2px] text-white"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Transitions that{' '}
              <span className="text-neutral-400">think.</span>
            </span>
          </h1>

          <p
            className="text-[16px] sm:text-[17px] text-neutral-500 max-w-xl leading-relaxed mb-8 md:mb-10"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            MotionSlides is a cinematic presentation engine for developers and designers.
            Transitions are computed, not preset. Code animations are first-class citizens.
          </p>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-white text-black font-semibold text-[15px] px-7 py-3.5 rounded-full no-underline transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(255,255,255,0.15)]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Get Started <ChevronRight size={16} />
            </Link>
            <a
              href="https://github.com/Chifez/motion-slides"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-white/12 text-neutral-300 hover:text-white hover:border-white/25 text-[15px] font-medium px-7 py-3.5 rounded-full no-underline transition"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              View on GitHub
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── Interactive Editor Showcase ────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-12 relative z-10">
        <LandingShowcase />
      </section>

      {/* ── Subtle section divider ─────────────────────────────────────────── */}
      <div className="relative z-10 h-px max-w-2xl mx-auto bg-gradient-to-r from-transparent via-zinc-800 to-transparent my-4" />

      {/* ── Feature Pillars ───────────────────────────────────────────────── */}
      <div className="relative z-10">
        <LandingPillars />
      </div>

      <div className="relative z-10 h-px max-w-2xl mx-auto bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      {/* ── Git & Code Intelligence ────────────────────────────────────────── */}
      <div className="relative z-10">
        <LandingGitDiffFeature />
      </div>

      <div className="relative z-10 h-px max-w-2xl mx-auto bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      {/* ── AI Presentation Studio ────────────────────────────────────────── */}
      <div className="relative z-10">
        <LandingAIStudioFeature />
      </div>

      <div className="relative z-10 h-px max-w-2xl mx-auto bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      {/* ── Export & Offline ──────────────────────────────────────────────── */}
      <div className="relative z-10">
        <LandingExportOffline />
      </div>

      <div className="relative z-10 h-px max-w-2xl mx-auto bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      {/* ── Comparison ────────────────────────────────────────────────────── */}
      <div className="relative z-10">
        <LandingComparison />
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          {/* Glow ring */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <h2
            className="text-[clamp(28px,4vw,52px)] font-bold tracking-tight text-white mb-4 relative"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Ready to present{' '}
            <span className="italic font-normal" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}>
              differently?
            </span>
          </h2>
          <p
            className="text-neutral-500 text-[16px] mb-8 leading-relaxed"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            No account needed. Open the dashboard and start building in seconds.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-white text-black font-semibold text-[15px] px-8 py-3.5 rounded-full no-underline hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(255,255,255,0.15)] transition"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Open Dashboard <ChevronRight size={16} />
          </Link>
        </motion.div>
      </section>

      <LandingFooter />
    </div>
  )
}
