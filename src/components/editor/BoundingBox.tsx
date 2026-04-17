import { useCallback } from 'react'
import { RotateCw } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { MIN_ELEMENT_WIDTH, MIN_ELEMENT_HEIGHT } from '@/constants/animation'
import { RESIZE_HANDLES } from '@/constants/editor'
import type { SceneElement } from '@/types'

interface Props { element: SceneElement }

function getCanvasScale(): number {
  const board = document.querySelector('[data-canvas-board]')
  if (!board) return 1
  return board.getBoundingClientRect().width / (board as HTMLElement).offsetWidth
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
