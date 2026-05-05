import { useEffect, type RefObject } from 'react'
import { useEditorStore } from '@/store/editorStore'

/**
 * useCanvasCamera — Handles zoom and pan interactions
 * 
 * Uses a non-passive native listener to allow blocking browser zoom (Ctrl+Wheel).
 * Uses getState() to ensure the listener is stable and high-performance.
 */
export function useCanvasCamera(containerRef: RefObject<HTMLElement | null>) {
  const setCamera = useEditorStore(s => s.setCamera)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      // Zoom logic (Ctrl or Meta + Wheel)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        const { camera } = useEditorStore.getState()

        setCamera({
          zoom: Math.min(Math.max(camera.zoom * delta, 0.05), 10)
        })
      }
      // Pan logic (Normal Wheel)
      else {
        const { camera } = useEditorStore.getState()
        setCamera({
          x: camera.x - e.deltaX,
          y: camera.y - e.deltaY
        })
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [containerRef, setCamera])
}
