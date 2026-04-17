import { useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { X } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAutoplay } from '@/hooks/useAutoplay'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useAutoHide } from '@/hooks/useAutoHide'
import { getCanvasDimensions } from '@/constants/canvas'
import { MotionProvider } from '@/context/MotionContext'
import { CanvasElement } from './CanvasElement'
import { PresentationControls } from './presentation/PresentationControls'
import type { Slide } from '@/types'

export function PresentationOverlay() {
  const {
    isPresenting, stopPresentation,
    activeProject, activeSlide, activeSlideIndex, setActiveSlide,
    playbackSettings,
  } = useEditorStore()

  const project = activeProject()
  const slide = activeSlide()
  const totalSlides = project?.slides.length ?? 0

  const [autoplayPaused, setAutoplayPaused] = useState(false)
  const [controlsVisible, showControls] = useAutoHide(isPresenting)

  // ── Track previous slide for identity-based diffing ──
  // When the activeSlideIndex changes, we snapshot the old slide
  // so the MotionProvider can compute continuingIds vs newElementIds.
  const prevSlideRef = useRef<Slide | null>(null)
  const prevSlideIndexRef = useRef<number>(-1)

  useEffect(() => {
    if (!project) return
    // On slide change, capture what was previously showing
    if (prevSlideIndexRef.current !== activeSlideIndex && prevSlideIndexRef.current >= 0) {
      prevSlideRef.current = project.slides[prevSlideIndexRef.current] ?? null
    }
    prevSlideIndexRef.current = activeSlideIndex
  }, [activeSlideIndex, project])

  // ── Keyboard navigation ──
  const onKey = useCallback((e: KeyboardEvent) => {
    const { activeSlideIndex: idx } = useEditorStore.getState()
    const proj = useEditorStore.getState().activeProject()
    if (!proj) return

    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault()
      if (idx < proj.slides.length - 1) setActiveSlide(idx + 1)
      else if (playbackSettings.loop) setActiveSlide(0)
      showControls()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (idx > 0) setActiveSlide(idx - 1)
      showControls()
    } else if (e.key === 'Escape') {
      stopPresentation()
      document.exitFullscreen?.().catch(() => { })
    }
  }, [setActiveSlide, stopPresentation, playbackSettings.loop, showControls])

  useKeyboardShortcuts(isPresenting, onKey)

  // ── Autoplay ──
  useAutoplay(
    isPresenting && playbackSettings.autoplay && !autoplayPaused,
    playbackSettings.autoplayDelay + playbackSettings.transitionDuration,
    () => {
      const { activeSlideIndex: idx } = useEditorStore.getState()
      const proj = useEditorStore.getState().activeProject()
      if (!proj) return
      if (idx < proj.slides.length - 1) setActiveSlide(idx + 1)
      else if (playbackSettings.loop) setActiveSlide(0)
      else setAutoplayPaused(true)
    },
    [activeSlideIndex],
  )

  // ── Fullscreen ──
  const onExitFullscreen = useCallback(() => {
    useEditorStore.getState().stopPresentation()
  }, [])
  useFullscreen(isPresenting, onExitFullscreen)

  if (!isPresenting || !slide) return null

  const { width: canvasW, height: canvasH } = getCanvasDimensions(playbackSettings.aspectRatio)
  const scaleX = window.innerWidth / canvasW
  const scaleY = window.innerHeight / canvasH
  const scale = Math.min(scaleX, scaleY)

  const handlePrev = () => { if (activeSlideIndex > 0) setActiveSlide(activeSlideIndex - 1) }
  const handleNext = () => {
    if (activeSlideIndex < totalSlides - 1) setActiveSlide(activeSlideIndex + 1)
    else if (playbackSettings.loop) setActiveSlide(0)
  }

  // Compute the stagger index for new elements.
  // We pass this to each CanvasElement so they can delay their entrance.
  let newStaggerCounter = 0

  return (
    <div
      className="fixed inset-0 z-9999 bg-black flex items-center justify-center"
      onMouseMove={showControls}
      style={{ cursor: controlsVisible ? 'default' : 'none' }}
    >
      <div
        data-canvas-board
        className="relative overflow-hidden"
        style={{
          width: canvasW,
          height: canvasH,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          background: slide.background || '#0a0a0a',
        }}
      >
        {/* MotionProvider injects user's duration, easing, AND identity tracking */}
        <MotionProvider
          settings={playbackSettings}
          previousSlide={prevSlideRef.current}
          currentSlide={slide}
        >
          <LayoutGroup>
            <AnimatePresence mode="popLayout">
              {slide.elements.map((el) => {
                // Track order for stagger delay
                const staggerIdx = newStaggerCounter++
                return (
                  <CanvasElement
                    key={el.id}
                    element={el}
                    staggerIndex={staggerIdx}
                  />
                )
              })}
            </AnimatePresence>
          </LayoutGroup>
        </MotionProvider>
      </div>

      {/* Controls — auto-hide */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{ opacity: controlsVisible ? 1 : 0 }}
      >
        <button
          onClick={() => { stopPresentation(); document.exitFullscreen?.().catch(() => { }) }}
          className="pointer-events-auto absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 border border-white/10 transition-all cursor-pointer backdrop-blur-sm"
        >
          <X size={18} />
        </button>
        <PresentationControls
          slideIndex={activeSlideIndex}
          totalSlides={totalSlides}
          playbackSettings={playbackSettings}
          autoplayPaused={autoplayPaused}
          onPrev={handlePrev}
          onNext={handleNext}
          onToggleAutoplay={() => setAutoplayPaused(!autoplayPaused)}
        />
      </div>
    </div>
  )
}
