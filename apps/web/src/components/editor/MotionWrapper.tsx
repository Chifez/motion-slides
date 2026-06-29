import { memo } from 'react'
import { motion } from 'framer-motion'
import { useMotionContext } from '@/context/MotionContext'
import { useEditorStore } from '@/store/editorStore'
import { SELECTED_Z_INDEX } from '@/constants/export'
import type { SceneElement } from '@motionslides/shared'
import { EASE_IN_OUT, getTransitionStates } from '@/lib/motionShared'

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

export const MotionWrapper = memo(function MotionWrapper({
  element, isSelected, isReadOnly, isContinuing, children,
  onPointerDown, onDoubleClick, onClick, ref
}: Props) {
  const { isTransitioning, durationSec, ease, transitionAnimation, newElementIds, matchingIdMap } = useMotionContext()
  const selectedElementIds = useEditorStore(s => s.selectedElementIds)
  const isMultiSelected = isSelected && selectedElementIds.length > 1

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
    pointerEvents: element.type === 'line' ? ('none' as const) : undefined,
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
      className={`canvas-element ${isSelected ? 'selected' : ''} ${isMultiSelected ? 'multi-selected' : ''} ${element.locked ? 'locked' : ''}`}
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
