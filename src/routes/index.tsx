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
    <div className="landing">
      {/* Ambient glows */}
      <div className="landing-glow landing-glow-1" />
      <div className="landing-glow landing-glow-2" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '100%', maxWidth: 760, padding: '0 24px' }}
      >
        <div className="landing-badge">
          <Zap size={11} />
          Motion-First Presentations
        </div>

        <h1 className="landing-title">
          Slides that<br />
          <span>think in motion</span>
        </h1>

        <p className="landing-sub">
          MotionSlides is a cinematic presentation engine for developers and designers.
          Transitions are computed, not preset. Code animations are first-class.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/dashboard" className="landing-cta">
            Open Dashboard <ChevronRight size={16} />
          </Link>
        </div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 56, width: '100%' }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f2f2f2', marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
