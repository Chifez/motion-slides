import { useCallback, useRef, useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { uuid } from '@/lib/uuid'
import type { SceneElement, Position } from '@motionslides/shared'
import { getConnectionPos } from '@/store/slices/elementSlice'

const SNAP_THRESHOLD = 30
type HandleId = 'top' | 'bottom' | 'left' | 'right' | 'center'

function getCanvasScale(): number {
  const board = document.querySelector('[data-canvas-board]')
  if (!board) return 1
  return board.getBoundingClientRect().width / (board as HTMLElement).offsetWidth
}

function findSnapTarget(
  absX: number,
  absY: number,
  sourceElementId: string,
  elements: SceneElement[],
): { elementId: string; handleId: HandleId; pos: Position } | null {
  for (const other of elements) {
    if (other.id === sourceElementId || other.type === 'line' || other.id === 'temp-conn-line') continue
    const { x: ox, y: oy } = other.position
    const { width: ow, height: oh } = other.size
    const anchors: { id: HandleId; p: Position }[] = [
      { id: 'top', p: { x: ox + ow / 2, y: oy } },
      { id: 'bottom', p: { x: ox + ow / 2, y: oy + oh } },
      { id: 'left', p: { x: ox, y: oy + oh / 2 } },
      { id: 'right', p: { x: ox + ow, y: oy + oh / 2 } },
      { id: 'center', p: { x: ox + ow / 2, y: oy + oh / 2 } },
    ]
    for (const a of anchors) {
      if (Math.hypot(a.p.x - absX, a.p.y - absY) < SNAP_THRESHOLD) {
        return { elementId: other.id, handleId: a.id, pos: a.p }
      }
    }
  }
  return null
}

export function useConnectionDrag(
  sourceElement: SceneElement,
) {
  const addElement = useEditorStore(s => s.addElement)
  const deleteElement = useEditorStore(s => s.deleteElement)
  const updateElement = useEditorStore(s => s.updateElement)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => cleanupRef.current?.()
  }, [])

  const startConnectionDrag = useCallback(
    (handleId: HandleId) => (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      const scale = getCanvasScale()
      const { x, y } = sourceElement.position
      const { width: w, height: h } = sourceElement.size

      // 1. Calculate Start Anchor Pos
      const fx = x + (handleId === 'left' ? 0 : handleId === 'right' ? w : w / 2)
      const fy = y + (handleId === 'top' ? 0 : handleId === 'bottom' ? h : h / 2)

      // 2. Add Temporary Line to slides store
      const tempId = 'temp-conn-line'
      const tempLine: SceneElement = {
        id: tempId,
        type: 'line',
        position: { x: fx, y: fy },
        size: { width: 1, height: 1 },
        rotation: 0,
        opacity: 0.6,
        zIndex: 100,
        animation: undefined,
        animationDelay: undefined,
        content: {
          lineType: 'elbow',
          x1: 0, y1: 0,
          x2: 1, y2: 1,
          style: 'dashed',
          arrow: 'end',
          color: '#3b82f6',
          strokeWidth: 2,
          startConnection: { elementId: sourceElement.id, handleId },
        } as any
      }

      addElement(tempLine)

      const board = document.querySelector('[data-canvas-board]')
      if (!board) return
      const boardRect = board.getBoundingClientRect()

      let finalSnap: { elementId: string; handleId: HandleId; pos: Position } | null = null
      let lastCx = fx
      let lastCy = fy

      const onMove = (ev: MouseEvent) => {
        const cx = (ev.clientX - boardRect.left) / scale
        const cy = (ev.clientY - boardRect.top) / scale
        lastCx = cx
        lastCy = cy

        const slide = useEditorStore.getState().activeSlide()
        finalSnap = slide
          ? findSnapTarget(cx, cy, sourceElement.id, slide.elements)
          : null

        const tx = finalSnap ? finalSnap.pos.x : cx
        const ty = finalSnap ? finalSnap.pos.y : cy

        const minX = Math.min(fx, tx)
        const minY = Math.min(fy, ty)
        const newW = Math.max(1, Math.abs(tx - fx))
        const newH = Math.max(1, Math.abs(ty - fy))

        const nx1 = (fx - minX) / newW
        const ny1 = (fy - minY) / newH
        const nx2 = (tx - minX) / newW
        const ny2 = (ty - minY) / newH

        updateElement(tempId, {
          position: { x: minX, y: minY },
          size: { width: newW, height: newH },
          content: {
            ...(tempLine.content as any),
            x1: nx1, y1: ny1,
            x2: nx2, y2: ny2,
            endConnection: finalSnap
              ? { elementId: finalSnap.elementId, handleId: finalSnap.handleId }
              : undefined,
          }
        })
      }

      const cleanup = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        cleanupRef.current = null
      }

      const onUp = () => {
        cleanup()
        deleteElement(tempId)

        // Create the actual connection line
        const tx = finalSnap ? finalSnap.pos.x : lastCx
        const ty = finalSnap ? finalSnap.pos.y : lastCy

        const minX = Math.min(fx, tx)
        const minY = Math.min(fy, ty)
        const newW = Math.max(1, Math.abs(tx - fx))
        const newH = Math.max(1, Math.abs(ty - fy))

        const nx1 = (fx - minX) / newW
        const ny1 = (fy - minY) / newH
        const nx2 = (tx - minX) / newW
        const ny2 = (ty - minY) / newH

        const realLine: SceneElement = {
          id: `line-${uuid()}`,
          type: 'line',
          position: { x: minX, y: minY },
          size: { width: newW, height: newH },
          rotation: 0,
          opacity: 1,
          zIndex: 5,
          animation: 'draw',
          animationDelay: 0,
          content: {
            lineType: 'elbow',
            x1: nx1, y1: ny1,
            x2: nx2, y2: ny2,
            style: 'solid',
            arrow: 'end',
            color: 'rgba(255,255,255,0.6)',
            strokeWidth: 2,
            startConnection: { elementId: sourceElement.id, handleId },
            endConnection: finalSnap
              ? { elementId: finalSnap.elementId, handleId: finalSnap.handleId }
              : undefined,
          } as any
        }

        addElement(realLine)
      }

      // Capture mouse drag moves
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      cleanupRef.current = cleanup
    },
    [sourceElement, addElement, deleteElement, updateElement]
  )

  return { startConnectionDrag }
}
