import { memo } from 'react'
import { motion } from 'framer-motion'
import { useMotionContext } from '@/context/MotionContext'
import { SELECTED_Z_INDEX } from '@/constants/export'
import { PHASE_2_DELAY } from '@/lib/motionEngine'
import type { SceneElement } from '@motionslides/shared'

interface Props {
  element: SceneElement
  isSelected: boolean
  isReadOnly: boolean
  isContinuing: boolean
  children: React.ReactNode
  onPointerDown: (e: React.PointerEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  onClick: (e: React.MouseEvent) => void
}

const EASE_IN_OUT: [number, number, number, number] = [0.37, 0, 0.63, 1]

const DIRECTION_MAP: Record<string, { x: number; y: number; scale: number }> = {
  'slide-left': { x: 80, y: 0, scale: 1 },
  'slide-right': { x: -80, y: 0, scale: 1 },
  'slide-up': { x: 0, y: 80, scale: 1 },
  'slide-down': { x: 0, y: -80, scale: 1 },
  'zoom': { x: 0, y: 0, scale: 0.85 },
  'flip': { x: 0, y: 0, scale: 0.9 },
  'fade': { x: 0, y: 12, scale: 0.97 },
}


export const MotionWrapper = memo(function MotionWrapper({
  element, isSelected, isReadOnly, isContinuing, children,
  onPointerDown, onDoubleClick, onClick
}: Props) {
  const { isTransitioning, durationSec, ease, transitionAnimation } = useMotionContext()

  // 1. Editor Mode Style
  const commonStyle = {
    position: 'absolute' as const,
    left: element.position.x,
    top: element.position.y,
    width: element.size.width,
    height: element.size.height,
    rotate: element.rotation,
    opacity: element.opacity,
    zIndex: isSelected ? SELECTED_Z_INDEX : element.zIndex,
    cursor: isReadOnly ? 'default' : 'grab',
    overflow: element.type === 'line' ? 'visible' : undefined,
  }


  if (!isTransitioning) {
    return (
      <motion.div
        layoutId={element.id}
        className="canvas-element"
        style={commonStyle}
        transition={{ layout: { duration: 0 }, default: { duration: 0 } }}
        initial={false}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onPointerDown={onPointerDown}
      >
        {children}
      </motion.div>
    )
  }


  if (isContinuing) {
    return (
      <motion.div
        layoutId={element.id}
        layout
        className="canvas-element"
        style={{ ...commonStyle, opacity: undefined }} // Let animate handle opacity
        initial={false}
        animate={{ opacity: element.opacity }}
        transition={{
          layout: { duration: durationSec, ease },
          opacity: { duration: durationSec * 0.4, ease: 'easeInOut' },
        }}
      >
        {children}
      </motion.div>
    )
  }


  const dir = DIRECTION_MAP[transitionAnimation] ?? DIRECTION_MAP['fade']

  return (
    <motion.div
      layoutId={element.id}
      layout
      className="canvas-element"
      style={{ ...commonStyle, opacity: undefined }}
      initial={{ opacity: 0, x: dir.x, y: dir.y, scale: dir.scale }}
      animate={{ opacity: element.opacity, x: 0, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        x: -dir.x,
        y: -dir.y,
        scale: dir.scale,
        transition: { duration: durationSec * 0.3, ease: EASE_IN_OUT },
      }}
      transition={{
        duration: durationSec * 0.5,
        ease: EASE_IN_OUT,
        delay: PHASE_2_DELAY,
        layout: { duration: durationSec, ease: EASE_IN_OUT },
      }}
    >
      {children}
    </motion.div>
  )
})
