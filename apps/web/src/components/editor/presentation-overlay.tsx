import { useState, useCallback, useRef, useLayoutEffect, useMemo, useEffect } from 'react'
import { X } from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'
import { useShallow } from 'zustand/react/shallow'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useAutoplay } from '@/hooks/use-autoplay'
import { useFullscreen } from '@/hooks/use-fullscreen'
import { useAutoHide } from '@/hooks/use-auto-hide'
import { getCanvasDimensions, type TimedCaption } from '@motionslides/shared'
import { normalizeTransitionDurationMs } from '@/lib/motion-engine'
import { MotionStage } from './motion-stage'
import { PresentationControls } from './presentation/presentation-controls'
import { usePermissions } from '@/context/permission-context'
import { CaptionOverlay } from './presentation/caption-overlay'
import {
  clampSlideElapsedTime,
  resolveNextPresentationSlide,
} from './presentation/presentation-utils'

function seekAudioWhenReady(audioEl: HTMLAudioElement, offsetSec: number) {
  const safeOffset = Math.max(0, offsetSec)
  if (audioEl.readyState >= 1) {
    audioEl.currentTime = safeOffset
    return
  }
  audioEl.addEventListener(
    'loadedmetadata',
    () => {
      audioEl.currentTime = safeOffset
    },
    { once: true },
  )
}

/**
 * Isolated caption clock component so its 50ms progress interval only re-renders
 * the caption banner instead of thrashing MotionStage and AnimatePresence exits.
 */
function PresentationCaptionStage({
  captions,
  slideStart,
  slideDurationSec,
  activeSlideIndex,
  isPresenting,
  autoplayPaused,
  controlsVisible,
}: {
  captions: TimedCaption[] | undefined
  slideStart: number
  slideDurationSec: number
  activeSlideIndex: number
  isPresenting: boolean
  autoplayPaused: boolean
  controlsVisible: boolean
}) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isPresenting || autoplayPaused) {
      if (!isPresenting) setElapsed(0)
      return
    }
    setElapsed(0)
    const startTime = Date.now()
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000)
    }, 50)
    return () => clearInterval(interval)
  }, [activeSlideIndex, isPresenting, autoplayPaused])

  const currentTime = slideStart + clampSlideElapsedTime(elapsed, slideDurationSec)

  return (
    <CaptionOverlay
      captions={captions}
      currentTime={currentTime}
      className={`absolute ${
        controlsVisible ? 'bottom-24' : 'bottom-8'
      } left-0 right-0 flex justify-center px-8 pointer-events-none transition-[bottom] duration-300`}
    />
  )
}

export function PresentationOverlay() {
  const isPresenting = useEditorStore(s => s.isPresenting)
  const activeSlideIndex = useEditorStore(s => s.activeSlideIndex)
  const previousSlideIndex = useEditorStore(s => s.previousSlideIndex)
  const playbackSettings = useEditorStore(s => s.playbackSettings)

  const stopPresentation = useEditorStore(s => s.stopPresentation)
  const setActiveSlide = useEditorStore(s => s.setActiveSlide)

  const project = useEditorStore(
    useShallow(s => s.projects.find(p => p.id === s.activeProjectId) ?? null),
  )

  const slide = project?.slides[activeSlideIndex] ?? null
  const previousSlide =
    previousSlideIndex !== null ? (project?.slides[previousSlideIndex] ?? null) : null
  const totalSlides = project?.slides.length ?? 0

  const [controlsVisible, showControls] = useAutoHide(isPresenting)
  const { autoplay: urlAutoplay } = usePermissions()
  const [autoplayPaused, setAutoplayPaused] = useState(false)
  const [stageEpoch, setStageEpoch] = useState(0)

  // Reset paused state and start from a clean stage epoch on launch
  useEffect(() => {
    if (isPresenting) {
      setAutoplayPaused(false)
      setStageEpoch(prev => prev + 1)
    }
  }, [isPresenting])

  // Compute slide starting times and durations in absolute seconds
  const slidesWithTiming = useMemo(() => {
    let current = 0
    return (project?.slides ?? []).map(s => {
      const transitionObj = project?.transitions?.find(
        t => t.fromSlideId === s.id && t.trigger === 'auto',
      )
      const configuredSlideDuration = transitionObj
        ? (transitionObj.autoDelay ?? playbackSettings.autoplayDelay ?? 3000)
        : (playbackSettings.autoplayDelay ?? 3000)
      const activeAudioDurationMs = s.audio
        ? ((s.audio.trimEnd - s.audio.trimStart) / s.audio.playbackRate) * 1000
        : 0
      const durationMs = Math.max(configuredSlideDuration, activeAudioDurationMs)
      const durationSec = durationMs / 1000
      const start = current
      const end = current + durationSec
      current = end
      return { start, duration: durationSec }
    })
  }, [project?.slides, project?.transitions, playbackSettings.autoplayDelay])

  const activeSlideTiming = slidesWithTiming[activeSlideIndex]
  const slideStart = activeSlideTiming?.start ?? 0
  const activeSlideDurationSec = activeSlideTiming?.duration ?? 3

  const slideAudioRef = useRef<HTMLAudioElement | null>(null)
  const bgMusicRef = useRef<HTMLAudioElement | null>(null)
  const bgMusicIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const slideAudioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bgFadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resolvedAutoplay = urlAutoplay !== null ? urlAutoplay : playbackSettings.autoplay
  const isAutoplayActive = resolvedAutoplay && !autoplayPaused

  const { activeTransition, clickTransition, autoTransition } = useEditorStore(
    useShallow(s => s.getPlaybackTransitions()),
  )

  const handleNext = useCallback(() => {
    const isLastSlide = activeSlideIndex >= totalSlides - 1
    if (isLastSlide) {
      if (playbackSettings.loop) {
        setStageEpoch(prev => prev + 1)
        setActiveSlide(0)
      }
      return
    }
    if (clickTransition) {
      const targetIndex =
        project?.slides.findIndex(s => s.id === clickTransition.toSlideId) ?? -1
      if (targetIndex !== -1) {
        setActiveSlide(targetIndex)
        return
      }
    }
    setActiveSlide(activeSlideIndex + 1)
  }, [
    clickTransition,
    project?.slides,
    activeSlideIndex,
    totalSlides,
    playbackSettings.loop,
    setActiveSlide,
  ])

  const handlePrev = useCallback(() => {
    if (activeSlideIndex > 0) setActiveSlide(activeSlideIndex - 1)
  }, [activeSlideIndex, setActiveSlide])

  const playAudioSafe = (audioEl: HTMLAudioElement) => {
    audioEl.play().catch(err => {
      console.warn('Audio playback blocked or failed:', err)
    })
  }

  const adjustBgMusicVolume = useCallback(
    (duck: boolean) => {
      const bgAudio = bgMusicRef.current
      const musicConfig = playbackSettings.backgroundMusic
      if (!bgAudio || !musicConfig) return

      if (bgFadeIntervalRef.current) {
        clearInterval(bgFadeIntervalRef.current)
        bgFadeIntervalRef.current = null
      }

      const targetVolume =
        duck && playbackSettings.duckBackgroundMusic !== false
          ? musicConfig.volume * 0.2
          : musicConfig.volume

      const steps = 10
      const stepTime = 30
      const currentVolume = bgAudio.volume
      const diff = targetVolume - currentVolume

      let currentStep = 0
      bgFadeIntervalRef.current = setInterval(() => {
        currentStep++
        bgAudio.volume = Math.max(0, Math.min(1, currentVolume + diff * (currentStep / steps)))
        if (currentStep >= steps) {
          bgAudio.volume = targetVolume
          if (bgFadeIntervalRef.current) {
            clearInterval(bgFadeIntervalRef.current)
            bgFadeIntervalRef.current = null
          }
        }
      }, stepTime)
    },
    [playbackSettings.backgroundMusic, playbackSettings.duckBackgroundMusic],
  )

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
      seekAudioWhenReady(audioEl, audioConfig.trimStart)

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
      if (bgFadeIntervalRef.current) {
        clearInterval(bgFadeIntervalRef.current)
        bgFadeIntervalRef.current = null
      }
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
    seekAudioWhenReady(audioEl, musicConfig.trimStart)

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
      if (bgFadeIntervalRef.current) {
        clearInterval(bgFadeIntervalRef.current)
        bgFadeIntervalRef.current = null
      }
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

  // Sync active audio playback when user pauses/unpauses presentation controls
  useEffect(() => {
    if (!isPresenting) return

    if (autoplayPaused) {
      slideAudioRef.current?.pause()
      bgMusicRef.current?.pause()
    } else {
      if (slideAudioRef.current && slideAudioRef.current.paused) {
        slideAudioRef.current.play().catch(() => {})
      }
      if (bgMusicRef.current && bgMusicRef.current.paused) {
        bgMusicRef.current.play().catch(() => {})
      }
    }
  }, [autoplayPaused, isPresenting])

  const onKey = useCallback(
    (e: KeyboardEvent) => {
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
    },
    [handleNext, handlePrev, stopPresentation, showControls],
  )

  useKeyboardShortcuts(isPresenting, onKey)

  const configuredSlideDuration = autoTransition
    ? (autoTransition.autoDelay ?? playbackSettings.autoplayDelay ?? 3000)
    : (playbackSettings.autoplayDelay ?? 3000)

  const activeAudioDurationMs = slide?.audio
    ? ((slide.audio.trimEnd - slide.audio.trimStart) / slide.audio.playbackRate) * 1000
    : 0

  const resolvedSlideDuration = Math.max(configuredSlideDuration, activeAudioDurationMs)
  const autoplayDelay = Math.max(200, resolvedSlideDuration)

  const shouldAutoplay =
    isPresenting && !autoplayPaused && (Boolean(autoTransition) || isAutoplayActive)

  useAutoplay(
    shouldAutoplay,
    autoplayDelay,
    () => {
      const { activeSlideIndex: idx } = useEditorStore.getState()
      const slidesList = project?.slides ?? []
      const autoIdx = autoTransition
        ? slidesList.findIndex(s => s.id === autoTransition.toSlideId)
        : null
      const clickIdx = clickTransition
        ? slidesList.findIndex(s => s.id === clickTransition.toSlideId)
        : null

      const decision = resolveNextPresentationSlide({
        activeSlideIndex: idx,
        totalSlides,
        loop: playbackSettings.loop,
        autoTransitionTargetIndex: autoIdx !== null && autoIdx !== -1 ? autoIdx : null,
        clickTransitionTargetIndex: clickIdx !== null && clickIdx !== -1 ? clickIdx : null,
      })

      if (decision.action === 'goto') {
        if (idx >= totalSlides - 1 && decision.index === 0) {
          setStageEpoch(prev => prev + 1)
        }
        setActiveSlide(decision.index)
      } else {
        setAutoplayPaused(true)
      }
    },
    [
      activeSlideIndex,
      isAutoplayActive,
      autoplayPaused,
      autoTransition,
      clickTransition,
      playbackSettings.loop,
      project?.slides,
      totalSlides,
    ],
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

    const durationMs = normalizeTransitionDurationMs(
      activeTransition?.duration,
      playbackSettings.transitionDuration,
    )
    const timer = setTimeout(() => {
      useEditorStore.setState({ previousSlideIndex: null })
    }, durationMs + 100)

    return () => clearTimeout(timer)
  }, [
    activeSlideIndex,
    previousSlideIndex,
    isPresenting,
    activeTransition,
    playbackSettings.transitionDuration,
  ])

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
      className="fixed inset-0 z-(--z-modal) bg-black"
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
          backgroundColor: (slide.background || '#0a0a0a').startsWith('url')
            ? 'transparent'
            : (slide.background || '#0a0a0a'),
          backgroundImage: (slide.background || '#0a0a0a').startsWith('url')
            ? slide.background
            : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <MotionStage
          key={stageEpoch}
          mode="presentation"
          slide={slide}
          previousSlide={activeTransition ? previousSlide : null}
          settings={playbackSettings}
          activeTransition={activeTransition}
        />
        <PresentationCaptionStage
          captions={project?.captions}
          slideStart={slideStart}
          slideDurationSec={activeSlideDurationSec}
          activeSlideIndex={activeSlideIndex}
          isPresenting={isPresenting}
          autoplayPaused={autoplayPaused}
          controlsVisible={controlsVisible}
        />
      </div>

      <div
        className="absolute inset-0 z-40 pointer-events-none transition-opacity duration-500"
        style={{ opacity: controlsVisible ? 1 : 0 }}
      >
        <button
          onClick={e => {
            e.stopPropagation()
            stopPresentation()
          }}
          className="pointer-events-auto absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 border border-white/10 transition cursor-pointer backdrop-blur-sm"
        >
          <X size={18} />
        </button>
        <div onClick={e => e.stopPropagation()}>
          <PresentationControls
            slideIndex={activeSlideIndex}
            totalSlides={totalSlides}
            playbackSettings={playbackSettings}
            autoplayEnabled={resolvedAutoplay || Boolean(autoTransition)}
            autoplayPaused={autoplayPaused}
            slides={project?.slides || []}
            onPrev={handlePrev}
            onNext={handleNext}
            onToggleAutoplay={() => {
              if (autoplayPaused && activeSlideIndex >= totalSlides - 1) {
                setStageEpoch(prev => prev + 1)
                setActiveSlide(0)
              }
              setAutoplayPaused(!autoplayPaused)
            }}
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
