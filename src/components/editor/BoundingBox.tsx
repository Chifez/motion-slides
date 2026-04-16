import { useCallback } from 'react'
import { useEditorStore } from '../../store/editorStore'
import type { SceneElement } from '../../types'
import { RotateCw } from 'lucide-react'

interface Props { element: SceneElement }

function getCanvasScale(): number {
  const board = document.querySelector('[data-canvas-board]')
  if (!board) return 1
  return board.getBoundingClientRect().width / (board as HTMLElement).offsetWidth
}

export function BoundingBox({ element }: Props) {
  const { updateElement } = useEditorStore()

  // ── Rotation ────────────────────────────────
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

  // ── Resize ──────────────────────────────────
  const startResize = useCallback((corner: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const scale = getCanvasScale()
    const { x, y } = element.position
    const { width, height } = element.size

    const onMove = (ev: MouseEvent) => {
      // Divide raw pixel delta by canvas scale so 1px drag = 1px in canvas coords
      const dx = (ev.clientX - startX) / scale
      const dy = (ev.clientY - startY) / scale

      let newX = x, newY = y, newW = width, newH = height

      if (corner.includes('r')) newW = Math.max(40, width + dx)
      if (corner.includes('l')) { newX = x + dx; newW = Math.max(40, width - dx) }
      if (corner.includes('b')) newH = Math.max(24, height + dy)
      if (corner.includes('t')) { newY = y + dy; newH = Math.max(24, height - dy) }

      updateElement(element.id, {
        position: { x: newX, y: newY },
        size: { width: newW, height: newH },
      })
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
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        transform: `rotate(${element.rotation}deg)`,
      }}
    >
      {/* Rotate handle */}
      <div className="rotate-handle" onMouseDown={startRotate}>
        <RotateCw size={9} color="#fff" />
      </div>

      {/* 8 resize handles */}
      {(['tl','tm','tr','ml','mr','bl','bm','br'] as const).map((h) => (
        <div
          key={h}
          className={`resize-handle ${h}`}
          onMouseDown={startResize(h)}
        />
      ))}
    </div>
  )
}
