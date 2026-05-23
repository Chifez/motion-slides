import { memo } from 'react'
import { motion } from 'framer-motion'
import { useMotionContext } from '@/context/MotionContext'
import { SELECTED_Z_INDEX } from '@/constants/export'
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

const getTransitionStates = (
  animationType: string,
  elementOpacity: number
): {
  initial: Record<string, any>
  animate: Record<string, any>
  exit: Record<string, any>
  style?: React.CSSProperties
} => {
  switch (animationType) {
    case 'slide-left':
      return {
        initial: { opacity: 0, x: 40, y: 0, scale: 1 },
        animate: { opacity: elementOpacity, x: 0, y: 0, scale: 1 },
        exit: { opacity: 0, x: -40, y: 0, scale: 1 },
      }
    case 'slide-right':
      return {
        initial: { opacity: 0, x: -40, y: 0, scale: 1 },
        animate: { opacity: elementOpacity, x: 0, y: 0, scale: 1 },
        exit: { opacity: 0, x: 40, y: 0, scale: 1 },
      }
    case 'slide-up':
      return {
        initial: { opacity: 0, x: 0, y: 30, scale: 1 },
        animate: { opacity: elementOpacity, x: 0, y: 0, scale: 1 },
        exit: { opacity: 0, x: 0, y: -30, scale: 1 },
      }
    case 'slide-down':
      return {
        initial: { opacity: 0, x: 0, y: -30, scale: 1 },
        animate: { opacity: elementOpacity, x: 0, y: 0, scale: 1 },
        exit: { opacity: 0, x: 0, y: 30, scale: 1 },
      }
    case 'zoom':
      return {
        initial: { opacity: 0, x: 0, y: 0, scale: 0.3 },
        animate: { opacity: elementOpacity, x: 0, y: 0, scale: 1 },
        exit: { opacity: 0, x: 0, y: 0, scale: 1.5 },
      }
    case 'flip':
      return {
        initial: { opacity: 0, rotateY: 90, scale: 1 },
        animate: { opacity: elementOpacity, rotateY: 0, scale: 1 },
        exit: { opacity: 0, rotateY: -90, scale: 1 },
        style: { perspective: '1000px', transformStyle: 'preserve-3d' },
      }
    case 'fade':
    default:
      return {
        initial: { opacity: 0, x: 0, y: 0, scale: 1 },
        animate: { opacity: elementOpacity, x: 0, y: 0, scale: 1 },
        exit: { opacity: 0, x: 0, y: 0, scale: 1 },
      }
  }
}

export const MotionWrapper = memo(function MotionWrapper({
  element, isSelected, isReadOnly, isContinuing, children,
  onPointerDown, onDoubleClick, onClick
}: Props) {
  const { isTransitioning, durationSec, ease, transitionAnimation, newElementIds } = useMotionContext()

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

  const staggerIndex = Array.from(newElementIds).indexOf(element.id)
  const delay = staggerIndex >= 0 ? staggerIndex * 0.03 : 0
  const states = getTransitionStates(transitionAnimation, element.opacity)

  return (
    <motion.div
      className="canvas-element"
      style={{
        ...commonStyle,
        ...states.style,
        opacity: undefined, // Let animate handle opacity
      }}
      initial={states.initial}
      animate={states.animate}
      exit={{
        ...states.exit,
        transition: { duration: durationSec * 0.3, ease: EASE_IN_OUT },
      }}
      transition={{
        duration: durationSec * 0.5,
        ease: EASE_IN_OUT,
        delay,
      }}
    >
      {children}
    </motion.div>
  )
})
