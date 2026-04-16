import { useCallback } from 'react'
import { useEditorStore } from '../../store/editorStore'
import type { SceneElement } from '../../types'
import { RotateCw } from 'lucide-react'

interface Props { element: SceneElement }

export function BoundingBox({ element }: Props) {
  const { updateElement } = useEditorStore()

  // ── Rotation ────────────────────────────────
  const startRotate = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const cx = element.position.x + element.size.width / 2
    const cy = element.position.y + element.size.height / 2

    const onMove = (ev: MouseEvent) => {
      // Position is already in "canvas space" via parent transforms
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
    const { x, y, width, height } = { ...element.position, ...element.size }

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY

      let newX = x, newY = y, newW = width, newH = height

      if (corner.includes('r')) newW = Math.max(40, width + dx)
      if (corner.includes('l')) { newX = x + dx; newW = Math.max(40, width - dx) }
      if (corner.includes('b')) newH = Math.max(24, height + dy)
      if (corner.includes('t')) { newY = y + dy; newH = Math.max(24, height - dy) }
      if (corner === 'mr') newW = Math.max(40, width + dx)
      if (corner === 'ml') { newX = x + dx; newW = Math.max(40, width - dx) }
      if (corner === 'mb') newH = Math.max(24, height + dy)
      if (corner === 'mt') { newY = y + dy; newH = Math.max(24, height - dy) }

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

  const { x, y, width, height } = { ...element.position, ...element.size }

  return (
    <div
      className="bounding-box"
      style={{ left: x, top: y, width, height, rotate: `${element.rotation}deg` }}
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
