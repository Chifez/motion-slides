import { useState, useEffect, useRef, useCallback } from 'react'
import type { PlaybackSettings, Project } from '@motionslides/shared'
import { PX_PER_SEC, formatTime } from '@/components/editor/timeline/constants'
import type { SlideWithTiming } from '@/components/editor/timeline/types'

interface Params {
  /** Updated each render via a ref so the rAF closure always reads the latest value */
  totalDurationRef: React.MutableRefObject<number>
  slidesWithTimingRef: React.MutableRefObject<SlideWithTiming[]>
  getSlideIndexAtTimeRef: React.MutableRefObject<(time: number) => number>
  playbackSettings: PlaybackSettings
  setActiveSlide: (idx: number) => void
  project: Project | null
}

interface Result {
  isPlaying: boolean
  setIsPlaying: (v: boolean) => void
  currentTime: number
  setCurrentTime: (v: number | ((prev: number) => number)) => void
  timelineBodyRef: React.RefObject<HTMLDivElement>
  playheadRef: React.RefObject<HTMLDivElement | null>
  timecodeRef: React.RefObject<HTMLSpanElement | null>
}

/**
 * Manages the entire playback engine.
 *
 * Timing values are passed as **refs** instead of direct params so that:
 * 1. The hook is called before useTimelineTiming (avoiding circular dependency)
 * 2. The rAF loop and all effects always read the *latest* computed values
 *    without needing to be recreated when timing changes.
 */
export function useTimelinePlayback({
  totalDurationRef,
  slidesWithTimingRef,
  getSlideIndexAtTimeRef,
  playbackSettings,
  setActiveSlide,
  project,
}: Params): Result {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTimeState] = useState(0)

  const currentTimeRef = useRef(0)
  const playheadRef = useRef<HTMLDivElement | null>(null)
  const timecodeRef = useRef<HTMLSpanElement | null>(null)

  const bgMusicAudioRef = useRef<HTMLAudioElement | null>(null)
  const slideAudioRef = useRef<HTMLAudioElement | null>(null)
  const activeSlideAudioIdRef = useRef<string | null>(null)
  const requestRef = useRef<number | null>(null)
  const previousTimeRef = useRef<number | null>(null)
  const timelineBodyRef = useRef<HTMLDivElement>(null!)

  const frameCountRef = useRef(0)

  const playbackSettingsRef = useRef(playbackSettings)
  useEffect(() => { playbackSettingsRef.current = playbackSettings })

  const syncDucking = (isDuckTarget: boolean) => {
    const bgAudio = bgMusicAudioRef.current
    const musicConfig = playbackSettingsRef.current.backgroundMusic
    if (!bgAudio || !musicConfig) return
    bgAudio.volume =
      isDuckTarget && playbackSettingsRef.current.duckBackgroundMusic !== false
        ? musicConfig.volume * 0.2
        : musicConfig.volume
  }

  const syncAudio = (time: number, forcePlay = false) => {
    if (!project) return
    const ps = playbackSettingsRef.current
    const musicConfig = ps.backgroundMusic

    // ─── Background Music Sync ──────────────────────────────────────────────
    if (musicConfig) {
      if (!bgMusicAudioRef.current) {
        bgMusicAudioRef.current = new Audio(musicConfig.url)
        bgMusicAudioRef.current.loop = musicConfig.loop
      }
      const bgAudio = bgMusicAudioRef.current
      bgAudio.playbackRate = musicConfig.playbackRate
      
      if (isPlaying || forcePlay) {
        const bgRelativeTime = musicConfig.trimStart + time
        if (bgRelativeTime <= musicConfig.trimEnd) {
          if (bgAudio.paused) {
            bgAudio.currentTime = bgRelativeTime
            bgAudio.play().catch(() => { })
          } else if (Math.abs(bgAudio.currentTime - bgRelativeTime) > 0.25) {
            bgAudio.currentTime = bgRelativeTime
          }
        } else {
          bgAudio.pause()
        }
      } else {
        bgAudio.pause()
      }
    } else {
      if (bgMusicAudioRef.current) {
        bgMusicAudioRef.current.pause()
        bgMusicAudioRef.current = null
      }
    }

    // ─── Slide Audio Sync ───────────────────────────────────────────────────
    const getSlideIndexAtTime = getSlideIndexAtTimeRef.current
    const slidesWithTiming = slidesWithTimingRef.current
    const activeIdx = getSlideIndexAtTime(time)
    setActiveSlide(activeIdx)

    const currentSlideTiming = slidesWithTiming[activeIdx]
    const slideAudioConfig = currentSlideTiming?.slide?.audio

    if (slideAudioConfig) {
      const relativeOffset = time - currentSlideTiming.start
      const audioRelativeTime = slideAudioConfig.trimStart + relativeOffset
      if (
        (isPlaying || forcePlay) &&
        audioRelativeTime >= slideAudioConfig.trimStart &&
        audioRelativeTime <= slideAudioConfig.trimEnd
      ) {
        if (!slideAudioRef.current || activeSlideAudioIdRef.current !== slideAudioConfig.id) {
          if (slideAudioRef.current) slideAudioRef.current.pause()
          slideAudioRef.current = new Audio(slideAudioConfig.url)
          activeSlideAudioIdRef.current = slideAudioConfig.id
        }
        const slideAudio = slideAudioRef.current
        slideAudio.volume = slideAudioConfig.volume
        slideAudio.playbackRate = slideAudioConfig.playbackRate
        if (slideAudio.paused) {
          slideAudio.currentTime = audioRelativeTime
          slideAudio.play().catch(() => { })
          syncDucking(true)
        } else if (Math.abs(slideAudio.currentTime - audioRelativeTime) > 0.25) {
          slideAudio.currentTime = audioRelativeTime
        }
      } else {
        if (slideAudioRef.current) {
          slideAudioRef.current.pause()
          slideAudioRef.current = null
          activeSlideAudioIdRef.current = null
          syncDucking(false)
        }
      }
    } else {
      if (slideAudioRef.current) {
        slideAudioRef.current.pause()
        slideAudioRef.current = null
        activeSlideAudioIdRef.current = null
        syncDucking(false)
      }
    }

    if (!isPlaying && !forcePlay) {
      slideAudioRef.current?.pause()
      bgMusicAudioRef.current?.pause()
    }
  }

  // Keep a ref to syncAudio so useCallback-wrapped setCurrentTime always calls
  // the latest version without needing syncAudio as a dependency.
  // Must be placed after syncAudio is declared to avoid 'used before declaration' errors.
  const syncAudioRef = useRef(syncAudio)
  // Update every render so the ref always holds the latest closure.
  syncAudioRef.current = syncAudio

  const animatePlayback = (time: number) => {
    if (previousTimeRef.current !== null) {
      const delta = (time - previousTimeRef.current) / 1000
      const totalDuration = totalDurationRef.current
      const ps = playbackSettingsRef.current

      let nextTime = currentTimeRef.current + delta
      let didLoopOrEnd = false

      if (nextTime >= totalDuration) {
        if (ps.loop) {
          nextTime = 0
          didLoopOrEnd = true
          if (timelineBodyRef.current) timelineBodyRef.current.scrollLeft = 0
          if (bgMusicAudioRef.current && ps.backgroundMusic) {
            bgMusicAudioRef.current.currentTime = ps.backgroundMusic.trimStart
          }
        } else {
          setIsPlaying(false)
          nextTime = 0
          didLoopOrEnd = true
        }
      }
      
      const prevTime = currentTimeRef.current
      currentTimeRef.current = nextTime

      // Update playhead DOM offset immediately
      if (playheadRef.current) {
        playheadRef.current.style.left = `${nextTime * PX_PER_SEC}px`
      }
      // Update timecode DOM text immediately
      if (timecodeRef.current) {
        timecodeRef.current.innerText = formatTime(nextTime)
      }

      // Auto-scroll timeline container if playhead goes past the middle
      if (timelineBodyRef.current) {
        const playheadX = nextTime * PX_PER_SEC
        const container = timelineBodyRef.current
        const halfW = container.clientWidth / 2
        if (playheadX > container.scrollLeft + halfW) {
          container.scrollLeft = playheadX - halfW
        }
      }

      // Check slide boundary crossing
      const getSlideIndexAtTime = getSlideIndexAtTimeRef.current
      const prevIdx = getSlideIndexAtTime(prevTime)
      const nextIdx = getSlideIndexAtTime(nextTime)

      if (nextIdx !== prevIdx || didLoopOrEnd) {
        // Sync audio immediately at the slide boundary
        syncAudio(nextTime, true)
        // Trigger React state update for slide transition
        setCurrentTimeState(nextTime)
      } else {
        // Routine throttled audio sync check (approx every 10 frames / 166ms)
        frameCountRef.current++
        if (frameCountRef.current % 10 === 0) {
          syncAudio(nextTime)
        }
      }
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animatePlayback)
  }

  // useCallback with empty deps: all mutation targets are refs; syncAudio is
  // accessed via syncAudioRef so it always calls the latest version.
  const setCurrentTime = useCallback((v: number | ((prev: number) => number)) => {
    const nextVal = typeof v === 'function' ? v(currentTimeRef.current) : v
    currentTimeRef.current = nextVal

    // Update DOM elements immediately
    if (playheadRef.current) {
      playheadRef.current.style.left = `${nextVal * PX_PER_SEC}px`
    }
    if (timecodeRef.current) {
      timecodeRef.current.innerText = formatTime(nextVal)
    }

    // Sync audio immediately on manual jumps/scrubs
    syncAudioRef.current(nextVal, true)

    // Always update React state for user-triggered scrubs/jumps
    setCurrentTimeState(nextVal)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Start / stop the rAF loop
  useEffect(() => {
    if (isPlaying) {
      previousTimeRef.current = null
      requestRef.current = requestAnimationFrame(animatePlayback)
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
        requestRef.current = null
      }
      bgMusicAudioRef.current?.pause()
      slideAudioRef.current?.pause()
      
      // Sync React state to match ref exactly when paused
      setCurrentTimeState(currentTimeRef.current)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [isPlaying])

  // Sync audio play/pause status when isPlaying, backgroundMusic, or project change
  useEffect(() => {
    syncAudio(currentTimeRef.current)
  }, [isPlaying, playbackSettings.backgroundMusic, project])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      bgMusicAudioRef.current?.pause()
      slideAudioRef.current?.pause()
    }
  }, [])

  return {
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    timelineBodyRef,
    playheadRef,
    timecodeRef,
  }
}
