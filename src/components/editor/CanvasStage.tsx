import { useRef, useState, useEffect } from 'react'

import { ChevronLeft, ChevronRight, Palette } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useCanvasScale } from '@/hooks/useCanvasScale'
import { getCanvasDimensions } from '@/constants/canvas'
import { MotionStage } from './MotionStage'
import { GroupBoundingBox } from './GroupBoundingBox'

export function CanvasStage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [showBgPicker, setShowBgPicker] = useState(false)

  const { 
    activeProject, activeSlide, activeSlideIndex, setActiveSlide, 
    setSelectedElement, playbackSettings, updateSlide,
    camera, setCamera, setMobileInspectorOpen
  } = useEditorStore()
  const project = activeProject()
  const slide = activeSlide()
  const totalSlides = project?.slides.length ?? 0

  const selectedElementIds = useEditorStore((state) => state.selectedElementIds)
  const selectedElements = slide?.elements.filter(el => selectedElementIds.includes(el.id)) || []
  // We render the group bounding box if there are multiple selections, OR if the single selection is part of a group
  const isGroupSelection = selectedElements.length > 1 || (selectedElements.length === 1 && selectedElements[0].groupId)

  const { width: canvasW, height: canvasH } = getCanvasDimensions(playbackSettings.aspectRatio)
  const scale = useCanvasScale(stageRef, canvasW, canvasH)

  useEffect(() => {
    const el = stageRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        // We use functional update or capture current values from store
        const currentCamera = useEditorStore.getState().camera
        setCamera({ zoom: Math.min(Math.max(currentCamera.zoom * delta, 0.05), 10) })
      } else {
        const currentCamera = useEditorStore.getState().camera
        setCamera({ x: currentCamera.x - e.deltaX, y: currentCamera.y - e.deltaY })
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [setCamera])

  const slideName = slide?.name || `Slide ${activeSlideIndex + 1}`

  return (
    <main
      ref={stageRef}
      className="flex-1 bg-[#111111] flex items-center justify-center overflow-hidden relative p-2 md:p-0"
      onClick={() => {
        setSelectedElement(null)
        setMobileInspectorOpen(false)
      }}
    >
      <div
        data-canvas-board
        className="relative rounded-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden"
        style={{
          width: canvasW,
          height: canvasH,
          background: slide?.background || '#0a0a0a',
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${scale * camera.zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <MotionStage
          mode="editor"
          slide={slide}
          previousSlide={null}
          settings={playbackSettings}
        />
        {isGroupSelection && <GroupBoundingBox elements={selectedElements} />}
      </div>

      {/* Slide name + background controls */}
      <div
        className="absolute top-3 left-3 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10px] text-neutral-600 font-medium bg-[#161616]/80 backdrop-blur-sm border border-white/6 rounded-md px-2 py-1">
          {slideName}
        </span>

        <div className="relative">
          <button
            onClick={() => setShowBgPicker(!showBgPicker)}
            className="flex items-center gap-1.5 text-[10px] text-neutral-500 hover:text-neutral-200 bg-[#161616]/80 backdrop-blur-sm border border-white/6 rounded-md px-2 py-1 cursor-pointer transition-colors"
          >
            <div
              className="w-3 h-3 rounded-sm border border-white/15"
              style={{ background: slide?.background || '#0a0a0a' }}
            />
            <Palette size={11} />
          </button>

          {showBgPicker && (
            <div className="absolute top-full mt-1.5 left-0 bg-[#1a1a1a] border border-white/8 rounded-lg shadow-2xl z-50 p-3 w-48">
              <span className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-2">Slide Background</span>
              <input
                type="color"
                value={slide?.background || '#0a0a0a'}
                onChange={(e) => updateSlide({ background: e.target.value })}
                className="w-full h-8 rounded-md cursor-pointer border-none bg-transparent mb-2"
              />
              <div className="flex gap-1 flex-wrap">
                {['#0a0a0a', '#111827', '#1e1b4b', '#0c4a6e', '#14532d', '#7f1d1d', '#ffffff', '#f5f5f4'].map((c) => (
                  <button
                    key={c}
                    onClick={() => updateSlide({ background: c })}
                    className="w-6 h-6 rounded-md border border-white/10 cursor-pointer transition-transform hover:scale-110"
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Playback nav bar */}
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
