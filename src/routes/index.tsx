import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronRight, Zap, LayoutTemplate, Code2, Share2, WifiOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { LandingNavbar } from '@/components/LandingNavbar'
import { LandingFooter } from '@/components/LandingFooter'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const features = [
  {
    icon: <LayoutTemplate size={18} />,
    title: 'State-Based Slides',
    desc: 'Slides are scene states, not pages. Every transition is computed from element identity — not presets.',
  },
  {
    icon: <Code2 size={18} />,
    title: 'Code-Aware Diffs',
    desc: 'Insert a line of code and watch it animate into existence. LCS diffing makes every character count.',
  },
  {
    icon: <Share2 size={18} />,
    title: 'Architecture Diagrams',
    desc: 'Ten semantic shapes, drag-to-connect, and smooth SVG path morphing — built for technical storytelling.',
  },
  {
    icon: <WifiOff size={18} />,
    title: 'Offline First',
    desc: 'Works without a login. Everything lives in IndexedDB. Export to PDF, PNG, or HTML anytime.',
  },
]

function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto">
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap"
        rel="stylesheet"
      />

      <LandingNavbar />

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen pt-16 px-6 text-center overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[100px] bg-blue-600/15 pointer-events-none" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[300px] rounded-full blur-[80px] bg-purple-600/10 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center max-w-4xl w-full"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full px-3.5 py-1 text-xs text-blue-400 font-medium mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            <Zap size={11} />
            Motion-First Presentation Engine
          </div>

          {/* Heading — split typography */}
          <h1 className="leading-none mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Line 1: serif italic — editorial feel */}
            <span
              className="block text-[clamp(52px,8vw,96px)] text-neutral-200 font-normal italic mb-1"
              style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
            >
              Slides that move.
            </span>
            {/* Line 2: sans-serif bold — technical precision */}
            <span
              className="block text-[clamp(36px,5vw,64px)] font-bold tracking-[-2px] text-white"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Transitions that{' '}
              <span className="text-neutral-400">think.</span>
            </span>
          </h1>

          <p className="text-[17px] text-neutral-500 max-w-xl leading-relaxed mb-10" style={{ fontFamily: 'Inter, sans-serif' }}>
            MotionSlides is a cinematic presentation engine for developers and designers.
            Transitions are computed, not preset. Code animations are first-class citizens.
          </p>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-white text-black font-semibold text-[15px] px-7 py-3.5 rounded-full no-underline transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(255,255,255,0.15)]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Get Started <ChevronRight size={16} />
            </Link>
            <a
              href="https://github.com/Chifez/motion-slides"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-white/12 text-neutral-300 hover:text-white hover:border-white/25 text-[15px] font-medium px-7 py-3.5 rounded-full no-underline transition-all"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              View on GitHub
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-6 pb-24 pt-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[11px] uppercase tracking-widest text-neutral-600 font-semibold text-center mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Everything you need
          </p>
          <h2
            className="text-[clamp(28px,4vw,44px)] font-bold tracking-tight text-white text-center mb-12"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Built different
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:border-white/12 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-blue-400 mb-4">
                  {f.icon}
                </div>
                <div className="text-[15px] font-semibold text-neutral-100 mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>{f.title}</div>
                <div className="text-[13px] text-neutral-500 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 pb-24 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <h2
            className="text-[clamp(28px,4vw,52px)] font-bold tracking-tight text-white mb-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Ready to present differently?
          </h2>
          <p className="text-neutral-500 text-[16px] mb-8 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            No account needed. Open the dashboard and start building in seconds.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-white text-black font-semibold text-[15px] px-8 py-3.5 rounded-full no-underline hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(255,255,255,0.15)] transition-all"
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
