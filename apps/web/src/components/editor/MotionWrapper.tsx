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
  ref?: React.Ref<HTMLDivElement>
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
  onPointerDown, onDoubleClick, onClick, ref
}: Props) {
  const { isTransitioning, durationSec, ease, transitionAnimation, newElementIds, matchingIdMap } = useMotionContext()

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

  const staggerIndex = Array.from(newElementIds).indexOf(element.id)
  const delay = staggerIndex >= 0 ? staggerIndex * 0.03 : 0
  const states = getTransitionStates(transitionAnimation, element.opacity)
  const matchedId = matchingIdMap[element.id] || element.id
  const layoutId = (isTransitioning && isContinuing) ? matchedId : undefined
  const layout = (isTransitioning && isContinuing) ? true : undefined

  const style = {
    ...commonStyle,
    ...(isTransitioning && !isContinuing ? states.style : {}),
    opacity: isTransitioning ? undefined : element.opacity,
  }

  const initial = isTransitioning && !isContinuing ? states.initial : false

  const animate = isTransitioning
    ? (isContinuing ? { opacity: element.opacity } : states.animate)
    : undefined

  const exit = {
    ...states.exit,
    transition: { duration: durationSec * 0.3, ease: EASE_IN_OUT },
  }

  let transition: any
  if (!isTransitioning) {
    transition = { layout: { duration: 0 }, default: { duration: 0 } }
  } else if (isContinuing) {
    transition = {
      layout: { duration: durationSec, ease },
      opacity: { duration: durationSec * 0.4, ease: 'easeInOut' },
    }
  } else {
    transition = {
      duration: durationSec * 0.5,
      ease: EASE_IN_OUT,
      delay,
    }
  }

  return (
    <motion.div
      ref={ref}
      layoutId={layoutId}
      layout={layout}
      className="canvas-element"
      style={style}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
    >
      {children}
    </motion.div>
  )
})
