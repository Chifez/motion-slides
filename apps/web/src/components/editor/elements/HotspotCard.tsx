import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface Props {
  title: string
  body: string
  color: string
  onClose: () => void
}

export function HotspotCard({ title, body, color, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 8 }}
      transition={{ type: 'spring', damping: 22, stiffness: 320 }}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 z-[6000] pointer-events-auto cursor-default"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Card */}
      <div
        className="bg-neutral-950/95 border rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden"
        style={{ borderColor: `${color}40` }}
      >
        {/* Colored header bar */}
        <div
          className="px-4 py-3 flex items-center justify-between gap-2"
          style={{ background: `linear-gradient(135deg, ${color}20, ${color}08)` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <h4 className="text-xs font-bold text-white truncate">
              {title}
            </h4>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer border-none bg-transparent shrink-0"
          >
            <X size={11} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <p className="text-[12px] leading-[1.65] text-neutral-300 whitespace-pre-wrap">
            {body}
          </p>
        </div>
      </div>

      {/* Caret pointer */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
        style={{
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: `7px solid ${color}40`,
          marginTop: '-1px',
        }}
      />
    </motion.div>
  )
}
