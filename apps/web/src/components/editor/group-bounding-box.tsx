import { useCallback, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useElementDrag } from '@/hooks/useElementDrag'
import { MIN_ELEMENT_WIDTH, MIN_ELEMENT_HEIGHT } from '@/constants/animation'
import { RESIZE_HANDLES } from '@/constants/editor'
import type { SceneElement } from '@motionslides/shared'

interface Props { elements: SceneElement[] }

function getCanvasScale(): number {
  const board = document.querySelector('[data-canvas-board]')
  if (!board) return 1
  return board.getBoundingClientRect().width / (board as HTMLElement).offsetWidth
}

export function GroupBoundingBox({ elements }: Props) {
  const updateElementsBatch = useEditorStore(s => s.updateElementsBatch)
  const groupElements = useEditorStore(s => s.groupElements)
  const ungroupElements = useEditorStore(s => s.ungroupElements)
  const isDragging = useEditorStore(s => s.isDragging)
  const [isResizing, setIsResizing] = useState(false)

  const firstElement = elements[0]
  const { onPointerDown: dragOnPointerDown } = useElementDrag({
    element: firstElement,
    isReadOnly: false,
    isEditing: false,
    isMultiSelectMode: false
  })

  if (elements.length < 2) return null

  const firstGroupId = elements[0]?.groupId
  const isGrouped = firstGroupId && elements.every(el => el.groupId === firstGroupId)

  const minX = Math.min(...elements.map(e => e.position.x))
  const maxX = Math.max(...elements.map(e => e.position.x + e.size.width))
  const minY = Math.min(...elements.map(e => e.position.y))
  const maxY = Math.max(...elements.map(e => e.position.y + e.size.height))

  const bounds = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }

  const startResize = useCallback((corner: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)

    // Set cursor lock globally
    let cursor = 'pointer'
    if (corner === 'tl' || corner === 'br') cursor = 'nwse-resize'
    else if (corner === 'tr' || corner === 'bl') cursor = 'nesw-resize'
    else if (corner === 'tm' || corner === 'bm') cursor = 'ns-resize'
    else if (corner === 'ml' || corner === 'mr') cursor = 'ew-resize'
    document.body.style.cursor = cursor

    const startX = e.clientX
    const startY = e.clientY
    const scale = getCanvasScale()
    
    const startBounds = { ...bounds }
    const startElements = elements.map(e => ({ 
      id: e.id, 
      x: e.position.x, 
      y: e.position.y, 
      w: e.size.width, 
      h: e.size.height 
    }))

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / scale
      const dy = (ev.clientY - startY) / scale
      
      let newX = startBounds.x
      let newY = startBounds.y
      let newW = startBounds.width
      let newH = startBounds.height
      
      const cx = startBounds.x + startBounds.width / 2
      const cy = startBounds.y + startBounds.height / 2

      if (ev.altKey) {
        // Alt-key center resizing
        const factorX = corner.includes('r') ? 2 : corner.includes('l') ? -2 : 0
        const factorY = corner.includes('b') ? 2 : corner.includes('t') ? -2 : 0
        
        if (factorX !== 0) newW = Math.max(MIN_ELEMENT_WIDTH, startBounds.width + factorX * dx)
        if (factorY !== 0) newH = Math.max(MIN_ELEMENT_HEIGHT, startBounds.height + factorY * dy)
        
        if (ev.shiftKey && corner.length === 2) {
          // Alt + Shift constraint
          const scaleFactor = Math.max(newW / startBounds.width, newH / startBounds.height)
          newW = startBounds.width * scaleFactor
          newH = startBounds.height * scaleFactor
        }
        
        if (factorX !== 0) newX = cx - newW / 2
        if (factorY !== 0) newY = cy - newH / 2
      } else if (ev.shiftKey && corner.length === 2) {
        // Shift-key proportional aspect ratio resize
        let tempW = startBounds.width
        let tempH = startBounds.height
        if (corner.includes('r')) tempW = Math.max(MIN_ELEMENT_WIDTH, startBounds.width + dx)
        if (corner.includes('l')) tempW = Math.max(MIN_ELEMENT_WIDTH, startBounds.width - dx)
        if (corner.includes('b')) tempH = Math.max(MIN_ELEMENT_HEIGHT, startBounds.height + dy)
        if (corner.includes('t')) tempH = Math.max(MIN_ELEMENT_HEIGHT, startBounds.height - dy)
        
        const scaleFactor = Math.max(tempW / startBounds.width, tempH / startBounds.height)
        newW = startBounds.width * scaleFactor
        newH = startBounds.height * scaleFactor
        
        if (corner === 'br') {
          newX = startBounds.x
          newY = startBounds.y
        } else if (corner === 'bl') {
          newX = startBounds.x + (startBounds.width - newW)
          newY = startBounds.y
        } else if (corner === 'tr') {
          newX = startBounds.x
          newY = startBounds.y + (startBounds.height - newH)
        } else if (corner === 'tl') {
          newX = startBounds.x + (startBounds.width - newW)
          newY = startBounds.y + (startBounds.height - newH)
        }
      } else {
        // Standard drag resizing
        if (corner.includes('r')) newW = Math.max(MIN_ELEMENT_WIDTH, startBounds.width + dx)
        if (corner.includes('l')) { newX = startBounds.x + dx; newW = Math.max(MIN_ELEMENT_WIDTH, startBounds.width - dx) }
        if (corner.includes('b')) newH = Math.max(MIN_ELEMENT_HEIGHT, startBounds.height + dy)
        if (corner.includes('t')) { newY = startBounds.y + dy; newH = Math.max(MIN_ELEMENT_HEIGHT, startBounds.height - dy) }
      }

      const scaleX = newW / startBounds.width
      const scaleY = newH / startBounds.height

      const updates = startElements.map(el => {
        return {
          id: el.id,
          changes: {
            position: {
              x: newX + (el.x - startBounds.x) * scaleX,
              y: newY + (el.y - startBounds.y) * scaleY
            },
            size: {
              width: el.w * scaleX,
              height: el.h * scaleY
            }
          }
        }
      })
      
      updateElementsBatch(updates)
    }
    
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      setIsResizing(false)
      document.body.style.cursor = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [elements, bounds, updateElementsBatch])

  return (
    <div
      className="bounding-box group-bounding-box"
      style={{
        left: bounds.x, 
        top: bounds.y,
        width: bounds.width, 
        height: bounds.height,
        transform: `rotate(0deg)`,
        border: '1.5px solid #18a0fb',
        backgroundColor: 'rgba(24, 160, 251, 0.04)',
        pointerEvents: 'all',
        cursor: 'move'
      }}
      onPointerDown={dragOnPointerDown}
    >
      {RESIZE_HANDLES.map((h) => (
        <div 
          key={h} 
          className={`resize-handle ${h}`} 
          onMouseDown={startResize(h)}
          style={{ borderColor: '#18a0fb' }} 
        />
      ))}

      {/* Floating Canvas Group/Ungroup Badge */}
      <div 
        className="absolute top-0 left-0 -translate-y-full -mt-2.5 flex items-center gap-1.5 bg-[#18a0fb] text-white text-[10px] font-bold px-2 py-1 rounded shadow-md pointer-events-auto select-none z-[300]"
        onPointerDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        {isGrouped ? (
          <>
            <span className="uppercase tracking-wider">Group</span>
            <span className="w-[1px] h-3 bg-white/30" />
            <button
              onClick={() => ungroupElements(firstGroupId)}
              className="text-white hover:text-white/80 font-bold border-none bg-transparent cursor-pointer p-0 text-[10px] uppercase tracking-wider transition-colors"
            >
              Ungroup
            </button>
          </>
        ) : (
          <>
            <span className="uppercase tracking-wider">Selection</span>
            <span className="w-[1px] h-3 bg-white/30" />
            <button
              onClick={() => groupElements(elements.map(el => el.id))}
              className="text-white hover:text-white/80 font-bold border-none bg-transparent cursor-pointer p-0 text-[10px] uppercase tracking-wider transition-colors"
            >
              Group
            </button>
          </>
        )}
      </div>

      {/* Figma-style Dimension Badge */}
      {(isDragging || isResizing) && (
        <div
          className="absolute left-1/2 -bottom-8 -translate-x-1/2 bg-neutral-900/90 text-white font-mono text-[10px] px-2 py-0.5 rounded shadow-lg border border-white/10 z-[300] select-none whitespace-nowrap flex items-center gap-1.5 pointer-events-none"
        >
          {isDragging ? (
            <>
              <span className="text-neutral-400">X:</span>
              <span>{Math.round(bounds.x)}</span>
              <span className="text-neutral-400">Y:</span>
              <span>{Math.round(bounds.y)}</span>
            </>
          ) : (
            <>
              <span className="text-neutral-400">W:</span>
              <span>{Math.round(bounds.width)}</span>
              <span className="text-neutral-400">H:</span>
              <span>{Math.round(bounds.height)}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
