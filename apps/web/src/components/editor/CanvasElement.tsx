import { useRef, useCallback, memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { motion } from 'framer-motion'
import { useEditorStore } from '@/store/editorStore'
import { useMotionContext } from '@/context/MotionContext'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { DRAG_THRESHOLD_PX, DRAG_RESET_DELAY_MS } from '@/constants/animation'
import { SELECTED_Z_INDEX } from '@/constants/export'
import { PHASE_2_DELAY } from '@/lib/motionEngine'
import type { SceneElement, TextContent, CodeContent, ShapeContent, LineContent, ChartContent } from '@motionslides/shared'
import { TextElement } from './elements/TextElement'
import { CodeElement } from './elements/CodeElement'
import { ShapeElement } from './elements/ShapeElement'
import { LineElement } from './elements/LineElement'
import { ChartElement } from './elements/ChartElement'
import { BoundingBox } from './BoundingBox'
import { usePermissions } from '@/context/PermissionContext'

interface Props {
  element: SceneElement
  /** Index for stagger calculation (only used in presentation mode) */
  staggerIndex?: number
}

export const CanvasElement = memo(function CanvasElement({ element }: Props) {
  const { isReadOnly } = usePermissions()
  
  // Targeted selectors for state values
  const selectedElementIds = useEditorStore(s => s.selectedElementIds)
  const isEditingId = useEditorStore(s => s.isEditingId)
  const isMultiSelectMode = useEditorStore(s => s.isMultiSelectMode)
  
  // Actions are stable, safe to destructure
  const { 
    setSelectedElement, setSelectedElements, updateElementsBatch,
    setMobileInspectorOpen, setEditingId, setIsDragging
  } = useEditorStore()

  const isMobile = useIsMobile()
  const {
    isTransitioning,
    durationSec,
    ease,
    continuingIds,
    transitionAnimation,
  } = useMotionContext()
  const isSelected = selectedElementIds.includes(element.id)
  const isEditing = isEditingId === element.id
  const isDragging = useRef(false)
  const dragStartCoords = useRef<Record<string, { x: number, y: number }>>({})
  const dragStartPointer = useRef({ x: 0, y: 0 })
  const lastDx = useRef(0)
  const lastDy = useRef(0)

  // ── Identity Check ──
  // Is this element present in both the previous and current slide?
  const isContinuing = continuingIds.has(element.id)

  function handleClick(e: React.MouseEvent) {
    if (isReadOnly) return
    e.stopPropagation()
  }

  function handleDoubleClick(e: React.MouseEvent) {
    if (isReadOnly) return
    e.stopPropagation()
    if (!element.locked) {
      // Deep select
      setSelectedElement(element.id, false)
      if (element.type === 'text') {
        setEditingId(element.id)
      }
      if (isMobile) {
        setMobileInspectorOpen(true)
      }
    }
  }

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isReadOnly || isEditing) return
    if ((e.target as HTMLElement).closest('.bounding-box')) return
    e.stopPropagation()

    // Select on pointerdown (Figma style)
    if (!element.locked) {
      // If we are shift-clicking, we toggle. If we are clicking a group, we select the group.
      // But we shouldn't overwrite selection if we are clicking an already selected element to drag it!
      const currentSelected = useEditorStore.getState().selectedElementIds
      if (!currentSelected.includes(element.id)) {
        if (element.groupId && !(e.shiftKey || isMultiSelectMode)) {
          const slide = useEditorStore.getState().activeProject()?.slides[useEditorStore.getState().activeSlideIndex]
          const groupIds = slide?.elements.filter(el => el.groupId === element.groupId).map(el => el.id) || [element.id]
          setSelectedElements(groupIds)
        } else {
          setSelectedElement(element.id, e.shiftKey || isMultiSelectMode)
        }
      }
    }

    // Only prevent default if we're not clicking an interactive element inside
    // e.preventDefault() // Removing this to allow click events to bubble if needed, but we handle selection here now.

    isDragging.current = false
    dragStartPointer.current = { x: e.clientX, y: e.clientY }

    const currentSelectedIds = useEditorStore.getState().selectedElementIds
    const targetIds = currentSelectedIds.includes(element.id) ? currentSelectedIds : [element.id]

    // Cache the starting coordinates for all elements that are about to be dragged
    const slide = useEditorStore.getState().activeProject()?.slides[useEditorStore.getState().activeSlideIndex]
    if (slide) {
      dragStartCoords.current = {}
      targetIds.forEach(id => {
        const el = slide.elements.find(e => e.id === id)
        if (el) dragStartCoords.current[id] = { x: el.position.x, y: el.position.y }
      })
    }

    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    setIsDragging(true)

    const onMove = (ev: PointerEvent) => {
      if (element.locked) return
      const dx = ev.clientX - dragStartPointer.current.x
      const dy = ev.clientY - dragStartPointer.current.y
      if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) isDragging.current = true

      lastDx.current = dx
      lastDy.current = dy

      const canvasBoard = el.parentElement
      const scale = canvasBoard ? canvasBoard.getBoundingClientRect().width / canvasBoard.offsetWidth : 1

      const updates = targetIds.map(id => {
        const startX = dragStartCoords.current[id]?.x ?? 0
        const startY = dragStartCoords.current[id]?.y ?? 0
        return {
          id,
          changes: { position: { x: startX + dx / scale, y: startY + dy / scale } }
        }
      })

      updateElementsBatch(updates, { silent: true })
    }

    const onUp = () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      
      // Perform a final non-silent update to commit changes to state and trigger line recalculation
      if (isDragging.current) {
        const dx = lastDx.current
        const dy = lastDy.current
        const canvasBoard = el.parentElement
        const scale = canvasBoard ? canvasBoard.getBoundingClientRect().width / canvasBoard.offsetWidth : 1

        const updates = targetIds.map(id => {
          const startX = dragStartCoords.current[id]?.x ?? 0
          const startY = dragStartCoords.current[id]?.y ?? 0
          return {
            id,
            changes: { position: { x: startX + dx / scale, y: startY + dy / scale } }
          }
        })
        updateElementsBatch(updates, { silent: false })
      }

      setIsDragging(false)
      setTimeout(() => { isDragging.current = false }, DRAG_RESET_DELAY_MS)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
  }, [element.id, element.locked, element.groupId, isMultiSelectMode, isEditing, setSelectedElement, setSelectedElements, updateElementsBatch, setIsDragging])

  function renderContent() {
    switch (element.type) {
      case 'text': return <TextElement element={element} />
      case 'code': return <CodeElement content={element.content as CodeContent} elementId={element.id} />
      case 'shape': return <ShapeElement content={element.content as ShapeContent} />
      case 'line': return <LineElement element={element} isSelected={isSelected} />
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
            cursor: isReadOnly ? 'default' : 'grab',
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
        {isSelected && selectedElementIds.length === 1 && !element.groupId && <BoundingBox element={element} />}
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
    'slide-left': { x: 80, y: 0, scale: 1 },
    'slide-right': { x: -80, y: 0, scale: 1 },
    'slide-up': { x: 0, y: 80, scale: 1 },
    'slide-down': { x: 0, y: -80, scale: 1 },
    'zoom': { x: 0, y: 0, scale: 0.85 },
    'flip': { x: 0, y: 0, scale: 0.9 },
    'fade': { x: 0, y: 12, scale: 0.97 },
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
})
