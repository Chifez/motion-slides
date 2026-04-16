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

  const { activeProject, activeSlide, activeSlideIndex, setActiveSlide, setSelectedElement } = useEditorStore()

  const project = activeProject()
  const slide = activeSlide()

  useEffect(() => {
    function resize() {
      if (!stageRef.current) return
      const { clientWidth: w, clientHeight: h } = stageRef.current
      const padding = 64
      setScale(Math.min((w - padding) / CANVAS_W, (h - padding) / CANVAS_H, 1))
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
      className="flex-1 bg-[#111111] flex items-center justify-center overflow-hidden relative"
      onClick={() => setSelectedElement(null)}
    >
      {/* Canvas Board */}
      <div
        className="relative bg-[#0a0a0a] rounded-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {slide && <ConnectorLayer slide={slide} elements={slide.elements} />}

        <LayoutGroup>
          <AnimatePresence>
            {slide?.elements.map((el) => (
              <CanvasElement key={el.id} element={el} />
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </div>

      {/* Playback bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#161616]/90 border border-white/[0.08] rounded-full px-3 py-1.5 backdrop-blur-md">
        <button
          onClick={() => setActiveSlide(activeSlideIndex - 1)}
          disabled={activeSlideIndex === 0}
          className="p-1 rounded-full text-neutral-400 hover:text-neutral-100 disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer border-none bg-transparent"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs text-neutral-500 min-w-[48px] text-center">
          {activeSlideIndex + 1} / {totalSlides}
        </span>
        <button
          onClick={() => setActiveSlide(activeSlideIndex + 1)}
          disabled={activeSlideIndex >= totalSlides - 1}
          className="p-1 rounded-full text-neutral-400 hover:text-neutral-100 disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer border-none bg-transparent"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </main>
  )
}
