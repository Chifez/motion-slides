import { useState, useLayoutEffect, useRef } from 'react'

interface UseEmbedCanvasScaleParams {
  canvasW: number
  canvasH: number
}

export function useEmbedCanvasScale({
  canvasW,
  canvasH
}: UseEmbedCanvasScaleParams) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el
      setScale(Math.min(w / canvasW, h / canvasH) * 0.98)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [canvasW, canvasH])

  return {
    scale,
    containerRef
  }
}
