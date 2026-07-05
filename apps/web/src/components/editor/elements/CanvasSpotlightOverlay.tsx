import { motion } from 'framer-motion'

interface Props {
  isVisible: boolean
}

export function CanvasSpotlightOverlay({ isVisible }: Props) {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 bg-black pointer-events-none"
      style={{ zIndex: 4000 }}
    />
  )
}
