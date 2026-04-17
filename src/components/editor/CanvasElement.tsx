import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useEditorStore } from '@/store/editorStore'
import { DRAG_THRESHOLD_PX, DRAG_RESET_DELAY_MS, LAYOUT_DURATION, LAYOUT_EASE } from '@/constants/animation'
import { SELECTED_Z_INDEX } from '@/constants/canvas'
import type { SceneElement, TextContent, CodeContent, ShapeContent } from '@/types'
import { TextElement } from './elements/TextElement'
import { CodeElement } from './elements/CodeElement'
import { ShapeElement } from './elements/ShapeElement'
import { BoundingBox } from './BoundingBox'

interface Props { element: SceneElement }

export function CanvasElement({ element }: Props) {
  const { selectedElementId, setSelectedElement, updateElement } = useEditorStore()
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
        }}
        transition={{ layout: { duration: LAYOUT_DURATION, ease: LAYOUT_EASE } }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: element.opacity, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        onClick={handleClick}
        onPointerDown={onPointerDown}
      >
        {renderContent()}
      </motion.div>
      {isSelected && <BoundingBox element={element} />}
    </>
  )
}
