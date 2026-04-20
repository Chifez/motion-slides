import { useCallback } from 'react'
import { RotateCw } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { MIN_ELEMENT_WIDTH, MIN_ELEMENT_HEIGHT } from '@/constants/animation'
import { RESIZE_HANDLES } from '@/constants/editor'
import type { SceneElement, Position, LineContent } from '@/types'

interface Props { element: SceneElement }

function getCanvasScale(): number {
  const board = document.querySelector('[data-canvas-board]')
  if (!board) return 1
  return board.getBoundingClientRect().width / (board as HTMLElement).offsetWidth
}

export function ConnectionAnchors() {
  const { activeSlide, selectedElementIds } = useEditorStore()
  const slide = activeSlide()
  if (!slide || selectedElementIds.length !== 1) return null

  const element = slide.elements.find(el => el.id === selectedElementIds[0])
  if (element?.type !== 'line') return null

  const shapes = slide.elements.filter(el => el.type === 'shape' || el.type === 'image' || el.type === 'code')

  return (
    <div className="absolute inset-0 pointer-events-none z-250">
      {shapes.map(shape => {
        const { x, y } = shape.position
        const { width: w, height: h } = shape.size
        const anchors = [
          { x: x + w / 2, y },
          { x: x + w / 2, y: y + h },
          { x, y: y + h / 2 },
          { x: x + w, y: y + h / 2 },
          { x: x + w / 2, y: y + h / 2 },
        ]
        return anchors.map((a, i) => (
          <div
            key={`${shape.id}-${i}`}
            className="absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white/80 -translate-x-1/2 -translate-y-1/2 opacity-80 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
            style={{ left: a.x, top: a.y }}
          />
        ))
      })}
    </div>
  )
}

export function BoundingBox({ element }: Props) {
  const { updateElement } = useEditorStore()

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

      updateElement(element.id, { position: { x: newX, y: newY }, size: { width: newW, height: newH } })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [element, updateElement])

  const startNodeDrag = useCallback((nodeType: 'start' | 'end' | 'branch', branchIndex?: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const content = element.content as LineContent
    const scale = getCanvasScale()
    
    let absStart = { x: element.position.x + content.x1 * element.size.width, y: element.position.y + content.y1 * element.size.height }
    let absEnd = { x: element.position.x + content.x2 * element.size.width, y: element.position.y + content.y2 * element.size.height }

    const onMove = (ev: MouseEvent) => {
      const board = document.querySelector('[data-canvas-board]')
      if (!board) return
      const boardRect = board.getBoundingClientRect()
      
      let currentAbsX = (ev.clientX - boardRect.left) / scale
      let currentAbsY = (ev.clientY - boardRect.top) / scale
      
      const slide = useEditorStore.getState().activeSlide()
      type SnapTarget = { elementId: string, handleId: 'top' | 'bottom' | 'left' | 'right' | 'center', pos: Position }
      let snapped: SnapTarget | null = null

      if (slide) {
        for (const other of slide.elements) {
          if (other.id === element.id || other.type === 'line') continue
          const { x: ox, y: oy } = other.position
          const { width: ow, height: oh } = other.size
          const anchors: { id: SnapTarget['handleId'], p: Position }[] = [
            { id: 'top', p: { x: ox + ow / 2, y: oy } },
            { id: 'bottom', p: { x: ox + ow / 2, y: oy + oh } },
            { id: 'left', p: { x: ox, y: oy + oh / 2 } },
            { id: 'right', p: { x: ox + ow, y: oy + oh / 2 } },
            { id: 'center', p: { x: ox + ow / 2, y: oy + oh / 2 } },
          ]
          for (const a of anchors) {
            const dist = Math.hypot(a.p.x - currentAbsX, a.p.y - currentAbsY)
            if (dist < 15) {
              snapped = { elementId: other.id, handleId: a.id, pos: a.p }
              break
            }
          }
          if (snapped) break
        }
      }

      if (snapped) {
        currentAbsX = snapped.pos.x
        currentAbsY = snapped.pos.y
      }

      if (nodeType === 'start') {
        absStart = { x: currentAbsX, y: currentAbsY }
      } else if (nodeType === 'end') {
        absEnd = { x: currentAbsX, y: currentAbsY }
      }

      const minX = Math.min(absStart.x, absEnd.x)
      const minY = Math.min(absStart.y, absEnd.y)
      const maxX = Math.max(absStart.x, absEnd.x)
      const maxY = Math.max(absStart.y, absEnd.y)
      
      const newWidth = Math.max(1, maxX - minX)
      const newHeight = Math.max(1, maxY - minY)

      const nx1 = (absStart.x - minX) / newWidth
      const ny1 = (absStart.y - minY) / newHeight
      const nx2 = (absEnd.x - minX) / newWidth
      const ny2 = (absEnd.y - minY) / newHeight
      
      const newBranches = content.branches?.map((b, i) => {
         if (nodeType === 'branch' && branchIndex === i) {
           return {
             x: (currentAbsX - minX) / newWidth,
             y: (currentAbsY - minY) / newHeight
           }
         }
         const oldAbsX = element.position.x + b.x * element.size.width
         const oldAbsY = element.position.y + b.y * element.size.height
         return {
           x: (oldAbsX - minX) / newWidth,
           y: (oldAbsY - minY) / newHeight
         }
      })

      let newStartConn = content.startConnection
      let newEndConn = content.endConnection

      if (nodeType === 'start') {
        newStartConn = snapped ? { elementId: snapped.elementId, handleId: snapped.handleId } : undefined
      } else if (nodeType === 'end') {
        newEndConn = snapped ? { elementId: snapped.elementId, handleId: snapped.handleId } : undefined
      }

      updateElement(element.id, { 
        position: { x: minX, y: minY }, 
        size: { width: newWidth, height: newHeight },
        content: { 
          ...content, 
          x1: nx1, y1: ny1, 
          x2: nx2, y2: ny2,
          branches: content.branches ? newBranches : undefined,
          startConnection: newStartConn,
          endConnection: newEndConn
        } 
      })
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [element, updateElement])

  if (element.type === 'line') {
    const content = element.content as LineContent
    const isSnappedStart = !!content.startConnection
    const isSnappedEnd = !!content.endConnection

    const nodeCls = "absolute w-3 h-3 rounded-full border-2 border-blue-500 bg-white -translate-x-1/2 -translate-y-1/2 cursor-pointer shadow-sm hover:scale-125 transition-transform"
    const snappedCls = "absolute w-4 h-4 rounded-full border-2 border-blue-400 bg-blue-500 -translate-x-1/2 -translate-y-1/2 cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.8)] z-50"

    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: element.position.x, top: element.position.y,
          width: element.size.width, height: element.size.height,
        }}
      >
        <div 
          className={isSnappedStart ? snappedCls : nodeCls} 
          style={{ left: `${content.x1 * 100}%`, top: `${content.y1 * 100}%`, pointerEvents: 'auto' }}
          onMouseDown={startNodeDrag('start')}
        />
        <div 
          className={isSnappedEnd ? snappedCls : nodeCls} 
          style={{ left: `${content.x2 * 100}%`, top: `${content.y2 * 100}%`, pointerEvents: 'auto' }}
          onMouseDown={startNodeDrag('end')}
        />
        {content.branches?.map((b, i) => (
          <div 
            key={i}
            className={nodeCls} 
            style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, pointerEvents: 'auto', borderColor: '#10b981' }}
            onMouseDown={startNodeDrag('branch', i)}
          />
        ))}
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
    </div>
  )
}
