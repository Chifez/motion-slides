import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, FileText, Network, ArrowRight, ChevronRight } from 'lucide-react'

const MODES = [
  {
    id: 'prompt',
    label: 'Deck from Prompt',
    icon: <Sparkles size={12} />,
    description: 'Describe your topic and get a complete slide deck with layouts, titles, and content blocks generated instantly.',
    preview: <PromptPreview />,
  },
  {
    id: 'readme',
    label: 'GitHub README',
    icon: <FileText size={12} />,
    description: 'Paste a GitHub README URL. The AI reads your project docs and turns them into a structured presentation with code examples preserved.',
    preview: <ReadmePreview />,
  },
  {
    id: 'arch',
    label: 'Architecture Diagram',
    icon: <Network size={12} />,
    description: 'Describe your system architecture in plain English. MotionSlides generates an interactive diagram with shapes, connections, and labels.',
    preview: <ArchPreview />,
  },
]

function PromptPreview() {
  const slides = ['Intro', 'Problem Space', 'Solution', 'Architecture', 'Demo', 'Q&A']
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 font-mono text-[11px] text-zinc-400">
        <span className="text-blue-400">→ </span>
        "Build a talk about building a real-time collaboration layer in TypeScript"
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Generating 6 slides</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {slides.map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="aspect-[16/9] bg-zinc-900 border border-zinc-800 rounded-md flex items-center justify-center p-1"
          >
            <span className="text-[7px] text-zinc-600 text-center font-semibold">{s}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ReadmePreview() {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-zinc-700 shrink-0" />
        <span className="text-[11px] text-zinc-500 font-mono truncate">github.com/vercel/next.js/blob/main/README.md</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {['Installation', 'Quick Start', 'API Reference', 'Deployment'].map((section) => (
          <div key={section} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 flex flex-col gap-1">
            <div className="h-1 w-12 bg-zinc-700 rounded-full" />
            <div className="h-0.5 w-20 bg-zinc-800 rounded-full" />
            <div className="h-0.5 w-16 bg-zinc-800 rounded-full" />
            <span className="text-[8px] text-zinc-600 mt-1">{section}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ArchPreview() {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 font-mono text-[11px] text-zinc-400">
        <span className="text-blue-400">→ </span>
        "React frontend → Express API → PostgreSQL → Redis cache"
      </div>
      <div className="bg-[#07070a] border border-zinc-800/60 rounded-xl p-3 flex items-center justify-center" style={{ minHeight: 80 }}>
        <svg width="230" height="60" viewBox="0 0 230 60">
          {[
            { x: 5, label: 'React', color: '#61dafb' },
            { x: 70, label: 'Express', color: '#6ee7b7' },
            { x: 135, label: 'Postgres', color: '#6b7280' },
            { x: 190, label: 'Redis', color: '#ef4444' },
          ].map((node, i) => (
            <g key={node.label}>
              <rect x={node.x} y={15} width="34" height="22" rx="4" fill="#0d0d10" stroke={node.color + '40'} strokeWidth="1" />
              <text x={node.x + 17} y={30} textAnchor="middle" fill={node.color} fontSize="6" fontWeight="700">{node.label}</text>
              {i < 3 && (
                <path d={`M${node.x + 34} 26 L${node.x + 70} 26`} stroke="rgba(255,255,255,0.15)" strokeWidth="1" markerEnd="url(#warr)" />
              )}
            </g>
          ))}
          <defs>
            <marker id="warr" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M0,0 L0,5 L5,2.5 z" fill="rgba(255,255,255,0.15)" />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  )
}

export function LandingAIStudioFeature() {
  const [activeMode, setActiveMode] = useState('prompt')
  const active = MODES.find(m => m.id === activeMode)!

  return (
    <section id="ai-studio" className="px-6 py-24 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-3 py-1.5 text-[11px] font-semibold text-blue-400 mb-5">
            <Sparkles size={12} />
            AI Presentation Studio
          </div>
          <h2
            className="text-[clamp(28px,4vw,48px)] font-bold tracking-tight text-white mb-4 leading-tight"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            From idea to slides in
            {' '}
            <span className="italic font-normal" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}>
              seconds.
            </span>
          </h2>
          <p className="text-zinc-500 text-[15px] max-w-xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            MotionSlides AI understands technical context — code, architecture, systems design — and generates presentations that actually make sense to engineers.
          </p>
        </div>

        {/* Mode tabs + preview */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-zinc-800">
            {MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-[12px] font-semibold border-none cursor-pointer transition-colors border-b-2 ${
                  activeMode === mode.id
                    ? 'text-blue-400 border-blue-500 bg-blue-600/5'
                    : 'text-zinc-600 border-transparent hover:text-zinc-400'
                }`}
                style={{ background: activeMode === mode.id ? 'rgba(59,130,246,0.05)' : 'transparent' }}
              >
                <span className={activeMode === mode.id ? 'text-blue-400' : 'text-zinc-600'}>{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Description */}
            <div className="p-8 border-r border-zinc-800/50 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMode}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-zinc-300 text-[15px] leading-relaxed mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {active.description}
                  </p>
                  <div className="flex items-center gap-2 text-[12px] text-blue-400 font-semibold">
                    Try it in the editor <ChevronRight size={14} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Preview */}
            <div className="p-6 bg-black/20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMode}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                >
                  {active.preview}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
