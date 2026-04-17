import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useEditorStore } from '@/store/editorStore'
import { useMotionContext } from '@/context/MotionContext'
import { DRAG_THRESHOLD_PX, DRAG_RESET_DELAY_MS, ENTRANCE_INITIAL, EXIT_TARGET } from '@/constants/animation'
import { SELECTED_Z_INDEX } from '@/constants/canvas'
import type { SceneElement, TextContent, CodeContent, ShapeContent, LineContent } from '@/types'
import { TextElement } from './elements/TextElement'
import { CodeElement } from './elements/CodeElement'
import { ShapeElement } from './elements/ShapeElement'
import { LineElement } from './elements/LineElement'
import { BoundingBox } from './BoundingBox'

interface Props { element: SceneElement }

export function CanvasElement({ element }: Props) {
  const { selectedElementId, setSelectedElement, updateElement, isPresenting } = useEditorStore()
  const { isTransitioning, transition, durationSec, ease } = useMotionContext()
  const isSelected = selectedElementId === element.id
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, elX: 0, elY: 0 })

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!isDragging.current) setSelectedElement(element.id)
  }

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.bounding-box')) return
    e.stopPropagation()
    e.preventDefault()
    isDragging.current = false
    dragStart.current = { x: e.clientX, y: e.clientY, elX: element.position.x, elY: element.position.y }

    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - dragStart.current.x
      const dy = ev.clientY - dragStart.current.y
      if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) isDragging.current = true

      const canvasBoard = el.parentElement
      const scale = canvasBoard ? canvasBoard.getBoundingClientRect().width / canvasBoard.offsetWidth : 1
      updateElement(element.id, {
        position: { x: dragStart.current.elX + dx / scale, y: dragStart.current.elY + dy / scale },
      })
    }

    const onUp = () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      setTimeout(() => { isDragging.current = false }, DRAG_RESET_DELAY_MS)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
  }, [element.id, element.position.x, element.position.y, updateElement])

  function renderContent() {
    switch (element.type) {
      case 'text': return <TextElement content={element.content as TextContent} />
      case 'code': return <CodeElement content={element.content as CodeContent} />
      case 'shape': return <ShapeElement content={element.content as ShapeContent} />
      case 'line': return <LineElement content={element.content as LineContent} />
      default: return null
    }
  }

  // ── Magic Move: layoutId is ALWAYS the element ID ──
  // During presentation, framer-motion will match elements across slides
  // by layoutId and automatically interpolate position + size (FLIP).
  // During editing, layout still tracks drag moves smoothly.

  // Build the transition — in presentation mode, use user settings.
  // In editor mode, make drags instant.
  const motionTransition = isTransitioning
    ? transition
    : { layout: { duration: 0 }, default: { duration: 0 } }

  // Entrance/exit only apply to truly new/removed elements.
  // Elements that exist on both slides get their motion from layoutId.
  const entranceExit = isTransitioning
    ? {
        initial: ENTRANCE_INITIAL,
        exit: {
          ...EXIT_TARGET,
          transition: { duration: durationSec * 0.4, ease },
        },
      }
    : { initial: false as const }

  return (
    <>
      <motion.div
        layoutId={element.id}
        layout
        className="canvas-element"
        style={{
          position: 'absolute',
          left: element.position.x,
          top: element.position.y,
          width: element.size.width,
          height: element.size.height,
          rotate: element.rotation,
          opacity: element.opacity,
          zIndex: isSelected ? SELECTED_Z_INDEX : element.zIndex,
          cursor: isPresenting ? 'default' : 'grab',
          // Lines need overflow visible for arrow markers
          overflow: element.type === 'line' ? 'visible' : undefined,
        }}
        transition={motionTransition}
        animate={{ opacity: element.opacity }}
        {...entranceExit}
        onClick={isPresenting ? undefined : handleClick}
        onPointerDown={isPresenting ? undefined : onPointerDown}
      >
        {renderContent()}
      </motion.div>
      {isSelected && <BoundingBox element={element} />}
    </>
  )
}
