import { useState, useCallback, useRef, useLayoutEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAutoplay } from '@/hooks/useAutoplay'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useAutoHide } from '@/hooks/useAutoHide'
import { getCanvasDimensions } from '@motionslides/shared'
import { MotionStage } from './MotionStage'
import { PresentationControls } from './presentation/PresentationControls'
import { useAccessControl } from '@/hooks/useAccessControl'

export function PresentationOverlay() {
  const isPresenting = useEditorStore((s) => s.isPresenting)
  const stopPresentation = useEditorStore((s) => s.stopPresentation)
  const activeSlideIndex = useEditorStore((s) => s.activeSlideIndex)
  const setActiveSlide = useEditorStore((s) => s.setActiveSlide)
  const playbackSettings = useEditorStore((s) => s.playbackSettings)

  const project = useEditorStore((s) => s.projects.find((p) => p.id === s.activeProjectId) ?? null)
  const previousSlideIndex = useEditorStore((s) => s.previousSlideIndex)
  const slide = project?.slides[activeSlideIndex] ?? null
  const previousSlide = previousSlideIndex !== null ? (project?.slides[previousSlideIndex] ?? null) : null
  const totalSlides = project?.slides.length ?? 0

  const [controlsVisible, showControls] = useAutoHide(isPresenting)
  const { autoplay: urlAutoplay } = useAccessControl()
  const [autoplayPaused, setAutoplayPaused] = useState(false)

  // ── Sync global autoplay with local state ──
  const resolvedAutoplay = urlAutoplay !== null ? urlAutoplay : playbackSettings.autoplay
  const isAutoplayActive = resolvedAutoplay && !autoplayPaused

  // ── Resolve Prototype Transitions ────────────────────────────────────────
  const { activeTransition, clickTransition, autoTransition } = useEditorStore.getState().getPlaybackTransitions()

  const handleNext = useCallback(() => {
    if (clickTransition) {
      const targetIndex = project?.slides.findIndex(s => s.id === clickTransition.toSlideId) ?? -1
      if (targetIndex !== -1) setActiveSlide(targetIndex)
    } else {
      if (activeSlideIndex < totalSlides - 1) setActiveSlide(activeSlideIndex + 1)
      else if (playbackSettings.loop) setActiveSlide(0)
    }
  }, [clickTransition, project?.slides, activeSlideIndex, totalSlides, playbackSettings.loop, setActiveSlide])

  const handlePrev = useCallback(() => {
    if (activeSlideIndex > 0) setActiveSlide(activeSlideIndex - 1)
  }, [activeSlideIndex, setActiveSlide])

  // ── Keyboard navigation ──
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault()
      handleNext()
      showControls()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      handlePrev()
      showControls()
    } else if (e.key === 'Escape') {
      stopPresentation()
    }
  }, [handleNext, handlePrev, stopPresentation, showControls])

  useKeyboardShortcuts(isPresenting, onKey)

  // ── Autoplay ──
  const entranceDuration = activeTransition?.duration ?? playbackSettings.transitionDuration
  const autoplayDelay = autoTransition
    ? (autoTransition.autoDelay ?? 0) + entranceDuration
    : playbackSettings.autoplayDelay + entranceDuration

  const shouldAutoplay = (isPresenting && isAutoplayActive) || (isPresenting && !!autoTransition)

  useAutoplay(
    shouldAutoplay,
    autoplayDelay,
    () => {
      if (autoTransition) {
        const targetIndex = project?.slides.findIndex(s => s.id === autoTransition.toSlideId) ?? -1
        if (targetIndex !== -1) setActiveSlide(targetIndex)
      } else {
        const { activeSlideIndex: idx } = useEditorStore.getState()
        if (idx < totalSlides - 1) setActiveSlide(idx + 1)
        else if (playbackSettings.loop) setActiveSlide(0)
        else setAutoplayPaused(true)
      }
    },
    [activeSlideIndex, isAutoplayActive, autoTransition, project?.slides, totalSlides],
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

  return (
    <div
      className="fixed inset-0 z-[var(--z-overlay)] bg-black flex items-center justify-center"
      onMouseMove={showControls}
      onClick={handleNext}
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
          onClick={(e) => { e.stopPropagation(); stopPresentation() }}
          className="pointer-events-auto absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 border border-white/10 transition-all cursor-pointer backdrop-blur-sm"
        >
          <X size={18} />
        </button>
        <div onClick={(e) => e.stopPropagation()}>
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

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden z-[var(--z-toast)]">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${((activeSlideIndex + 1) / totalSlides) * 100}%` }}
        />
      </div>
    </div>
  )
}
