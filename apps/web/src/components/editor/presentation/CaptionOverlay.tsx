import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  script: string | null | undefined
  className?: string
}

export function CaptionOverlay({ script, className }: Props) {
  return (
    <div
      className={className || "absolute bottom-20 left-0 right-0 flex justify-center px-8 pointer-events-none"}
      style={{ zIndex: 9500 }}
    >
      <AnimatePresence mode="wait">
        {script && script.trim() && (
          <motion.div
            key={script}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="max-w-3xl w-full"
          >
            <div className="relative bg-black/80 border border-white/10 px-8 py-4 rounded-2xl shadow-2xl backdrop-blur-xl">
              {/* Left accent bar */}
              <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-blue-500 rounded-full" />
              <p className="text-sm leading-relaxed text-white/90 font-medium tracking-wide text-center">
                {script}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
