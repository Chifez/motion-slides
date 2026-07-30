import { motion } from 'framer-motion'
import { Check, X, Minus } from 'lucide-react'

type CellValue = true | false | 'partial'

interface Feature {
  name: string
  motionslides: CellValue
  powerpoint: CellValue
  canva: CellValue
  marp: CellValue
}

const FEATURES: Feature[] = [
  { name: 'Magic Move / identity transitions', motionslides: true, powerpoint: 'partial', canva: false, marp: false },
  { name: 'Code diff animations (LCS)', motionslides: true, powerpoint: false, canva: false, marp: 'partial' },
  { name: 'Architecture diagrams + SVG morphing', motionslides: true, powerpoint: 'partial', canva: false, marp: false },
  { name: 'GitHub repository import', motionslides: true, powerpoint: false, canva: false, marp: true },
  { name: 'AI deck & diagram generation', motionslides: true, powerpoint: 'partial', canva: 'partial', marp: false },
  { name: 'Multi-track audio & subtitles', motionslides: true, powerpoint: 'partial', canva: false, marp: false },
  { name: 'Interactive prototype flows', motionslides: true, powerpoint: false, canva: false, marp: false },
  { name: 'Local-first / no login required', motionslides: true, powerpoint: false, canva: false, marp: true },
  { name: 'Export to HTML standalone bundle', motionslides: true, powerpoint: false, canva: false, marp: true },
  { name: 'Spring physics animation engine', motionslides: true, powerpoint: false, canva: false, marp: false },
]

const COLUMNS = [
  { key: 'motionslides', label: 'MotionSlides', highlight: true },
  { key: 'powerpoint', label: 'PowerPoint', highlight: false },
  { key: 'canva', label: 'Canva', highlight: false },
  { key: 'marp', label: 'Marp', highlight: false },
] as const

function Cell({ value, highlight }: { value: CellValue; highlight: boolean }) {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${highlight ? 'bg-blue-600/20 border border-blue-500/40' : 'bg-emerald-600/10 border border-emerald-600/20'}`}>
          <Check size={10} className={highlight ? 'text-blue-400' : 'text-emerald-400'} />
        </div>
      </div>
    )
  }
  if (value === 'partial') {
    return (
      <div className="flex justify-center">
        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-amber-600/10 border border-amber-600/20">
          <Minus size={10} className="text-amber-400" />
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-center">
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-zinc-900 border border-zinc-800">
        <X size={9} className="text-zinc-700" />
      </div>
    </div>
  )
}

export function LandingComparison() {
  return (
    <section id="comparison" className="px-6 py-24 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Comparison
          </p>
          <h2
            className="text-[clamp(28px,4vw,48px)] font-bold tracking-tight text-white mb-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Why{' '}
            <span className="italic font-normal" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}>
              MotionSlides?
            </span>
          </h2>
          <p className="text-zinc-500 text-[15px] max-w-lg mx-auto leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            Generic tools were built for everyone. MotionSlides was built for engineers, designers, and teams who present technical depth.
          </p>
        </div>

        {/* Table */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Column headers */}
          <div className="grid border-b border-zinc-800" style={{ gridTemplateColumns: '1fr repeat(4, 100px)' }}>
            <div className="px-5 py-4" />
            {COLUMNS.map(col => (
              <div
                key={col.key}
                className={`px-3 py-4 text-center ${col.highlight ? 'bg-blue-600/5 border-l border-r border-blue-500/20' : ''}`}
              >
                <span
                  className={`text-[11px] font-bold ${col.highlight ? 'text-blue-300' : 'text-zinc-500'}`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {col.label}
                </span>
              </div>
            ))}
          </div>

          {/* Feature rows */}
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: 'easeOut' }}
              className={`grid items-center border-b border-zinc-900/80 last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
              style={{ gridTemplateColumns: '1fr repeat(4, 100px)' }}
            >
              <div className="px-5 py-3.5">
                <span className="text-[13px] text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>{feature.name}</span>
              </div>
              {COLUMNS.map(col => (
                <div
                  key={col.key}
                  className={`px-3 py-3.5 ${col.highlight ? 'bg-blue-600/5 border-l border-r border-blue-500/10' : ''}`}
                >
                  <Cell value={feature[col.key]} highlight={col.highlight} />
                </div>
              ))}
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-5">
          {[
            { color: 'text-blue-400', bg: 'bg-blue-600/20 border-blue-500/40', icon: <Check size={9} />, label: 'Full support' },
            { color: 'text-amber-400', bg: 'bg-amber-600/10 border-amber-600/20', icon: <Minus size={9} />, label: 'Partial' },
            { color: 'text-zinc-700', bg: 'bg-zinc-900 border-zinc-800', icon: <X size={9} />, label: 'Not available' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${item.bg} ${item.color}`}>{item.icon}</div>
              <span className="text-[10px] text-zinc-600" style={{ fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
