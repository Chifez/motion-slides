import { motion } from 'framer-motion'
import {
  Zap, Mic2, Network, ArrowRight, Workflow
} from 'lucide-react'

const PILLARS = [
  {
    id: 'magic-move',
    icon: <Zap size={20} />,
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.2)',
    tag: 'Magic Move Engine',
    headline: 'Transitions that understand identity, not position.',
    body: 'Every element carries a persistent ID across slide states. When slides change, MotionSlides computes the delta — elements fly to their new home, morph shape, and shift opacity. Zero manual keyframes.',
    bullets: ['Spring physics', 'Cross-slide layoutId morphing', 'Enter / exit choreography'],
    visual: <MagicMoveVisual />,
  },
  {
    id: 'architecture',
    icon: <Network size={20} />,
    accent: '#8b5cf6',
    accentBg: 'rgba(139,92,246,0.08)',
    accentBorder: 'rgba(139,92,246,0.2)',
    tag: 'Architecture Diagramming',
    headline: '10 semantic shapes. Smart connectors. SVG morphing.',
    body: 'Draw service blueprints with purpose-built IT shapes — servers, databases, cloud nodes, queues, and clients. Elbow routing avoids overlaps automatically. Section boundaries expand to fit.',
    bullets: ['AWS service icons built-in', 'Drag-to-connect handles', 'Path morphing across states'],
    visual: <ArchVisual />,
  },
  {
    id: 'audio',
    icon: <Mic2 size={20} />,
    accent: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.08)',
    accentBorder: 'rgba(245,158,11,0.2)',
    tag: 'Audio & Subtitle Studio',
    headline: 'Record, trim, and sync narration — all inside the editor.',
    body: 'Multi-track voiceover recording with waveform visualization. Trim handles let you cut to the frame. Subtitles auto-sync to your audio timeline for accessible, video-ready presentations.',
    bullets: ['Multi-track audio timeline', 'Waveform trim editor', 'Auto-synced captions'],
    visual: <AudioVisual />,
  },
  {
    id: 'prototyping',
    icon: <Workflow size={20} />,
    accent: '#10b981',
    accentBg: 'rgba(16,185,129,0.08)',
    accentBorder: 'rgba(16,185,129,0.2)',
    tag: 'Interactive Prototyping',
    headline: 'Link slides into clickable flows. Present with a laser pointer.',
    body: 'The Prototype canvas transforms your slide deck into a node graph — drag edges between slides to wire up navigation logic. Add hotspots to elements. Present with full speaker notes and a spotlight tool.',
    bullets: ['Node-graph slide linking', 'Clickable hotspot elements', 'Laser pointer & speaker notes'],
    visual: <PrototypeVisual />,
  },
]

// ─── Pillar visual mock UIs ───────────────────────────────────────────────────

function MagicMoveVisual() {
  return (
    <div className="relative w-full h-40 bg-[#07070a] rounded-xl border border-zinc-800/60 overflow-hidden">
      {/* Before state */}
      <div className="absolute inset-0 flex items-center justify-around px-6">
        {[
          { x: 0, label: 'API', color: '#3b82f6' },
          { x: 1, label: 'DB', color: '#8b5cf6' },
        ].map((node, i) => (
          <motion.div
            key={node.label}
            animate={{ x: [0, i === 0 ? 30 : -30, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className="w-10 h-10 rounded-xl border flex items-center justify-center"
              style={{ borderColor: node.color + '40', background: node.color + '10' }}
            >
              <div className="w-3 h-3 rounded-full" style={{ background: node.color }} />
            </div>
            <span className="text-[9px] text-zinc-500 font-bold">{node.label}</span>
          </motion.div>
        ))}
      </div>
      <motion.div
        animate={{ scaleX: [1, 0.4, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-px bg-blue-500/40"
      />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <span className="text-[8px] text-zinc-700 font-mono uppercase tracking-widest">layoutId morphing</span>
      </div>
    </div>
  )
}

function ArchVisual() {
  return (
    <div className="relative w-full h-40 bg-[#07070a] rounded-xl border border-zinc-800/60 overflow-hidden flex items-center justify-center">
      <svg width="260" height="110" viewBox="0 0 260 110">
        {/* Section box */}
        <rect x="70" y="15" width="120" height="80" rx="8" fill="rgba(139,92,246,0.04)" stroke="rgba(139,92,246,0.2)" strokeDasharray="4 3" />
        {/* Nodes */}
        <circle cx="30" cy="55" r="18" fill="#07070a" stroke="#3b82f6" strokeWidth="1.5" />
        <text x="30" y="59" textAnchor="middle" fill="#3b82f6" fontSize="7" fontWeight="700">Client</text>
        <rect x="100" y="35" width="30" height="38" rx="4" fill="#07070a" stroke="#8b5cf6" strokeWidth="1.5" />
        <text x="115" y="57" textAnchor="middle" fill="#8b5cf6" fontSize="7" fontWeight="700">API</text>
        <ellipse cx="200" cy="55" rx="18" ry="22" fill="#07070a" stroke="#8b5cf6" strokeWidth="1.5" />
        <text x="200" y="59" textAnchor="middle" fill="#8b5cf6" fontSize="7" fontWeight="700">DB</text>
        {/* Connectors */}
        <path d="M48 55 L100 55" stroke="rgba(255,255,255,0.3)" strokeWidth="1" markerEnd="url(#arr)" strokeDasharray="4 3" />
        <path d="M130 55 L182 55" stroke="rgba(255,255,255,0.3)" strokeWidth="1" markerEnd="url(#arr)" />
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.3)" />
          </marker>
        </defs>
        <text x="74" y="51" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="6">req</text>
        <text x="156" y="51" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="6">write</text>
      </svg>
    </div>
  )
}

function AudioVisual() {
  const bars = [0.3, 0.7, 0.5, 0.9, 0.4, 0.8, 0.6, 0.3, 0.95, 0.5, 0.7, 0.4, 0.8, 0.6, 0.3, 0.7, 0.5, 0.4, 0.6, 0.9]
  return (
    <div className="relative w-full h-40 bg-[#07070a] rounded-xl border border-zinc-800/60 overflow-hidden p-4 flex flex-col gap-3">
      {/* Track 1 */}
      <div className="flex items-center gap-2">
        <Mic2 size={10} className="text-amber-400 shrink-0" />
        <span className="text-[8px] text-zinc-600 w-12 shrink-0">Track 1</span>
        <div className="flex-1 flex items-center gap-[2px] h-7">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-sm bg-amber-500/70"
              animate={{ scaleY: [h, h * 0.6 + 0.1, h] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }}
              style={{ height: `${h * 100}%`, transformOrigin: 'bottom' }}
            />
          ))}
        </div>
      </div>
      {/* Track 2 */}
      <div className="flex items-center gap-2">
        <Mic2 size={10} className="text-zinc-600 shrink-0" />
        <span className="text-[8px] text-zinc-700 w-12 shrink-0">Track 2</span>
        <div className="flex-1 h-7 bg-zinc-900 border border-zinc-800 rounded-sm flex items-center px-2">
          <span className="text-[8px] text-zinc-700">+ Add track</span>
        </div>
      </div>
      {/* Playhead */}
      <div className="relative h-px bg-zinc-800 mx-14">
        <motion.div
          className="absolute top-0 w-px h-14 -mt-7 bg-amber-400/80"
          animate={{ left: ['10%', '80%', '10%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  )
}

function PrototypeVisual() {
  return (
    <div className="relative w-full h-40 bg-[#07070a] rounded-xl border border-zinc-800/60 overflow-hidden flex items-center justify-center">
      <svg width="260" height="120" viewBox="0 0 260 120">
        {/* Slide nodes */}
        {[
          { x: 20, y: 40, label: '01' },
          { x: 105, y: 20, label: '02' },
          { x: 105, y: 70, label: '03' },
          { x: 195, y: 45, label: '04' },
        ].map((node, i) => (
          <g key={i}>
            <rect x={node.x} y={node.y} width="44" height="30" rx="5" fill="#0d0d10" stroke={i === 0 ? '#10b981' : 'rgba(255,255,255,0.1)'} strokeWidth={i === 0 ? 1.5 : 1} />
            <text x={node.x + 22} y={node.y + 18} textAnchor="middle" fill={i === 0 ? '#10b981' : 'rgba(255,255,255,0.3)'} fontSize="9" fontWeight="700">{node.label}</text>
          </g>
        ))}
        {/* Edges */}
        <path d="M64 55 L105 35" stroke="rgba(16,185,129,0.4)" strokeWidth="1" markerEnd="url(#garr)" />
        <path d="M64 55 L105 85" stroke="rgba(16,185,129,0.3)" strokeWidth="1" markerEnd="url(#garr)" strokeDasharray="3 2" />
        <path d="M149 35 L195 60" stroke="rgba(255,255,255,0.15)" strokeWidth="1" markerEnd="url(#garr)" />
        <path d="M149 85 L195 60" stroke="rgba(255,255,255,0.15)" strokeWidth="1" markerEnd="url(#garr)" />
        <defs>
          <marker id="garr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="rgba(16,185,129,0.4)" />
          </marker>
        </defs>
      </svg>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <span className="text-[8px] text-zinc-700 font-mono uppercase tracking-widest">node-graph slide linking</span>
      </div>
    </div>
  )
}

// ─── Pillar Card ──────────────────────────────────────────────────────────────
function PillarCard({ pillar, index }: { pillar: typeof PILLARS[number]; index: number }) {
  const isEven = index % 2 === 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center ${!isEven ? 'md:[&>*:first-child]:order-last' : ''}`}
    >
      {/* Text side */}
      <div>
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold mb-5 border"
          style={{ color: pillar.accent, background: pillar.accentBg, borderColor: pillar.accentBorder }}
        >
          {pillar.icon}
          {pillar.tag}
        </div>

        <h3
          className="text-[clamp(22px,3vw,32px)] font-bold tracking-tight text-white leading-tight mb-4"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {pillar.headline}
        </h3>

        <p className="text-[15px] text-zinc-500 leading-relaxed mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
          {pillar.body}
        </p>

        <ul className="flex flex-col gap-2">
          {pillar.bullets.map(b => (
            <li key={b} className="flex items-center gap-2 text-[13px] text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              <ArrowRight size={12} style={{ color: pillar.accent }} className="shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Visual side */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: pillar.accentBg, borderColor: pillar.accentBorder }}
      >
        {pillar.visual}
      </div>
    </motion.div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function LandingPillars() {
  return (
    <section id="features" className="px-6 py-24 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-20"
      >
        <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
          What makes it different
        </p>
        <h2
          className="text-[clamp(32px,5vw,56px)] font-bold tracking-tight text-white mb-4"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Built for the
          {' '}
          <span
            className="italic font-normal"
            style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
          >
            technically minded.
          </span>
        </h2>
        <p className="text-zinc-500 text-[16px] max-w-xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
          Every feature was designed from the ground up for presentations that deal with code, systems, and motion.
        </p>
      </motion.div>

      <div className="flex flex-col gap-28">
        {PILLARS.map((pillar, i) => (
          <PillarCard key={pillar.id} pillar={pillar} index={i} />
        ))}
      </div>
    </section>
  )
}
