import { useEffect, useState, type RefObject } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_PADDING } from '@/constants/canvas'

/**
 * Computes the CSS scale factor for the canvas to fit inside a container
 * while maintaining the 16:9 aspect ratio. Uses a ResizeObserver.
 */
export function useCanvasScale(containerRef: RefObject<HTMLElement | null>): number {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function resize() {
      if (!el) return
      const { clientWidth: w, clientHeight: h } = el
      setScale(Math.min((w - CANVAS_PADDING) / CANVAS_WIDTH, (h - CANVAS_PADDING) / CANVAS_HEIGHT, 1))
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef])

  return scale
}
