import { motion, useReducedMotion } from 'framer-motion'
import { Check, X, Minus } from 'lucide-react'

type CellValue = true | false | 'partial'

interface Feature {
  name: string
  motionslides: CellValue
  keynote: CellValue
  gamma: CellValue
  slidev: CellValue
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const

const FEATURES: Feature[] = [
  { name: 'Identity-based Magic Move & spring physics', motionslides: true, keynote: 'partial', gamma: false, slidev: false },
  { name: 'Syntax-token code diff morphing (Shiki)', motionslides: true, keynote: false, gamma: false, slidev: 'partial' },
  { name: 'Architecture diagrams, VPC sections & auto-routing', motionslides: true, keynote: 'partial', gamma: false, slidev: false },
  { name: 'Native Git branching, commits & visual diffs', motionslides: true, keynote: false, gamma: false, slidev: 'partial' },
  { name: 'Tool-calling AI Copilot with 1-click deck undo', motionslides: true, keynote: false, gamma: 'partial', slidev: false },
  { name: 'Multi-track voiceover (Mic, AI & ElevenLabs BYOK) & captions', motionslides: true, keynote: 'partial', gamma: false, slidev: false },
  { name: 'Headless MP4 / GIF / Social video + PDF export', motionslides: true, keynote: 'partial', gamma: 'partial', slidev: 'partial' },
  { name: 'Local-first offline editing (no signup required)', motionslides: true, keynote: true, gamma: false, slidev: true },
]

const COLUMNS = [
  { key: 'motionslides', label: 'MotionSlides', highlight: true },
  { key: 'keynote', label: 'Keynote / PPT', highlight: false },
  { key: 'gamma', label: 'Gamma / Canva', highlight: false },
  { key: 'slidev', label: 'Slidev / Marp', highlight: false },
] as const

function Cell({ value, highlight }: { value: CellValue; highlight: boolean }) {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <div
          className={`w-[20px] h-[20px] rounded-full flex items-center justify-center ${
            highlight
              ? 'bg-blue-500/20 border border-blue-500/40'
              : 'bg-emerald-500/10 border border-emerald-500/20'
          }`}
        >
          <Check size={11} className={highlight ? 'text-blue-400' : 'text-emerald-400'} />
        </div>
      </div>
    )
  }
  if (value === 'partial') {
    return (
      <div className="flex justify-center">
        <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/20">
          <Minus size={11} className="text-amber-400" />
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-center">
      <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center bg-white/[0.03] border border-white/[0.06]">
        <X size={10} className="text-zinc-600" />
      </div>
    </div>
  )
}

export function LandingComparison() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section id="compare" className="max-w-[1120px] mx-auto px-[24px] py-[104px]">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
      >
        {/* Header */}
        <div className="max-w-[640px] mb-[40px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500 mb-[12px]">
            05 / COMPARE
          </p>
          <h2 className="text-[clamp(28px,4vw,44px)] font-semibold tracking-[-0.03em] leading-[1.08] text-white mb-[14px]">
            Built for technical depth, not slide templates.
          </h2>
          <p className="text-[16px] leading-[1.6] text-zinc-400">
            Why engineering and design teams switch from general-purpose slide tools.
          </p>
        </div>

        {/* Table */}
        <div className="rounded-[16px] border border-white/[0.08] bg-[#0C0C0F] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Column headers */}
            <div className="grid border-b border-white/[0.08] bg-[#09090C]" style={{ gridTemplateColumns: '1fr repeat(4, 128px)' }}>
              <div className="px-[20px] py-[16px] flex items-center">
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-500">
                  Capability
                </span>
              </div>
              {COLUMNS.map((col) => (
                <div
                  key={col.key}
                  className={`px-[12px] py-[16px] text-center flex items-center justify-center ${
                    col.highlight ? 'bg-blue-500/[0.06] border-l border-r border-blue-500/20' : ''
                  }`}
                >
                  <span
                    className={`text-[12px] font-semibold ${
                      col.highlight ? 'text-blue-400' : 'text-zinc-400'
                    }`}
                  >
                    {col.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Feature rows */}
            {FEATURES.map((feature, i) => (
              <div
                key={feature.name}
                className={`grid items-center border-b border-white/[0.05] last:border-b-0 ${
                  i % 2 === 0 ? '' : 'bg-white/[0.015]'
                }`}
                style={{ gridTemplateColumns: '1fr repeat(4, 128px)' }}
              >
                <div className="px-[20px] py-[14px]">
                  <span className="text-[13px] text-zinc-300">{feature.name}</span>
                </div>
                {COLUMNS.map((col) => (
                  <div
                    key={col.key}
                    className={`px-[12px] py-[14px] ${
                      col.highlight ? 'bg-blue-500/[0.04] border-l border-r border-blue-500/15' : ''
                    }`}
                  >
                    <Cell value={feature[col.key]} highlight={col.highlight} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-end gap-[20px] mt-[16px]">
          {[
            { color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/40', icon: <Check size={10} />, label: 'Full support' },
            { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: <Minus size={10} />, label: 'Partial / plugin' },
            { color: 'text-zinc-600', bg: 'bg-white/[0.03] border-white/[0.06]', icon: <X size={9} />, label: 'Not supported' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-[6px]">
              <div className={`w-[16px] h-[16px] rounded-full flex items-center justify-center border ${item.bg} ${item.color}`}>
                {item.icon}
              </div>
              <span className="font-mono text-[11px] text-zinc-500">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
