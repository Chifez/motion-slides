import { useState, useEffect, useRef, useCallback } from 'react'
import type { PlaybackSettings, Project } from '@motionslides/shared'
import { PX_PER_SEC } from '@/components/editor/timeline/constants'
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
  const [currentTime, setCurrentTime] = useState(0)

  const bgMusicAudioRef = useRef<HTMLAudioElement | null>(null)
  const slideAudioRef = useRef<HTMLAudioElement | null>(null)
  const activeSlideAudioIdRef = useRef<string | null>(null)
  const requestRef = useRef<number | null>(null)
  const previousTimeRef = useRef<number | null>(null)
  const timelineBodyRef = useRef<HTMLDivElement>(null!)

  // Keep stable refs for playbackSettings values used inside the rAF closure
  const playbackSettingsRef = useRef(playbackSettings)
  useEffect(() => { playbackSettingsRef.current = playbackSettings })

  // ── Ducking helper ──────────────────────────────────────────────────────────
  const syncDucking = useCallback((isDuckTarget: boolean) => {
    const bgAudio = bgMusicAudioRef.current
    const musicConfig = playbackSettingsRef.current.backgroundMusic
    if (!bgAudio || !musicConfig) return
    bgAudio.volume =
      isDuckTarget && playbackSettingsRef.current.duckBackgroundMusic !== false
        ? musicConfig.volume * 0.2
        : musicConfig.volume
  }, [])

  // ── rAF loop ────────────────────────────────────────────────────────────────
  const animatePlayback = useCallback((time: number) => {
    if (previousTimeRef.current !== null) {
      const delta = (time - previousTimeRef.current) / 1000
      const totalDuration = totalDurationRef.current
      const ps = playbackSettingsRef.current
      setCurrentTime(prevTime => {
        let nextTime = prevTime + delta
        if (nextTime >= totalDuration) {
          if (ps.loop) {
            nextTime = 0
            if (timelineBodyRef.current) timelineBodyRef.current.scrollLeft = 0
            if (bgMusicAudioRef.current && ps.backgroundMusic) {
              bgMusicAudioRef.current.currentTime = ps.backgroundMusic.trimStart
            }
          } else {
            setIsPlaying(false)
            return 0
          }
        }
        return nextTime
      })
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animatePlayback)
  }, [totalDurationRef])

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
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [isPlaying, animatePlayback])

  // ── Audio sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!project) return
    const musicConfig = playbackSettings.backgroundMusic
    if (musicConfig) {
      if (!bgMusicAudioRef.current) {
        bgMusicAudioRef.current = new Audio(musicConfig.url)
        bgMusicAudioRef.current.loop = musicConfig.loop
      }
      const bgAudio = bgMusicAudioRef.current
      bgAudio.playbackRate = musicConfig.playbackRate
      if (isPlaying) {
        const bgRelativeTime = musicConfig.trimStart + currentTime
        if (bgRelativeTime <= musicConfig.trimEnd) {
          if (bgAudio.paused) {
            bgAudio.currentTime = bgRelativeTime
            bgAudio.play().catch(() => {})
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

    const getSlideIndexAtTime = getSlideIndexAtTimeRef.current
    const slidesWithTiming = slidesWithTimingRef.current
    const activeIdx = getSlideIndexAtTime(currentTime)
    setActiveSlide(activeIdx)

    const currentSlideTiming = slidesWithTiming[activeIdx]
    const slideAudioConfig = currentSlideTiming?.slide?.audio

    if (slideAudioConfig) {
      const relativeOffset = currentTime - currentSlideTiming.start
      const audioRelativeTime = slideAudioConfig.trimStart + relativeOffset
      if (
        isPlaying &&
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
          slideAudio.play().catch(() => {})
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

    if (!isPlaying) {
      slideAudioRef.current?.pause()
      bgMusicAudioRef.current?.pause()
    }
  }, [
    isPlaying,
    currentTime,
    slidesWithTimingRef,
    getSlideIndexAtTimeRef,
    playbackSettings.backgroundMusic,
    setActiveSlide,
    project,
    syncDucking,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      bgMusicAudioRef.current?.pause()
      slideAudioRef.current?.pause()
    }
  }, [])

  // ── Scroll playhead into view ───────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !timelineBodyRef.current) return
    const playheadX = currentTime * PX_PER_SEC
    const container = timelineBodyRef.current
    const halfW = container.clientWidth / 2
    if (playheadX > container.scrollLeft + halfW) {
      container.scrollLeft = playheadX - halfW
    }
  }, [currentTime, isPlaying])

  return { isPlaying, setIsPlaying, currentTime, setCurrentTime, timelineBodyRef }
}
