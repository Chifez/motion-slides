import { useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useEditorStore } from '@/store/editorStore'
import { DRAG_THRESHOLD_PX, DRAG_RESET_DELAY_MS, LAYOUT_DURATION, LAYOUT_EASE } from '@/constants/animation'
import { SELECTED_Z_INDEX } from '@/constants/canvas'
import type { SceneElement, TextContent, CodeContent, ShapeContent, LineContent } from '@/types'
import { TextElement } from './elements/TextElement'
import { CodeElement } from './elements/CodeElement'
import { ShapeElement } from './elements/ShapeElement'
import { LineElement } from './elements/LineElement'
import { BoundingBox } from './BoundingBox'

interface Props { element: SceneElement }

/** Slide direction variants for entrance/exit animations */
function getSlideVariant(element: SceneElement) {
  const cx = element.position.x + element.size.width / 2
  const cy = element.position.y + element.size.height / 2
  let xOffset = 0
  let yOffset = 0
  if (cx < 400) xOffset = -60
  else if (cx > 880) xOffset = 60
  if (cy < 240) yOffset = -40
  else if (cy > 480) yOffset = 40
  if (xOffset === 0 && yOffset === 0) yOffset = 30
  return { xOffset, yOffset }
}

export function CanvasElement({ element }: Props) {
  const { selectedElementId, setSelectedElement, updateElement } = useEditorStore()
  const isSelected = selectedElementId === element.id
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, elX: 0, elY: 0 })

  const { xOffset, yOffset } = useMemo(
    () => getSlideVariant(element),
    [element.position.x, element.position.y, element.size.width, element.size.height],
  )

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

  const isEditing = isSelected

  return (
    <>
      <motion.div
        layoutId={isEditing ? undefined : element.id}
        className="canvas-element"
        style={{
          left: element.position.x,
          top: element.position.y,
          width: element.size.width,
          height: element.size.height,
          rotate: element.rotation,
          opacity: element.opacity,
          zIndex: isSelected ? SELECTED_Z_INDEX : element.zIndex,
          cursor: 'grab',
          // Lines need overflow visible for arrow markers
          overflow: element.type === 'line' ? 'visible' : undefined,
        }}
        transition={{
          layout: { duration: LAYOUT_DURATION, ease: LAYOUT_EASE },
          opacity: { duration: 0.4, ease: 'easeOut' },
          x: { type: 'spring', stiffness: 300, damping: 30 },
          y: { type: 'spring', stiffness: 300, damping: 30 },
        }}
        initial={{ opacity: 0, x: xOffset, y: yOffset }}
        animate={{ opacity: element.opacity, x: 0, y: 0 }}
        exit={{ opacity: 0, x: -xOffset, y: -yOffset, transition: { duration: 0.3 } }}
        onClick={handleClick}
        onPointerDown={onPointerDown}
      >
        {renderContent()}
      </motion.div>
      {isSelected && <BoundingBox element={element} />}
    </>
  )
}
