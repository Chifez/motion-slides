import { useRef } from 'react'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useCanvasScale } from '@/hooks/useCanvasScale'
import { getCanvasDimensions } from '@/constants/canvas'
import { ConnectorLayer } from './ConnectorLayer'
import { CanvasElement } from './CanvasElement'

export function CanvasStage() {
  const stageRef = useRef<HTMLDivElement>(null)

  const { activeProject, activeSlide, activeSlideIndex, setActiveSlide, setSelectedElement, playbackSettings } = useEditorStore()
  const project = activeProject()
  const slide = activeSlide()
  const totalSlides = project?.slides.length ?? 0

  const { width: canvasW, height: canvasH } = getCanvasDimensions(playbackSettings.aspectRatio)
  const scale = useCanvasScale(stageRef, canvasW, canvasH)

  return (
    <main
      ref={stageRef}
      className="flex-1 bg-[#111111] flex items-center justify-center overflow-hidden relative"
      onClick={() => setSelectedElement(null)}
    >
      <div
        data-canvas-board
        className="relative bg-[#0a0a0a] rounded-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden"
        style={{
          width: canvasW,
          height: canvasH,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {slide && <ConnectorLayer slide={slide} elements={slide.elements} />}
        <LayoutGroup>
          <AnimatePresence>
            {slide?.elements.map((el) => <CanvasElement key={el.id} element={el} />)}
          </AnimatePresence>
        </LayoutGroup>
      </div>

      {/* Playback bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#161616]/90 border border-white/8 rounded-full px-3 py-1.5 backdrop-blur-md">
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
