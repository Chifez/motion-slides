import { useState, useCallback, useRef, useLayoutEffect, useMemo, useEffect } from 'react'
import { X } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useShallow } from 'zustand/react/shallow'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAutoplay } from '@/hooks/useAutoplay'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useAutoHide } from '@/hooks/useAutoHide'
import { getCanvasDimensions } from '@motionslides/shared'
import { MotionStage } from './MotionStage'
import { PresentationControls } from './presentation/PresentationControls'
import { useAccessControl } from '@/hooks/useAccessControl'
import { CaptionOverlay } from './presentation/CaptionOverlay'

export function PresentationOverlay() {
  const isPresenting = useEditorStore(s => s.isPresenting)
  const activeSlideIndex = useEditorStore(s => s.activeSlideIndex)
  const previousSlideIndex = useEditorStore(s => s.previousSlideIndex)
  const playbackSettings = useEditorStore(s => s.playbackSettings)
  const activeProjectId = useEditorStore(s => s.activeProjectId)

  const stopPresentation = useEditorStore(s => s.stopPresentation)
  const setActiveSlide = useEditorStore(s => s.setActiveSlide)

  const project = useEditorStore(useShallow(s => s.projects.find(p => p.id === s.activeProjectId) ?? null))

  const slide = project?.slides[activeSlideIndex] ?? null
  const previousSlide = previousSlideIndex !== null ? (project?.slides[previousSlideIndex] ?? null) : null
  const totalSlides = project?.slides.length ?? 0

  const [controlsVisible, showControls] = useAutoHide(isPresenting)
  const { autoplay: urlAutoplay } = useAccessControl()
  const [autoplayPaused, setAutoplayPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // Compute slide starting times in absolute seconds
  const slidesWithTiming = useMemo(() => {
    let current = 0
    return (project?.slides ?? []).map((s, idx) => {
      const hasTransition = idx > 0
      const transitionDuration = hasTransition ? (playbackSettings.transitionDuration ?? 500) : 0
      const transitionObj = project?.transitions?.find(t => t.fromSlideId === s.id && t.trigger === 'auto')
      const configuredSlideDuration = transitionObj ? (transitionObj.autoDelay ?? 3000) : (playbackSettings.autoplayDelay ?? 3000)
      const activeAudioDurationMs = s.audio ? ((s.audio.trimEnd - s.audio.trimStart) / s.audio.playbackRate) * 1000 : 0
      const durationMs = Math.max(configuredSlideDuration, activeAudioDurationMs)
      const durationSec = durationMs / 1000
      const start = current
      const end = current + durationSec
      current = end
      return { start, duration: durationSec }
    })
  }, [project?.slides, project?.transitions, playbackSettings])

  // Timer loop tracking slide playback progress
  useEffect(() => {
    if (!isPresenting) return
    setElapsed(0)
    const startTime = Date.now()
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000)
    }, 50)
    return () => clearInterval(interval)
  }, [activeSlideIndex, isPresenting])

  const slideStart = slidesWithTiming[activeSlideIndex]?.start ?? 0
  const currentTime = slideStart + elapsed

  const slideAudioRef = useRef<HTMLAudioElement | null>(null)
  const bgMusicRef = useRef<HTMLAudioElement | null>(null)
  const bgMusicIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const slideAudioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resolvedAutoplay = urlAutoplay !== null ? urlAutoplay : playbackSettings.autoplay
  const isAutoplayActive = resolvedAutoplay && !autoplayPaused

  const { activeTransition, clickTransition, autoTransition } = useEditorStore(
    useShallow(s => s.getPlaybackTransitions())
  )

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

  const playAudioSafe = (audioEl: HTMLAudioElement) => {
    audioEl.play().catch(err => {
      console.warn('Audio playback blocked or failed:', err)
    })
  }

  const adjustBgMusicVolume = useCallback((duck: boolean) => {
    const bgAudio = bgMusicRef.current
    const musicConfig = playbackSettings.backgroundMusic
    if (!bgAudio || !musicConfig) return

    const targetVolume = duck && playbackSettings.duckBackgroundMusic
      ? musicConfig.volume * 0.2
      : musicConfig.volume

    const steps = 10
    const stepTime = 30
    const currentVolume = bgAudio.volume
    const diff = targetVolume - currentVolume
    
    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      bgAudio.volume = currentVolume + (diff * (currentStep / steps))
      if (currentStep >= steps) {
        bgAudio.volume = targetVolume
        clearInterval(interval)
      }
    }, stepTime)
  }, [playbackSettings.backgroundMusic, playbackSettings.duckBackgroundMusic])

  useEffect(() => {
    if (!isPresenting) return

    if (slideAudioRef.current) {
      slideAudioRef.current.pause()
      slideAudioRef.current = null
    }
    if (slideAudioIntervalRef.current) {
      clearInterval(slideAudioIntervalRef.current)
      slideAudioIntervalRef.current = null
    }

    let slideAudioPlaying = false

    if (slide?.audio) {
      const audioConfig = slide.audio
      const audioEl = new Audio(audioConfig.url)
      audioEl.volume = audioConfig.volume
      audioEl.playbackRate = audioConfig.playbackRate
      audioEl.currentTime = audioConfig.trimStart
      
      slideAudioRef.current = audioEl
      playAudioSafe(audioEl)
      slideAudioPlaying = true

      slideAudioIntervalRef.current = setInterval(() => {
        if (!audioEl) return
        if (audioEl.currentTime >= audioConfig.trimEnd) {
          if (audioConfig.loop) {
            audioEl.currentTime = audioConfig.trimStart
          } else {
            audioEl.pause()
            slideAudioPlaying = false
            adjustBgMusicVolume(false)
          }
        }
      }, 50)
    }

    adjustBgMusicVolume(slideAudioPlaying)

    return () => {
      if (slideAudioRef.current) {
        slideAudioRef.current.pause()
      }
      if (slideAudioIntervalRef.current) {
        clearInterval(slideAudioIntervalRef.current)
      }
    }
  }, [activeSlideIndex, isPresenting, slide?.audio, adjustBgMusicVolume])

  useEffect(() => {
    if (!isPresenting || !playbackSettings.backgroundMusic) {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause()
        bgMusicRef.current = null
      }
      if (bgMusicIntervalRef.current) {
        clearInterval(bgMusicIntervalRef.current)
        bgMusicIntervalRef.current = null
      }
      return
    }

    const musicConfig = playbackSettings.backgroundMusic
    const audioEl = new Audio(musicConfig.url)
    audioEl.volume = musicConfig.volume
    audioEl.playbackRate = musicConfig.playbackRate
    audioEl.currentTime = musicConfig.trimStart
    
    bgMusicRef.current = audioEl
    playAudioSafe(audioEl)

    bgMusicIntervalRef.current = setInterval(() => {
      if (!audioEl) return
      if (audioEl.currentTime >= musicConfig.trimEnd) {
        if (musicConfig.loop) {
          audioEl.currentTime = musicConfig.trimStart
        } else {
          audioEl.pause()
        }
      }
    }, 100)

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause()
        bgMusicRef.current = null
      }
      if (bgMusicIntervalRef.current) {
        clearInterval(bgMusicIntervalRef.current)
        bgMusicIntervalRef.current = null
      }
    }
  }, [isPresenting, playbackSettings.backgroundMusic])

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

  const entranceDuration = activeTransition?.duration ?? playbackSettings.transitionDuration
  
  const configuredSlideDuration = autoTransition
    ? (autoTransition.autoDelay ?? 0)
    : playbackSettings.autoplayDelay

  const activeAudioDurationMs = slide?.audio
    ? ((slide.audio.trimEnd - slide.audio.trimStart) / slide.audio.playbackRate) * 1000
    : 0

  const resolvedSlideDuration = Math.max(configuredSlideDuration, activeAudioDurationMs)
  const autoplayDelay = resolvedSlideDuration + entranceDuration

  const shouldAutoplay = isPresenting && (
    !!autoTransition ||
    (isAutoplayActive && !clickTransition)
  )

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

  const onExitFullscreen = useCallback(() => {
    useEditorStore.getState().stopPresentation()
  }, [])
  useFullscreen(isPresenting, onExitFullscreen)

  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const { width: canvasW, height: canvasH } = useMemo(() => {
    return getCanvasDimensions(playbackSettings.aspectRatio)
  }, [playbackSettings.aspectRatio])

  useLayoutEffect(() => {
    if (!isPresenting || previousSlideIndex === null) return

    const durationMs = activeTransition?.duration ?? playbackSettings.transitionDuration
    const timer = setTimeout(() => {
      useEditorStore.setState({ previousSlideIndex: null })
    }, durationMs + 50)

    return () => clearTimeout(timer)
  }, [activeSlideIndex, previousSlideIndex, isPresenting, activeTransition, playbackSettings.transitionDuration])

  useLayoutEffect(() => {
    if (!isPresenting) return
    const el = containerRef.current
    if (!el) return

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el
      setScale(Math.min(w / canvasW, h / canvasH))
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [isPresenting, canvasW, canvasH])

  if (!isPresenting || !slide) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-(--z-overlay) bg-black"
      onMouseMove={showControls}
      onClick={handleNext}
      style={{ cursor: controlsVisible ? 'default' : 'none' }}
    >
      <div
        data-canvas-board
        className="absolute overflow-hidden"
        style={{
          left: '50%',
          top: '50%',
          width: canvasW,
          height: canvasH,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
          backgroundColor: (slide.background || '#0a0a0a').startsWith('url') ? 'transparent' : (slide.background || '#0a0a0a'),
          backgroundImage: (slide.background || '#0a0a0a').startsWith('url') ? slide.background : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <MotionStage
          mode="presentation"
          slide={slide}
          previousSlide={previousSlide}
          settings={playbackSettings}
          activeTransition={activeTransition}
        />
        <CaptionOverlay 
          captions={project?.captions}
          currentTime={currentTime}
          className="absolute bottom-6 left-0 right-0 flex justify-center px-8 pointer-events-none"
        />
      </div>

      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{ opacity: controlsVisible ? 1 : 0 }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); stopPresentation() }}
          className="pointer-events-auto absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 border border-white/10 transition cursor-pointer backdrop-blur-sm"
        >
          <X size={18} />
        </button>
        <div onClick={(e) => e.stopPropagation()}>
          <PresentationControls
            slideIndex={activeSlideIndex}
            totalSlides={totalSlides}
            playbackSettings={playbackSettings}
            autoplayPaused={autoplayPaused}
            slides={project?.slides || []}
            onPrev={handlePrev}
            onNext={handleNext}
            onToggleAutoplay={() => setAutoplayPaused(!autoplayPaused)}
            onJumpToSlide={setActiveSlide}
          />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden z-(--z-toast)">
        <div
          className="h-full bg-blue-500 transition duration-300 ease-out"
          style={{ width: `${((activeSlideIndex + 1) / totalSlides) * 100}%` }}
        />
      </div>
    </div>
  )
}
