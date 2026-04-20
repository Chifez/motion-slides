import { useState, useCallback, useRef, useLayoutEffect } from 'react'
import { X } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAutoplay } from '@/hooks/useAutoplay'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useAutoHide } from '@/hooks/useAutoHide'
import { getCanvasDimensions } from '@/constants/canvas'
import { MotionStage } from './MotionStage'
import { PresentationControls } from './presentation/PresentationControls'

/**
 * Returns the value from the PREVIOUS render cycle.
 * Uses useLayoutEffect so the ref is updated synchronously after render
 * but before paint — meaning the next render always sees the correct previous.
 */
function usePrevious<T>(value: T): T | null {
  const ref = useRef<T | null>(null)
  useLayoutEffect(() => {
    ref.current = value
  })
  return ref.current
}

export function PresentationOverlay() {
  const isPresenting = useEditorStore((s) => s.isPresenting)
  const stopPresentation = useEditorStore((s) => s.stopPresentation)
  const activeSlideIndex = useEditorStore((s) => s.activeSlideIndex)
  const setActiveSlide = useEditorStore((s) => s.setActiveSlide)
  const playbackSettings = useEditorStore((s) => s.playbackSettings)

  const project = useEditorStore((s) => s.projects.find((p) => p.id === s.activeProjectId) ?? null)
  const slide = useEditorStore((s) => {
    const p = s.projects.find((proj) => proj.id === s.activeProjectId)
    return p?.slides[s.activeSlideIndex] ?? null
  })
  const totalSlides = project?.slides.length ?? 0

  const [autoplayPaused, setAutoplayPaused] = useState(false)
  const [controlsVisible, showControls] = useAutoHide(isPresenting)

  // ── Track previous slide for identity-based diffing ──
  // usePrevious returns the slide from the PREVIOUS render cycle,
  // so continuingIds is always computed from the correct "from" state.
  const previousSlide = usePrevious(slide)

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

  // ── Resolve active prototype transition ──────────────────────────────────
  // Look up a SlideTransition defined in prototype mode that connects the
  // previous slide to the current slide. When found, its animation direction,
  // duration, and ease override the global playback settings.
  const activeTransition = previousSlide && project
    ? (project.transitions ?? []).find(
        (t) => t.fromSlideId === previousSlide.id && t.toSlideId === slide.id,
      ) ?? null
    : null

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
        <MotionStage
          mode="presentation"
          slide={slide}
          previousSlide={previousSlide}
          settings={playbackSettings}
          activeTransition={activeTransition}
        />
      </div>

      {/* Controls — auto-hide */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{ opacity: controlsVisible ? 1 : 0 }}
      >
        <button
          onClick={() => stopPresentation()}
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

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden z-[10000]">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${((activeSlideIndex + 1) / totalSlides) * 100}%` }}
        />
      </div>
    </div>
  )
}
