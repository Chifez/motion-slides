import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useEditorStore } from '@/store/editorStore'
import { useMotionContext } from '@/context/MotionContext'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { DRAG_THRESHOLD_PX, DRAG_RESET_DELAY_MS } from '@/constants/animation'
import { SELECTED_Z_INDEX } from '@/constants/canvas'
import { PHASE_2_DELAY } from '@/lib/motionEngine'
import type { SceneElement, TextContent, CodeContent, ShapeContent, LineContent, ChartContent } from '@/types'
import { TextElement } from './elements/TextElement'
import { CodeElement } from './elements/CodeElement'
import { ShapeElement } from './elements/ShapeElement'
import { LineElement } from './elements/LineElement'
import { ChartElement } from './elements/ChartElement'
import { BoundingBox } from './BoundingBox'

interface Props {
  element: SceneElement
  /** Index for stagger calculation (only used in presentation mode) */
  staggerIndex?: number
}

export function CanvasElement({ element }: Props) {
  const { 
    selectedElementId, setSelectedElement, updateElement,
    setMobileInspectorOpen
  } = useEditorStore()
  const isMobile = useIsMobile()
  const {
    isTransitioning,
    durationSec,
    ease,
    continuingIds,
    transitionAnimation,
  } = useMotionContext()
  const isSelected = selectedElementId === element.id
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, elX: 0, elY: 0 })

  // ── Identity Check ──
  // Is this element present in both the previous and current slide?
  const isContinuing = continuingIds.has(element.id)

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    // Select here too as a fallback if onPointerDown was blocked or missed.
    if (!element.locked) {
      setSelectedElement(element.id)
      // On mobile, a single click shouldn't open inspector, 
      // and if it's already open for another element, maybe we should close it?
      // Actually, let's just not open it here.
    }
  }

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!element.locked) {
      setSelectedElement(element.id)
      if (isMobile) {
        setMobileInspectorOpen(true)
      }
    }
  }

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.bounding-box')) return
    e.stopPropagation()
    
    // Select on pointerdown (Figma style)
    if (!element.locked) {
      setSelectedElement(element.id)
    }

    // Only prevent default if we're not clicking an interactive element inside
    // e.preventDefault() // Removing this to allow click events to bubble if needed, but we handle selection here now.

    isDragging.current = false
    dragStart.current = { x: e.clientX, y: e.clientY, elX: element.position.x, elY: element.position.y }

    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)

    const onMove = (ev: PointerEvent) => {
      if (element.locked) return
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
  }, [element.id, element.position.x, element.position.y, element.locked, setSelectedElement, updateElement])

  function renderContent() {
    switch (element.type) {
      case 'text': return <TextElement content={element.content as TextContent} />
      case 'code': return <CodeElement content={element.content as CodeContent} elementId={element.id} />
      case 'shape': return <ShapeElement content={element.content as ShapeContent} />
      case 'line': return <LineElement content={element.content as LineContent} />
      case 'chart': return <ChartElement content={element.content as ChartContent} />
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
          onDoubleClick={handleDoubleClick}
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
          layout: {
            duration: durationSec,
            ease: ease,
          },
          opacity: { duration: durationSec * 0.4, ease: 'easeInOut' },
        }}
      >
        {renderContent()}
      </motion.div>
    )
  }

  // NEW ELEMENTS (only in the current slide):
  // Phase 2: delay entrance until Phase 1 morphs are complete.
  // Direction is driven by the prototype transition animation setting.
  const EASE_IN_OUT: [number, number, number, number] = [0.37, 0, 0.63, 1]

  // Map transition animation to enter/exit x/y offsets and scale
  const DIRECTION_MAP: Record<string, { x: number; y: number; scale: number }> = {
    'slide-left':  { x: 80,   y: 0,   scale: 1 },
    'slide-right': { x: -80,  y: 0,   scale: 1 },
    'slide-up':    { x: 0,    y: 80,  scale: 1 },
    'slide-down':  { x: 0,    y: -80, scale: 1 },
    'zoom':        { x: 0,    y: 0,   scale: 0.85 },
    'flip':        { x: 0,    y: 0,   scale: 0.9 },
    'fade':        { x: 0,    y: 12,  scale: 0.97 },
  }
  const dir = DIRECTION_MAP[transitionAnimation] ?? DIRECTION_MAP['fade']

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
        // Phase 2: wait for all continuing elements to finish morphing
        delay: PHASE_2_DELAY,
        layout: {
          duration: durationSec,
          ease: EASE_IN_OUT,
        },
      }}
    >
      {renderContent()}
    </motion.div>
  )
}
