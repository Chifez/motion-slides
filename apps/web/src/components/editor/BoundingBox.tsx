import { useCallback } from 'react'
import { RotateCw } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { MIN_ELEMENT_WIDTH, MIN_ELEMENT_HEIGHT } from '@/constants/animation'
import { RESIZE_HANDLES } from '@/constants/editor'
import type { SceneElement, LineContent } from '@motionslides/shared'
import { useAccessControl } from '@/hooks/useAccessControl'
import { useLineDrag } from '@/hooks/useLineDrag'
import { useConnectionDrag } from '@/hooks/useConnectionDrag'

interface Props { element: SceneElement }

function getCanvasScale(): number {
  const board = document.querySelector('[data-canvas-board]')
  if (!board) return 1
  return board.getBoundingClientRect().width / (board as HTMLElement).offsetWidth
}

export function ConnectionAnchors() {
  const { isReadOnly } = useAccessControl()
  const activeSlide = useEditorStore(s => s.activeSlide)
  const selectedElementIds = useEditorStore(s => s.selectedElementIds)
  const slide = activeSlide()
  if (isReadOnly || !slide || selectedElementIds.length !== 1) return null

  const element = slide.elements.find(el => el.id === selectedElementIds[0])
  if (element?.type !== 'line') return null
  const content = element.content as LineContent

  const shapes = slide.elements.filter(el => el.type === 'shape' || el.type === 'image' || el.type === 'code')

  return (
    <div className="absolute inset-0 pointer-events-none z-250">
      {shapes.map(shape => {
        const { x, y } = shape.position
        const { width: w, height: h } = shape.size
        const anchors = [
          { id: 'top' as const, x: x + w / 2, y },
          { id: 'bottom' as const, x: x + w / 2, y: y + h },
          { id: 'left' as const, x, y: y + h / 2 },
          { id: 'right' as const, x: x + w, y: y + h / 2 },
          { id: 'center' as const, x: x + w / 2, y: y + h / 2 },
        ]
        return anchors.map((a, i) => {
          const isSnapped =
            (content.startConnection?.elementId === shape.id && content.startConnection?.handleId === a.id) ||
            (content.endConnection?.elementId === shape.id && content.endConnection?.handleId === a.id) ||
            (content.branches?.some(b => b.connection?.elementId === shape.id && b.connection?.handleId === a.id))

          const baseCls = "absolute rounded-full border-2 transition-all duration-150 -translate-x-1/2 -translate-y-1/2"
          const snappedStyle = "w-4 h-4 bg-emerald-500 border-white shadow-[0_0_14px_rgba(16,185,129,0.9)] z-50 scale-125"
          const normalStyle = "w-3 h-3 bg-blue-500 border-white/80 opacity-80 shadow-[0_0_12px_rgba(59,130,246,0.6)]"

          return (
            <div
              key={`${shape.id}-${i}`}
              className={`${baseCls} ${isSnapped ? snappedStyle : normalStyle}`}
              style={{ left: a.x, top: a.y }}
            />
          )
        })
      })}
    </div>
  )
}

export function BoundingBox({ element }: Props) {
  const { isReadOnly } = useAccessControl()
  const updateElement = useEditorStore(s => s.updateElement)

  if (isReadOnly) return null

  const startRotate = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const board = document.querySelector('[data-canvas-board]')
    if (!board) return
    const boardRect = board.getBoundingClientRect()
    const scale = getCanvasScale()
    const cx = boardRect.left + (element.position.x + element.size.width / 2) * scale
    const cy = boardRect.top + (element.position.y + element.size.height / 2) * scale

    const onMove = (ev: MouseEvent) => {
      const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI) + 90
      updateElement(element.id, { rotation: Math.round(angle) })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [element, updateElement])

  const startResize = useCallback((corner: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const scale = getCanvasScale()
    const { x, y } = element.position
    const { width, height } = element.size

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / scale
      const dy = (ev.clientY - startY) / scale
      let newX = x, newY = y, newW = width, newH = height

      if (corner.includes('r')) newW = Math.max(MIN_ELEMENT_WIDTH, width + dx)
      if (corner.includes('l')) { newX = x + dx; newW = Math.max(MIN_ELEMENT_WIDTH, width - dx) }
      if (corner.includes('b')) newH = Math.max(MIN_ELEMENT_HEIGHT, height + dy)
      if (corner.includes('t')) { newY = y + dy; newH = Math.max(MIN_ELEMENT_HEIGHT, height - dy) }


      const updates: Partial<SceneElement> = { 
        position: { x: newX, y: newY }, 
        size: { width: newW, height: newH } 
      }

      if (element.type === 'text') {
        const affectsHeight = corner.includes('t') || corner.includes('b')
        if (affectsHeight) {
          updates.autoHeight = false
        }
      }

      updateElement(element.id, updates)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [element, updateElement])

  const { startNodeDrag } = useLineDrag(element, updateElement)
  const { startConnectionDrag } = useConnectionDrag(element)

  if (element.type === 'line') {
    const content = element.content as LineContent
    const isSnappedStart = !!content.startConnection
    const isSnappedEnd = !!content.endConnection

    const nodeCls = "w-4 h-4 rounded-full border-2 border-blue-500 bg-white shadow-sm group-hover:scale-125 transition-transform"
    const snappedCls = "w-5 h-5 rounded-full border-2 border-blue-400 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.9)] scale-110 group-hover:scale-125 transition-all"
    const branchCls = "w-4 h-4 rounded-full border-2 border-emerald-500 bg-white shadow-sm group-hover:scale-125 transition-transform"

    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: element.position.x, top: element.position.y,
          width: element.size.width, height: element.size.height,
        }}
      >
        <div 
          className="absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center cursor-pointer pointer-events-auto z-30 group"
          style={{ left: `${content.x1 * 100}%`, top: `${content.y1 * 100}%` }}
          onMouseDown={startNodeDrag('start')}
        >
          <div className={isSnappedStart ? snappedCls : nodeCls} />
        </div>
        {content.lineType !== 'branching' && (
          <div 
            className="absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center cursor-pointer pointer-events-auto z-30 group"
            style={{ left: `${content.x2 * 100}%`, top: `${content.y2 * 100}%` }}
            onMouseDown={startNodeDrag('end')}
          >
            <div className={isSnappedEnd ? snappedCls : nodeCls} />
          </div>
        )}
        {content.branches?.map((b, i) => {
          const isSnappedBranch = !!b.connection
          return (
            <div 
              key={b.id ?? i}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center cursor-pointer pointer-events-auto z-30 group"
              style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%` }}
              onMouseDown={startNodeDrag('branch', i)}
            >
              <div className={isSnappedBranch ? "w-5 h-5 rounded-full border-2 border-emerald-400 bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)] scale-110 group-hover:scale-125 transition-all" : branchCls} />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className="bounding-box"
      style={{
        left: element.position.x, top: element.position.y,
        width: element.size.width, height: element.size.height,
        transform: `rotate(${element.rotation}deg)`,
      }}
    >
      <div className="rotate-handle" onMouseDown={startRotate}>
        <RotateCw size={9} color="#fff" />
      </div>
      {RESIZE_HANDLES.map((h) => (
        <div key={h} className={`resize-handle ${h}`} onMouseDown={startResize(h)} />
      ))}
      {['shape', 'image', 'code', 'text', 'chart'].includes(element.type) && (
        <>
          <div 
            className="absolute left-1/2 -top-2.5 -translate-x-1/2 w-5 h-5 rounded-full border border-blue-500 bg-white hover:bg-blue-100 flex items-center justify-center cursor-pointer pointer-events-auto shadow-md transition-all scale-75 hover:scale-100 z-100 group"
            onMouseDown={startConnectionDrag('top')}
            title="Drag to create connection"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          </div>
          <div 
            className="absolute left-1/2 -bottom-2.5 -translate-x-1/2 w-5 h-5 rounded-full border border-blue-500 bg-white hover:bg-blue-100 flex items-center justify-center cursor-pointer pointer-events-auto shadow-md transition-all scale-75 hover:scale-100 z-100 group"
            onMouseDown={startConnectionDrag('bottom')}
            title="Drag to create connection"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          </div>
          <div 
            className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-blue-500 bg-white hover:bg-blue-100 flex items-center justify-center cursor-pointer pointer-events-auto shadow-md transition-all scale-75 hover:scale-100 z-100 group"
            onMouseDown={startConnectionDrag('left')}
            title="Drag to create connection"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          </div>
          <div 
            className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-blue-500 bg-white hover:bg-blue-100 flex items-center justify-center cursor-pointer pointer-events-auto shadow-md transition-all scale-75 hover:scale-100 z-100 group"
            onMouseDown={startConnectionDrag('right')}
            title="Drag to create connection"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          </div>
        </>
      )}
    </div>
  )
}
