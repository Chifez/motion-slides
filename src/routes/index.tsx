import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronRight, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const features = [
  { title: 'State-Based Slides', desc: 'Slides are scene states, not pages. Every transition is computed.' },
  { title: 'Code-Aware Diffs', desc: 'Insert a line of code — watch it animate into existence.' },
  { title: 'Architecture Diagrams', desc: '10 semantic shapes, drag connectors, and smooth morphing.' },
  { title: 'Offline First', desc: 'Works without a login. Export anytime. Sync when ready.' },
]

function LandingPage() {
  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative">
      {/* Ambient glows */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[80px] bg-blue-500/20 pointer-events-none" />
      <div className="absolute bottom-0 right-[10%] w-[400px] h-[300px] rounded-full blur-[80px] bg-purple-500/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center w-full max-w-3xl px-6"
      >
        {/* Logo */}
        <img src="/logo.png" alt="MotionSlides" className="h-14 w-auto mb-6" />

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/25 rounded-full px-3.5 py-1 text-xs text-blue-400 font-medium mb-7">
          <Zap size={11} />
          Motion-First Presentations
        </div>

        <h1 className="text-[clamp(48px,7vw,88px)] font-extrabold tracking-[-3px] leading-none text-white text-center mb-5">
          Slides that <br />
          <span className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            think in motion
          </span>
        </h1>

        <p className="text-lg text-neutral-500 text-center max-w-lg leading-relaxed mb-11">
          MotionSlides is a cinematic presentation engine for developers and designers.
          Transitions are computed, not preset. Code animations are first-class.
        </p>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-white text-black font-semibold text-[15px] px-8 py-3.5 rounded-full no-underline transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(255,255,255,0.15)]"
        >
          Open Dashboard <ChevronRight size={16} />
        </Link>

        {/* Feature grid */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-2 gap-3 mt-14 w-full"
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4"
            >
              <div className="text-[13px] font-semibold text-neutral-100 mb-1">{f.title}</div>
              <div className="text-xs text-neutral-500 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
