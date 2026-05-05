import { useLayoutEffect, useState, type RefObject } from 'react'
import { CANVAS_PADDING, CANVAS_PADDING_MOBILE } from '@motionslides/shared'
import { useIsMobile } from './useMediaQuery'

/**
 * Computes the CSS scale factor for the canvas to fit inside a container
 * while maintaining the aspect ratio. Uses a ResizeObserver.
 */
export function useCanvasScale(
  containerRef: RefObject<HTMLElement | null>,
  canvasWidth: number,
  canvasHeight: number,
): number {
  const [scale, setScale] = useState(1)
  const isMobile = useIsMobile()

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    function resize() {
      if (!el) return
      const { clientWidth: w, clientHeight: h } = el
      const padding = isMobile ? CANVAS_PADDING_MOBILE : CANVAS_PADDING
      setScale(Math.min((w - padding) / canvasWidth, (h - padding) / canvasHeight))
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef, canvasWidth, canvasHeight, isMobile])

  return scale
}
