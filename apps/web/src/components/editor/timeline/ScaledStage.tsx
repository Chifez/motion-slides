import { useState, useEffect, useRef } from 'react'
import { MotionStage } from '@/components/editor/MotionStage'
import { getCanvasDimensions } from '@motionslides/shared'
import type { Slide, PlaybackSettings, SlideTransition } from '@motionslides/shared'

interface Props {
  slide: Slide
  previousSlide: Slide | null
  settings: PlaybackSettings
  activeTransition: SlideTransition | null
}

/**
 * Wraps MotionStage in a ResizeObserver-driven container that scales the canvas
 * to fill the available area while preserving aspect ratio.
 */
export function ScaledStage({ slide, previousSlide, settings, activeTransition }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const defaultDims = getCanvasDimensions(settings.aspectRatio)
  const canvasDims = {
    width: slide.customWidth ?? defaultDims.width,
    height: slide.customHeight ?? defaultDims.height
  }

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return
      const cw = containerRef.current.clientWidth
      const ch = containerRef.current.clientHeight
      const scaleFactor = Math.min(cw / canvasDims.width, ch / canvasDims.height)
      setScale(scaleFactor * 0.98)
    }
    handleResize()
    const observer = new ResizeObserver(handleResize)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [canvasDims.width, canvasDims.height])

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <div
        style={{
          width: canvasDims.width,
          height: canvasDims.height,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
        }}
        className="relative shadow-2xl"
      >
        <MotionStage
          slide={slide}
          previousSlide={previousSlide}
          settings={settings}
          activeTransition={activeTransition}
          mode="presentation"
        />
      </div>
    </div>
  )
}
