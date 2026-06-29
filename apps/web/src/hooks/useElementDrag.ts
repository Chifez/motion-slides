import { useRef, useCallback, useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { DRAG_THRESHOLD_PX, DRAG_RESET_DELAY_MS } from '@/constants/animation'
import { type SceneElement, getCanvasDimensions } from '@motionslides/shared'

interface UseElementDragOptions {
  element: SceneElement | undefined
  isReadOnly: boolean
  isEditing: boolean
  isMultiSelectMode: boolean
}


export function useElementDrag({ element, isReadOnly, isEditing, isMultiSelectMode }: UseElementDragOptions) {

  const setSelectedElement = useEditorStore(s => s.setSelectedElement)
  const setSelectedElements = useEditorStore(s => s.setSelectedElements)
  const updateElementsBatch = useEditorStore(s => s.updateElementsBatch)
  const setIsDragging = useEditorStore(s => s.setIsDragging)
  const activeTool = useEditorStore(s => s.activeTool)


  const isDragging = useRef(false)
  const dragStartCoords = useRef<Record<string, { x: number, y: number }>>({})
  const dragStartPointer = useRef({ x: 0, y: 0 })
  const lastDx = useRef(0)
  const lastDy = useRef(0)

  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => cleanupRef.current?.()
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!element || isReadOnly || isEditing || activeTool !== 'select') return
    if ((e.target as HTMLElement).closest('.bounding-box')) return
    e.stopPropagation()

    if (!element.locked) {
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

    isDragging.current = false
    dragStartPointer.current = { x: e.clientX, y: e.clientY }

    const currentSelectedIds = useEditorStore.getState().selectedElementIds
    const targetIds = currentSelectedIds.includes(element.id) ? currentSelectedIds : [element.id]

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

      if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
        isDragging.current = true
      }

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

      // Canvas border expansion logic (preserving aspect ratio)
      const state = useEditorStore.getState()
      const slide = state.activeSlide()
      const { playbackSettings, customCanvasWidth, customCanvasHeight, setCustomCanvasDimensions } = state
      const { width: defaultW, height: defaultH } = getCanvasDimensions(playbackSettings.aspectRatio)
      const currentCanvasW = customCanvasWidth ?? defaultW
      const currentCanvasH = customCanvasHeight ?? defaultH

      let maxRight = currentCanvasW
      let maxBottom = currentCanvasH

      updates.forEach(upd => {
        const changes = upd.changes as any
        const el = slide?.elements.find(e => e.id === upd.id)
        if (el && changes.position) {
          const right = changes.position.x + el.size.width
          const bottom = changes.position.y + el.size.height
          if (right > maxRight - 50) {
            maxRight = right + 200
          }
          if (bottom > maxBottom - 50) {
            maxBottom = bottom + 200
          }
        }
      })

      if (maxRight > currentCanvasW || maxBottom > currentCanvasH) {
        const ratio = defaultW / defaultH
        const nextWByRight = maxRight
        const nextHByRight = nextWByRight / ratio

        const nextHByBottom = maxBottom
        const nextWByBottom = nextHByBottom * ratio

        const nextW = Math.max(nextWByRight, nextWByBottom)
        const nextH = nextW / ratio

        setCustomCanvasDimensions(nextW, nextH)
      }
    }

    const cleanup = () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      cleanupRef.current = null
    }

    const onUp = () => {
      cleanup()

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
    cleanupRef.current = cleanup
  }, [element, isReadOnly, isEditing, isMultiSelectMode, setSelectedElement, setSelectedElements, updateElementsBatch, setIsDragging, activeTool])

  return { onPointerDown, isDragging: isDragging.current }
}
