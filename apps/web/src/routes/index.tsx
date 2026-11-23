import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { ArrowRight, Github } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { LandingNavbar } from '@/components/landing-navbar'
import { LandingFooter } from '@/components/landing-footer'
import { getSessionFn } from '@/lib/auth-actions'
import { LandingShowcase } from '@/components/marketing/landing-showcase'
import { LandingPillars } from '@/components/marketing/landing-pillars'
import { LandingGitDiffFeature } from '@/components/marketing/landing-git-diff-feature'
import { LandingAIStudioFeature } from '@/components/marketing/landing-ai-studio-feature'
import { LandingComparison } from '@/components/marketing/landing-comparison'
import { LandingExportOffline } from '@/components/marketing/landing-export-offline'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await getSessionFn()
    if (session?.user) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LandingPage,
})

function SectionDivider() {
  return (
    <div className="max-w-[1120px] mx-auto px-[24px]">
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
    </div>
  )
}

function LandingPage() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 overflow-x-clip relative selection:bg-blue-500/30 selection:text-white">
      {/* Static architectural atmosphere */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-x-0 top-0 h-[640px]"
          style={{
            background:
              'radial-gradient(ellipse 75% 45% at 50% -10%, rgba(59,130,246,0.11), transparent 70%)',
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-[720px] opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 30%, transparent 100%)',
          }}
        />
      </div>

      <LandingNavbar />

      {/* Hero */}
      <section className="relative z-10 pt-[132px] pb-[64px] px-[24px] max-w-[1120px] mx-auto text-center">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center border border-white/[0.08] bg-white/[0.03] rounded-full px-[12px] py-[5px] mb-[24px]">
            <span className="font-mono text-[11px] tracking-[0.08em] text-zinc-400 uppercase">
              Open-source presentation engine
            </span>
          </div>

          <h1 className="text-[clamp(40px,6vw,74px)] font-semibold leading-[1.03] tracking-[-0.038em] max-w-[860px] mb-[22px] bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Presentations engineered for systems, code, and motion.
          </h1>

          <p className="text-[16px] sm:text-[18px] leading-[1.6] tracking-[-0.01em] text-zinc-400 max-w-[620px] mb-[32px]">
            Design architecture walkthroughs, animate syntax-aware code diffs, branch decks like Git, and direct an embedded AI Copilot—then present live or export to MP4, GIF, and PDF.
          </p>

          <div className="flex items-center gap-[12px] flex-wrap justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-[8px] bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-[14px] px-[24px] py-[12px] rounded-full no-underline transition-[transform,background-color] duration-150 ease-out active:scale-[0.97]"
            >
              Start building <ArrowRight size={15} />
            </Link>
            <a
              href="https://github.com/Chifez/motion-slides"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-[8px] border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.18] text-zinc-200 text-[14px] font-medium px-[24px] py-[12px] rounded-full no-underline transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[0.97]"
            >
              <Github size={15} />
              View on GitHub
            </a>
          </div>

          <div className="mt-[28px] flex flex-wrap items-center justify-center gap-x-[20px] gap-y-[8px] font-mono text-[11px] text-zinc-500">
            <span>No signup required</span>
            <span className="text-zinc-700">·</span>
            <span>Local-first IndexedDB + Cloud Sync</span>
            <span className="text-zinc-700">·</span>
            <span>MIT License</span>
          </div>
        </motion.div>
      </section>

      {/* Interactive Editor Showcase */}
      <section className="relative z-10 max-w-[1160px] mx-auto px-[24px] pb-[96px]">
        <LandingShowcase />
      </section>

      <SectionDivider />

      <div className="relative z-10">
        <LandingPillars />
      </div>

      <SectionDivider />

      <div className="relative z-10">
        <LandingAIStudioFeature />
      </div>

      <SectionDivider />

      <div className="relative z-10">
        <LandingGitDiffFeature />
      </div>

      <SectionDivider />

      <div className="relative z-10">
        <LandingExportOffline />
      </div>

      <SectionDivider />

      <div className="relative z-10">
        <LandingComparison />
      </div>

      {/* Closing CTA */}
      <section className="relative z-10 max-w-[1072px] mx-auto px-[24px] py-[96px]">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="rounded-[16px] border border-white/[0.08] bg-[#0C0C0F] px-[32px] py-[64px] text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] flex flex-col items-center"
        >
          <h2 className="text-[clamp(28px,4vw,44px)] font-semibold tracking-[-0.03em] leading-[1.1] text-white mb-[14px] max-w-[600px]">
            Build your next technical deck in minutes.
          </h2>
          <p className="text-[16px] leading-[1.6] text-zinc-400 max-w-[500px] mb-[28px]">
            Open the canvas right in your browser—no credit card, no mandatory account, full local persistence.
          </p>
          <div className="flex items-center gap-[12px] flex-wrap justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-[8px] bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-[14px] px-[24px] py-[12px] rounded-full no-underline transition-[transform,background-color] duration-150 ease-out active:scale-[0.97]"
            >
              Open Editor <ArrowRight size={15} />
            </Link>
            <a
              href="https://github.com/Chifez/motion-slides"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-[8px] border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.18] text-zinc-200 text-[14px] font-medium px-[24px] py-[12px] rounded-full no-underline transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[0.97]"
            >
              <Github size={15} />
              Star on GitHub
            </a>
          </div>
        </motion.div>
      </section>

      <LandingFooter />
    </div>
  )
}
