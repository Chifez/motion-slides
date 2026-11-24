import { motion, AnimatePresence } from 'framer-motion'
import type { TimedCaption } from '@motionslides/shared'
import { UI_SPRING } from '@/lib/motion-engine'

interface Props {
  script?: string | null | undefined
  className?: string
  captions?: TimedCaption[]
  currentTime?: number
}

export function CaptionOverlay({ script, className, captions, currentTime }: Props) {
  const activeCaption =
    captions && currentTime !== undefined
      ? captions.find(c => currentTime >= c.start && currentTime <= c.end)
      : null

  const textToDisplay = activeCaption ? activeCaption.text : script

  return (
    <div
      className={
        className
          ? `z-30 ${className}`
          : 'absolute bottom-20 left-0 right-0 flex justify-center px-8 pointer-events-none z-30'
      }
    >
      <AnimatePresence mode="wait">
        {textToDisplay && textToDisplay.trim() && (
          <motion.div
            key={textToDisplay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={UI_SPRING}
            className="max-w-3xl w-full"
          >
            <div className="relative bg-black/45 border border-white/10 px-4 py-1.5 rounded-lg shadow-lg backdrop-blur-sm">
              <p className="text-xs leading-normal text-white/90 font-medium tracking-wide text-center">
                {textToDisplay}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
