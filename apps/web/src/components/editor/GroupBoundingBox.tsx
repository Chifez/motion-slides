import { useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
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
  const { updateElementsBatch } = useEditorStore()

  if (elements.length < 2) return null

  // Calculate the encompassing bounds
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

      if (corner.includes('r')) newW = Math.max(MIN_ELEMENT_WIDTH, startBounds.width + dx)
      if (corner.includes('l')) { newX = startBounds.x + dx; newW = Math.max(MIN_ELEMENT_WIDTH, startBounds.width - dx) }
      if (corner.includes('b')) newH = Math.max(MIN_ELEMENT_HEIGHT, startBounds.height + dy)
      if (corner.includes('t')) { newY = startBounds.y + dy; newH = Math.max(MIN_ELEMENT_HEIGHT, startBounds.height - dy) }

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
        // Rotation is disabled for groups in this iteration
        transform: `rotate(0deg)`,
        border: '1.5px solid #3b82f6', // Distinctive blue border for multi-select
        backgroundColor: 'rgba(59, 130, 246, 0.05)'
      }}
    >
      {RESIZE_HANDLES.map((h) => (
        <div 
          key={h} 
          className={`resize-handle ${h}`} 
          onMouseDown={startResize(h)}
          style={{ borderColor: '#3b82f6' }} 
        />
      ))}
    </div>
  )
}
