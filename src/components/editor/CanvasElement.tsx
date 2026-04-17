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

interface Props {
  element: SceneElement
  /** Index for stagger calculation (only used in presentation mode) */
  staggerIndex?: number
}

export function CanvasElement({ element, staggerIndex = 0 }: Props) {
  const { selectedElementId, setSelectedElement, updateElement } = useEditorStore()
  const {
    isTransitioning,
    durationSec,
    ease,
    magicSpring,
    buildInSpring,
    continuingIds,
    getStaggerDelay,
  } = useMotionContext()
  const isSelected = selectedElementId === element.id
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, elX: 0, elY: 0 })

  // ── Identity Check ──
  // Is this element present in both the previous and current slide?
  const isContinuing = continuingIds.has(element.id)

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

  // ─────────────────────────────────────────────
  // Animation Configuration — The "Magic Move" Logic
  // ─────────────────────────────────────────────

  // In editor mode, everything is instant (no animation during drags)
  if (!isTransitioning) {
    return (
      <>
        <motion.div
          layoutId={element.id}
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
            cursor: 'grab',
            overflow: element.type === 'line' ? 'visible' : undefined,
          }}
          transition={{ layout: { duration: 0 }, default: { duration: 0 } }}
          initial={false}
          onClick={handleClick}
          onPointerDown={onPointerDown}
        >
          {renderContent()}
        </motion.div>
        {isSelected && <BoundingBox element={element} />}
      </>
    )
  }

  // ── Presentation Mode ──

  // CONTINUING ELEMENTS (exist in both slides):
  // - Keep opacity at 1.0 (NO fade)
  // - Let layoutId + layout handle the smooth FLIP position/size transition
  // - Use spring physics for that weighted, Keynote-like feel
  if (isContinuing) {
    return (
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
          zIndex: element.zIndex,
          cursor: 'default',
          overflow: element.type === 'line' ? 'visible' : undefined,
        }}
        // NO initial — element is already on screen, just moving
        initial={false}
        animate={{ opacity: element.opacity }}
        // NO exit — continuing elements don't exit, they morph
        transition={{
          layout: magicSpring,
          opacity: { duration: durationSec * 0.4, ease: 'easeInOut' },
        }}
      >
        {renderContent()}
      </motion.div>
    )
  }

  // NEW ELEMENTS (only in the current slide):
  // - Staggered build-in with delay
  // - Subtle slide-up + fade + scale
  const staggerMs = getStaggerDelay(staggerIndex)

  return (
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
        zIndex: element.zIndex,
        cursor: 'default',
        overflow: element.type === 'line' ? 'visible' : undefined,
      }}
      initial={ENTRANCE_INITIAL}
      animate={{
        opacity: element.opacity,
        y: 0,
        scale: 1,
      }}
      exit={{
        ...EXIT_TARGET,
        transition: { duration: durationSec * 0.3, ease },
      }}
      transition={{
        ...buildInSpring,
        delay: staggerMs,
        opacity: { duration: durationSec * 0.5, ease: 'easeOut', delay: staggerMs },
      }}
    >
      {renderContent()}
    </motion.div>
  )
}
