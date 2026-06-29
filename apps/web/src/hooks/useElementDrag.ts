import { useRef, useCallback, useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { DRAG_THRESHOLD_PX, DRAG_RESET_DELAY_MS } from '@/constants/animation'
import { type SceneElement, type LineContent, getCanvasDimensions } from '@motionslides/shared'

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
    let targetIds = currentSelectedIds.includes(element.id) ? currentSelectedIds : [element.id]

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
    document.body.style.cursor = 'grabbing'

    const onMove = (ev: PointerEvent) => {
      if (element.locked) return
      let dx = ev.clientX - dragStartPointer.current.x
      let dy = ev.clientY - dragStartPointer.current.y

      if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
        if (!isDragging.current) {
          isDragging.current = true

          // Alt-drag duplication
          if (ev.altKey && !element.locked) {
            const project = useEditorStore.getState().projects.find(p => p.id === useEditorStore.getState().activeProjectId)
            const activeSlide = project?.slides[useEditorStore.getState().activeSlideIndex]
            if (activeSlide) {
              const newDuplicates: SceneElement[] = []
              const newDupIds: string[] = []

              targetIds.forEach(id => {
                const el = activeSlide.elements.find(item => item.id === id)
                if (el) {
                  const dupContent = el.type === 'line'
                    ? {
                        ...(el.content as LineContent),
                        startConnection: undefined,
                        endConnection: undefined,
                        branches: (el.content as LineContent).branches?.map((b) => ({
                          ...b,
                          connection: undefined,
                        })),
                      }
                    : el.content

                  const newId = `el-${Math.random().toString(36).substr(2, 9)}`
                  const dupElement: SceneElement = {
                    ...el,
                    id: newId,
                    zIndex: el.zIndex + 1,
                    content: dupContent,
                  }
                  newDuplicates.push(dupElement)
                  newDupIds.push(newId)

                  // Save starting coordinates for the duplicates
                  dragStartCoords.current[newId] = { x: el.position.x, y: el.position.y }
                }
              })

              // Add duplicates and select them
              newDuplicates.forEach(dup => {
                useEditorStore.getState().addElement(dup)
              })
              setSelectedElements(newDupIds)
              targetIds = newDupIds
            }
          }
        }
      }

      // Shift-drag axis constraint
      if (ev.shiftKey) {
        if (Math.abs(dx) > Math.abs(dy)) {
          dy = 0
        } else {
          dx = 0
        }
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
      document.body.style.cursor = ''
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
      document.body.style.cursor = ''
      setTimeout(() => { isDragging.current = false }, DRAG_RESET_DELAY_MS)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    cleanupRef.current = cleanup
  }, [element, isReadOnly, isEditing, isMultiSelectMode, setSelectedElement, setSelectedElements, updateElementsBatch, setIsDragging, activeTool])

  return { onPointerDown, isDragging: isDragging.current }
}
