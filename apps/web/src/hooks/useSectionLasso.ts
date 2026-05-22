import { useState, type RefObject, type PointerEvent } from 'react'
import { useEditorStore } from '@/store/editorStore'
import type { SceneElement } from '@motionslides/shared'

interface SectionLassoArgs {
  stageRef: RefObject<HTMLDivElement | null>
  scale: number
  canvasW: number
  canvasH: number
  isReadOnly: boolean
}

interface LassoState {
  x1: number
  y1: number
  x2: number
  y2: number
}

export function useSectionLasso({
  stageRef,
  scale,
  canvasW,
  canvasH,
  isReadOnly,
}: SectionLassoArgs) {
  const [lasso, setLasso] = useState<LassoState | null>(null)

  const camera = useEditorStore(state => state.camera)
  const activeTool = useEditorStore(state => state.activeTool)
  const addElement = useEditorStore(state => state.addElement)
  const setSelectedElement = useEditorStore(state => state.setSelectedElement)
  const setEditingId = useEditorStore(state => state.setEditingId)
  const setActiveTool = useEditorStore(state => state.setActiveTool)

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return null

    const x = (clientX - rect.left - (rect.width / 2) - camera.x) / (scale * camera.zoom) + (canvasW / 2)
    const y = (clientY - rect.top - (rect.height / 2) - camera.y) / (scale * camera.zoom) + (canvasH / 2)
    return { x, y }
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isReadOnly || activeTool !== 'section') return
    if (event.button !== 0) return

    const coords = getCanvasCoordinates(event.clientX, event.clientY)
    if (!coords) return

    setLasso({ x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y })
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!lasso) return

    const coords = getCanvasCoordinates(event.clientX, event.clientY)
    if (!coords) return

    setLasso(prev => prev ? { ...prev, x2: coords.x, y2: coords.y } : null)
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!lasso) return
    setLasso(null)
    event.currentTarget.releasePointerCapture(event.pointerId)

    const x = Math.min(lasso.x1, lasso.x2)
    const y = Math.min(lasso.y1, lasso.y2)
    const width = Math.abs(lasso.x2 - lasso.x1)
    const height = Math.abs(lasso.y2 - lasso.y1)

    // Ignore tiny drag-clicks to prevent accidental section creations on simple clicks.
    if (width > 10 && height > 10) {
      const newSection: SceneElement = {
        id: `section-${Math.random().toString(36).substring(2, 11)}`,
        type: 'section',
        position: { x, y },
        size: { width, height },
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        animation: 'fade-in',
        animationDelay: 0,
        content: {
          label: 'Section',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          borderStyle: 'dashed',
          borderWidth: 2,
          cornerRadius: 12,
        }
      }
      addElement(newSection)
      setSelectedElement(newSection.id)
      setEditingId(newSection.id)
      setActiveTool('select')
    }
  }

  return {
    lasso,
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    }
  }
}
