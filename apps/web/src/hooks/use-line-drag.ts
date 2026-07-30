import { useCallback, useRef, useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { getConnectionPos } from '@/store/slices/elementSlice'
import type { SceneElement, LineContent, Position } from '@motionslides/shared'

/**
 * useLineDrag — Encapsulates the complex line-node drag interaction.
 *
 * Extracted from BoundingBox's 136-line inline closure to keep the component
 * focused on rendering. Handles:
 * - Start/end/branch node dragging
 * - Snap detection to nearby shape anchors
 * - Bounding box recalculation with branch awareness
 * - Connection resolution (attaching/detaching line endpoints to shapes)
 * - Cleanup of native DOM listeners on unmount
 */

const SNAP_THRESHOLD = 30

type HandleId = 'top' | 'bottom' | 'left' | 'right' | 'center'

interface SnapTarget {
  elementId: string
  handleId: HandleId
  pos: Position
}

function getCanvasScale(): number {
  const board = document.querySelector('[data-canvas-board]')
  if (!board) return 1
  return board.getBoundingClientRect().width / (board as HTMLElement).offsetWidth
}

function findSnapTarget(
  absX: number,
  absY: number,
  currentElementId: string,
  elements: SceneElement[],
): SnapTarget | null {
  for (const other of elements) {
    if (other.id === currentElementId || other.type === 'line') continue
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

export function useLineDrag(
  element: SceneElement,
  updateElement: (id: string, updates: Partial<SceneElement>) => void,
) {
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => cleanupRef.current?.()
  }, [])

  const startNodeDrag = useCallback(
    (nodeType: 'start' | 'end' | 'branch', branchIndex?: number) =>
      (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const content = element.content as LineContent
        const scale = getCanvasScale()

        let absStart = {
          x: element.position.x + content.x1 * element.size.width,
          y: element.position.y + content.y1 * element.size.height,
        }
        let absEnd = {
          x: element.position.x + content.x2 * element.size.width,
          y: element.position.y + content.y2 * element.size.height,
        }

        const board = document.querySelector('[data-canvas-board]')
        if (!board) return
        const boardRect = board.getBoundingClientRect()

        const onMove = (ev: MouseEvent) => {
          let currentAbsX = (ev.clientX - boardRect.left) / scale
          let currentAbsY = (ev.clientY - boardRect.top) / scale

          const slide = useEditorStore.getState().activeSlide()
          const snapped = slide
            ? findSnapTarget(currentAbsX, currentAbsY, element.id, slide.elements)
            : null

          if (snapped) {
            currentAbsX = snapped.pos.x
            currentAbsY = snapped.pos.y
          }

          if (nodeType === 'start') {
            absStart = { x: currentAbsX, y: currentAbsY }
          } else if (nodeType === 'end') {
            absEnd = { x: currentAbsX, y: currentAbsY }
          }

          const isBranching = (element.content as LineContent).lineType === 'branching'
          const bboxPoints = [absStart]
          if (!isBranching) bboxPoints.push(absEnd)

          const minX = Math.min(...bboxPoints.map((p) => p.x))
          const minY = Math.min(...bboxPoints.map((p) => p.y))
          const maxX = Math.max(...bboxPoints.map((p) => p.x))
          const maxY = Math.max(...bboxPoints.map((p) => p.y))

          const newWidth = Math.max(1, maxX - minX)
          const newHeight = Math.max(1, maxY - minY)

          const nx1 = (absStart.x - minX) / newWidth
          const ny1 = (absStart.y - minY) / newHeight
          const nx2 = (absEnd.x - minX) / newWidth
          const ny2 = (absEnd.y - minY) / newHeight

          const newBranches = content.branches?.map((b, i) => {
            const isTarget = nodeType === 'branch' && branchIndex === i
            const conn = isTarget
              ? snapped
                ? { elementId: snapped.elementId, handleId: snapped.handleId }
                : undefined
              : b.connection

            if (isTarget) {
              return {
                ...b,
                x: (currentAbsX - minX) / newWidth,
                y: (currentAbsY - minY) / newHeight,
                connection: conn,
              }
            }

            const oldAbs = b.connection
              ? getConnectionPos(b.connection, slide?.elements || [])
              : null
            const resolvedOldAbs = oldAbs ?? {
              x: element.position.x + b.x * element.size.width,
              y: element.position.y + b.y * element.size.height,
            }

            return {
              ...b,
              x: (resolvedOldAbs.x - minX) / newWidth,
              y: (resolvedOldAbs.y - minY) / newHeight,
              connection: conn,
            }
          })

          let newStartConn = content.startConnection
          let newEndConn = content.endConnection

          if (nodeType === 'start') {
            newStartConn = snapped
              ? { elementId: snapped.elementId, handleId: snapped.handleId }
              : undefined
          } else if (nodeType === 'end') {
            newEndConn = snapped
              ? { elementId: snapped.elementId, handleId: snapped.handleId }
              : undefined
          }

          updateElement(element.id, {
            position: { x: minX, y: minY },
            size: { width: newWidth, height: newHeight },
            content: {
              ...content,
              x1: nx1,
              y1: ny1,
              x2: nx2,
              y2: ny2,
              branches: content.branches ? newBranches : undefined,
              startConnection: newStartConn,
              endConnection: newEndConn,
            },
          })
        }

        const cleanup = () => {
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('mouseup', onUp)
          cleanupRef.current = null
        }

        const onUp = () => {
          cleanup()
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        cleanupRef.current = cleanup
      },
    [element, updateElement],
  )

  return { startNodeDrag }
}
