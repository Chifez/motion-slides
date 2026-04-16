import { useRef, useEffect, useState } from 'react'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { CanvasElement } from './CanvasElement'
import { ConnectorLayer } from './ConnectorLayer'

const CANVAS_W = 1280
const CANVAS_H = 720

export function CanvasStage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const {
    activeProject,
    activeSlide,
    activeSlideIndex,
    setActiveSlide,
    setSelectedElement,
  } = useEditorStore()

  const project = activeProject()
  const slide = activeSlide()

  // Compute scale to fit canvas in stage
  useEffect(() => {
    function resize() {
      if (!stageRef.current) return
      const { clientWidth: w, clientHeight: h } = stageRef.current
      const padding = 64
      const scaleX = (w - padding) / CANVAS_W
      const scaleY = (h - padding) / CANVAS_H
      setScale(Math.min(scaleX, scaleY, 1))
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (stageRef.current) ro.observe(stageRef.current)
    return () => ro.disconnect()
  }, [])

  const totalSlides = project?.slides.length ?? 0

  return (
    <main
      ref={stageRef}
      className="canvas-stage"
      onClick={() => setSelectedElement(null)}
    >
      {/* Canvas Board */}
      <div
        className="canvas-board"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Connector SVG layer */}
        {slide && <ConnectorLayer slide={slide} elements={slide.elements} />}

        {/* Elements rendered with layout animations */}
        <LayoutGroup>
          <AnimatePresence>
            {slide?.elements.map((el) => (
              <CanvasElement key={el.id} element={el} />
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </div>

      {/* Playback controls */}
      <div className="playback-bar">
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setActiveSlide(activeSlideIndex - 1)}
          disabled={activeSlideIndex === 0}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="slide-counter">
          {activeSlideIndex + 1} / {totalSlides}
        </span>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setActiveSlide(activeSlideIndex + 1)}
          disabled={activeSlideIndex >= totalSlides - 1}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </main>
  )
}
