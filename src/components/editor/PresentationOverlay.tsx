import { useEffect, useRef, useState, useCallback } from 'react'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { CanvasElement } from './CanvasElement'
import { ConnectorLayer } from './ConnectorLayer'

const CANVAS_W = 1280
const CANVAS_H = 720

export function PresentationOverlay() {
  const {
    isPresenting,
    stopPresentation,
    activeProject,
    activeSlide,
    activeSlideIndex,
    setActiveSlide,
    playbackSettings,
  } = useEditorStore()

  const project = activeProject()
  const slide = activeSlide()
  const totalSlides = project?.slides.length ?? 0

  const [controlsVisible, setControlsVisible] = useState(true)
  const [autoplayPaused, setAutoplayPaused] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoplayTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-hide controls after 2s of inactivity
  const showControls = useCallback(() => {
    setControlsVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2500)
  }, [])

  // ── Keyboard navigation ─────────────────────
  useEffect(() => {
    if (!isPresenting) return
    function onKey(e: KeyboardEvent) {
      const { activeSlideIndex: idx } = useEditorStore.getState()
      const proj = useEditorStore.getState().activeProject()
      if (!proj) return

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        if (idx < proj.slides.length - 1) {
          setActiveSlide(idx + 1)
        } else if (playbackSettings.loop) {
          setActiveSlide(0)
        }
        showControls()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (idx > 0) setActiveSlide(idx - 1)
        showControls()
      } else if (e.key === 'Escape') {
        stopPresentation()
        document.exitFullscreen?.().catch(() => {})
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPresenting, setActiveSlide, stopPresentation, playbackSettings.loop, showControls])

  // ── Autoplay engine ─────────────────────────
  useEffect(() => {
    if (!isPresenting || !playbackSettings.autoplay || autoplayPaused) return

    autoplayTimer.current = setTimeout(() => {
      const { activeSlideIndex: idx } = useEditorStore.getState()
      const proj = useEditorStore.getState().activeProject()
      if (!proj) return

      if (idx < proj.slides.length - 1) {
        setActiveSlide(idx + 1)
      } else if (playbackSettings.loop) {
        setActiveSlide(0)
      } else {
        // Reached end without loop — stop
        setAutoplayPaused(true)
      }
    }, playbackSettings.autoplayDelay + playbackSettings.transitionDuration)

    return () => {
      if (autoplayTimer.current) clearTimeout(autoplayTimer.current)
    }
  }, [isPresenting, activeSlideIndex, playbackSettings, autoplayPaused, setActiveSlide])

  // ── Fullscreen sync ─────────────────────────
  useEffect(() => {
    if (!isPresenting) return
    document.documentElement.requestFullscreen?.().catch(() => {})

    function onFullscreenChange() {
      if (!document.fullscreenElement) {
        useEditorStore.getState().stopPresentation()
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [isPresenting])

  // ── Mouse movement ──────────────────────────
  useEffect(() => {
    if (!isPresenting) return
    const onMove = () => showControls()
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [isPresenting, showControls])

  if (!isPresenting || !slide) return null

  // Calculate scale to fill viewport
  const scaleX = window.innerWidth / CANVAS_W
  const scaleY = window.innerHeight / CANVAS_H
  const scale = Math.min(scaleX, scaleY)

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center cursor-none"
      onMouseMove={showControls}
      style={{ cursor: controlsVisible ? 'default' : 'none' }}
    >
      {/* Scaled canvas */}
      <div
        data-canvas-board
        className="relative overflow-hidden"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          background: slide.background || '#0a0a0a',
        }}
      >
        <ConnectorLayer slide={slide} elements={slide.elements} />
        <LayoutGroup>
          <AnimatePresence>
            {slide.elements.map((el) => (
              <CanvasElement key={el.id} element={el} />
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </div>

      {/* Controls overlay — fades in/out */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{ opacity: controlsVisible ? 1 : 0 }}
      >
        {/* Exit button */}
        <button
          onClick={() => { stopPresentation(); document.exitFullscreen?.().catch(() => {}) }}
          className="pointer-events-auto absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 border border-white/10 transition-all cursor-pointer backdrop-blur-sm"
        >
          <X size={18} />
        </button>

        {/* Bottom bar */}
        <div className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 border border-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
          {/* Slide nav */}
          <button
            onClick={() => { if (activeSlideIndex > 0) setActiveSlide(activeSlideIndex - 1) }}
            disabled={activeSlideIndex === 0}
            className="p-1 rounded-full text-white/60 hover:text-white disabled:opacity-30 transition-colors cursor-pointer border-none bg-transparent"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="text-sm text-white/70 min-w-[50px] text-center">
            {activeSlideIndex + 1} / {totalSlides}
          </span>

          <button
            onClick={() => {
              if (activeSlideIndex < totalSlides - 1) setActiveSlide(activeSlideIndex + 1)
              else if (playbackSettings.loop) setActiveSlide(0)
            }}
            disabled={activeSlideIndex >= totalSlides - 1 && !playbackSettings.loop}
            className="p-1 rounded-full text-white/60 hover:text-white disabled:opacity-30 transition-colors cursor-pointer border-none bg-transparent"
          >
            <ChevronRight size={18} />
          </button>

          {/* Autoplay toggle */}
          {playbackSettings.autoplay && (
            <>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={() => setAutoplayPaused(!autoplayPaused)}
                className="p-1 rounded-full text-white/60 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                {autoplayPaused ? <Play size={16} /> : <Pause size={16} />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
