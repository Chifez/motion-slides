import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Layers, Mic, GitFork, Sparkles } from 'lucide-react'

const EASE_OUT = [0.23, 1, 0.32, 1] as const
const MORPH_SPRING = { type: 'spring', stiffness: 280, damping: 30 } as const

function MagicMoveVisual() {
  const [step, setStep] = useState<'01' | '02'>('01')
  const shouldReduceMotion = useReducedMotion()
  const transition = shouldReduceMotion ? { duration: 0.01 } : MORPH_SPRING

  const nodes =
    step === '01'
      ? [
          { id: 'api', label: 'API', left: '10%', top: '34%' },
          { id: 'worker', label: 'Worker', left: '41%', top: '34%' },
          { id: 'db', label: 'Postgres', left: '72%', top: '34%' },
        ]
      : [
          { id: 'api', label: 'API', left: '12%', top: '16%' },
          { id: 'worker', label: 'Worker', left: '54%', top: '16%' },
          { id: 'db', label: 'Postgres', left: '34%', top: '58%' },
        ]

  return (
    <div className="relative h-[184px] w-full rounded-[12px] border border-white/[0.08] bg-[#070709] p-[12px] overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between z-10">
        <span className="font-mono text-[10px] text-zinc-500">layoutId morph</span>
        <div
          role="tablist"
          aria-label="Magic Move slide preview"
          className="inline-flex items-center rounded-[8px] border border-white/[0.08] bg-[#0C0C0F] p-[2px]"
        >
          {(['01', '02'] as const).map((id) => {
            const active = step === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStep(id)}
                className={`px-[8px] py-[3px] rounded-[6px] font-mono text-[10px] font-medium border-none cursor-pointer transition-[transform,background-color,color] duration-150 active:scale-[0.97] ${
                  active ? 'bg-blue-500/15 text-blue-400' : 'bg-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Slide {id}
              </button>
            )
          })}
        </div>
      </div>

      <div className="relative flex-1 w-full">
        {/* Subtle dot matrix */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            layout
            transition={transition}
            style={{ left: node.left, top: node.top }}
            className="absolute w-[74px] h-[36px] rounded-[8px] border border-white/[0.12] bg-[#121216] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            <span className="font-mono text-[11px] font-medium text-zinc-200">{node.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function DiagramChartVisual() {
  const bars = [
    { label: 'p50', height: '38%' },
    { label: 'p90', height: '58%' },
    { label: 'p95', height: '74%' },
    { label: 'p99', height: '92%' },
  ]

  return (
    <div className="relative h-[184px] w-full rounded-[12px] border border-white/[0.08] bg-[#070709] p-[14px] flex items-stretch gap-[12px] overflow-hidden">
      {/* Architecture tier */}
      <div className="flex-1 rounded-[10px] border border-dashed border-white/[0.14] bg-white/[0.02] p-[10px] flex flex-col justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-zinc-400">
          Processing Tier
        </span>
        <div className="flex items-center justify-between gap-[4px] my-auto">
          {['Gateway', 'Queue', 'Worker'].map((label, i) => (
            <div key={label} className="flex items-center gap-[4px]">
              <div className="rounded-[6px] border border-white/[0.1] bg-[#121216] px-[8px] py-[6px] text-center">
                <span className="font-mono text-[10px] text-zinc-200 block leading-none">{label}</span>
              </div>
              {i < 2 && <span className="text-zinc-600 text-[10px] font-mono">→</span>}
            </div>
          ))}
        </div>
        <span className="font-mono text-[9px] text-zinc-600">Port-snapped · Dagre</span>
      </div>

      {/* Native chart card */}
      <div className="w-[116px] shrink-0 rounded-[10px] border border-white/[0.08] bg-[#0C0C0F] p-[10px] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-zinc-400">Latency</span>
          <span className="font-mono text-[9px] text-zinc-600">ms</span>
        </div>
        <div className="flex items-end gap-[6px] h-[82px] pt-[8px]">
          {bars.map((bar, idx) => (
            <div key={bar.label} className="flex-1 h-full flex flex-col items-center justify-end gap-[4px]">
              <div
                style={{ height: bar.height }}
                className={`w-full rounded-t-[3px] ${
                  idx === 3 ? 'bg-blue-500/75 border-t border-blue-400/60' : 'bg-zinc-700/80 border-t border-zinc-500/40'
                }`}
              />
              <span className="font-mono text-[8px] text-zinc-600 leading-none">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AudioTimelineVisual() {
  const waveform = [24, 52, 38, 76, 44, 68, 86, 48, 62, 30, 74, 58, 42, 82, 54, 36, 66, 40, 56, 32]

  return (
    <div className="relative h-[184px] w-full rounded-[12px] border border-white/[0.08] bg-[#070709] p-[14px] flex flex-col justify-between overflow-hidden">
      {/* Ruler */}
      <div className="flex items-center justify-between pl-[84px] pr-[6px] border-b border-white/[0.06] pb-[6px] font-mono text-[9px] text-zinc-600">
        <span>00:00</span>
        <span>00:05</span>
        <span>00:10</span>
      </div>

      {/* Tracks */}
      <div className="relative flex-1 flex flex-col justify-center gap-[10px] py-[6px]">
        {/* Playhead */}
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-[58%] w-px bg-blue-500 z-10 pointer-events-none"
        >
          <div className="w-[7px] h-[7px] -ml-[3px] rounded-full bg-blue-500" />
        </div>

        {/* Track 1: Slides */}
        <div className="flex items-center gap-[10px]">
          <span className="w-[74px] shrink-0 font-mono text-[10px] text-zinc-500 truncate">Slides</span>
          <div className="flex-1 grid grid-cols-3 gap-[4px] h-[24px]">
            {['Intro', 'Architecture', 'Metrics'].map((s) => (
              <div
                key={s}
                className="rounded-[5px] border border-white/[0.08] bg-[#121216] px-[6px] flex items-center"
              >
                <span className="font-mono text-[9px] text-zinc-400 truncate">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Track 2: Voiceover */}
        <div className="flex items-center gap-[10px]">
          <span className="w-[74px] shrink-0 font-mono text-[10px] text-zinc-300 truncate">Voiceover</span>
          <div className="flex-1 h-[28px] rounded-[5px] border border-white/[0.1] bg-[#121216] px-[8px] flex items-center gap-[3px]">
            {waveform.map((pct, i) => (
              <span
                key={i}
                style={{ height: `${pct}%` }}
                className="flex-1 rounded-[1px] bg-zinc-400/75"
              />
            ))}
          </div>
        </div>

        {/* Track 3: Captions */}
        <div className="flex items-center gap-[10px]">
          <span className="w-[74px] shrink-0 font-mono text-[10px] text-zinc-500 truncate">Captions</span>
          <div className="flex-1 grid grid-cols-2 gap-[6px] h-[22px]">
            <div className="rounded-[5px] border border-white/[0.06] bg-white/[0.02] px-[6px] flex items-center">
              <span className="font-mono text-[9px] text-zinc-500 truncate">“Traffic enters the edge...”</span>
            </div>
            <div className="rounded-[5px] border border-white/[0.06] bg-white/[0.02] px-[6px] flex items-center">
              <span className="font-mono text-[9px] text-zinc-500 truncate">“Workers scale via queue...”</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PrototypeFlowVisual() {
  const [focusedNode, setFocusedNode] = useState<'01' | '02' | '03' | '04'>('02')

  const nodes = [
    { id: '01' as const, label: '01 Intro', x: 14, y: 58 },
    { id: '02' as const, label: '02 Arch', x: 118, y: 26 },
    { id: '03' as const, label: '03 Metrics', x: 244, y: 26 },
    { id: '04' as const, label: '04 Deep Dive', x: 244, y: 94 },
  ]

  return (
    <div className="relative h-[184px] w-full rounded-[12px] border border-white/[0.08] bg-[#070709] p-[14px] flex flex-col justify-between overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-zinc-500">Click node to inspect trigger</span>
        <span className="font-mono text-[10px] text-zinc-400">
          {focusedNode === '04' ? 'Hotspot → Slide 04' : `Slide ${focusedNode} active`}
        </span>
      </div>

      <div className="relative flex-1 w-full">
        <svg viewBox="0 0 360 132" className="w-full h-full">
          {/* Connecting paths */}
          <path
            d="M 88 74 C 102 74, 102 42, 118 42"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.2"
          />
          <path
            d="M 198 42 L 244 42"
            fill="none"
            stroke={focusedNode === '03' ? '#3B82F6' : 'rgba(255,255,255,0.22)'}
            strokeWidth="1.2"
          />
          <path
            d="M 198 46 C 222 46, 218 110, 244 110"
            fill="none"
            stroke={focusedNode === '04' ? '#3B82F6' : 'rgba(255,255,255,0.18)'}
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
        </svg>

        {nodes.map((node) => {
          const active = focusedNode === node.id
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setFocusedNode(node.id)}
              style={{ left: `${(node.x / 360) * 100}%`, top: `${(node.y / 132) * 100}%` }}
              className={`absolute h-[30px] px-[10px] rounded-[7px] font-mono text-[10px] font-medium cursor-pointer transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.97] whitespace-nowrap ${
                active
                  ? 'bg-blue-500/15 border border-blue-500/60 text-blue-300'
                  : 'bg-[#121216] border border-white/[0.1] text-zinc-300 hover:border-white/[0.22]'
              }`}
            >
              {node.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const CAPABILITIES = [
  {
    id: 'magic-move',
    icon: Sparkles,
    eyebrow: 'Magic Move Motion Engine',
    headline: 'Identity-based transitions, zero keyframes.',
    body: 'Elements carry persistent IDs across slides. MotionSlides computes geometry deltas and springs every node, connector, and frame into place.',
    visual: MagicMoveVisual,
  },
  {
    id: 'diagrams',
    icon: Layers,
    eyebrow: 'Architecture, Code & Native Charts',
    headline: 'Diagrams, native charts, and cloud icons.',
    body: 'Compose VPC sections, port-snapped elbow connectors, AWS & GCP icons, Shiki code blocks, and Bar, Line, Area, or Pie charts on a normalized 16:9 canvas.',
    visual: DiagramChartVisual,
  },
  {
    id: 'audio',
    icon: Mic,
    eyebrow: 'Multi-Track Audio, Voiceover & Captions',
    headline: 'Narrate with built-in AI or ElevenLabs BYOK.',
    body: 'Record voiceovers in-browser, generate narration with Cloudflare AI out of the box—or bring your ElevenLabs key—layer ducking background music, and auto-sync captions.',
    visual: AudioTimelineVisual,
  },
  {
    id: 'prototype',
    icon: GitFork,
    eyebrow: 'Prototype Flows & Presenter Mode',
    headline: 'Non-linear flows and live presenter controls.',
    body: 'Link slides and clickable hotspots on the Prototype graph, then present fullscreen with speaker notes, timed captions, and auto-hiding controls.',
    visual: PrototypeFlowVisual,
  },
] as const

export function LandingPillars() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section id="capabilities" className="max-w-[1120px] mx-auto px-[24px] py-[104px]">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
        className="max-w-[640px] mb-[48px]"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500 mb-[12px]">
          01 / ENGINE
        </p>
        <h2 className="text-[clamp(28px,4vw,44px)] font-semibold tracking-[-0.03em] leading-[1.08] text-white mb-[14px]">
          Every primitive technical decks actually need.
        </h2>
        <p className="text-[16px] leading-[1.6] text-zinc-400">
          No glued-together screenshots or generic dissolves. Motion, diagrams, narration, and flows are native primitives.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
        {CAPABILITIES.map((card, index) => {
          const Icon = card.icon
          const Visual = card.visual
          return (
            <motion.article
              key={card.id}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: shouldReduceMotion ? 0 : index * 0.05, ease: EASE_OUT }}
              className="rounded-[16px] border border-white/[0.08] bg-[#0C0C0F] p-[28px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col justify-between gap-[24px]"
            >
              <Visual />

              <div>
                <div className="inline-flex items-center gap-[6px] text-zinc-400 mb-[10px]">
                  <Icon size={13} className="text-zinc-500" />
                  <span className="font-mono text-[11px] font-medium text-zinc-400">
                    {card.eyebrow}
                  </span>
                </div>

                <h3 className="text-[20px] font-semibold tracking-[-0.02em] leading-[1.25] text-zinc-100 mb-[8px]">
                  {card.headline}
                </h3>
                <p className="text-[14px] leading-[1.6] text-zinc-400">
                  {card.body}
                </p>
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
