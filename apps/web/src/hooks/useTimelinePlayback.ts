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

    if (musicConfig) {
      if (!bgMusicAudioRef.current) {
        bgMusicAudioRef.current = new Audio(musicConfig.url)
        bgMusicAudioRef.current.loop = musicConfig.loop
      }
      const bgAudio = bgMusicAudioRef.current
      bgAudio.playbackRate = musicConfig.playbackRate
      
      if (isPlaying || forcePlay) {
        const bgRelativeTime = musicConfig.trimStart + (time * musicConfig.playbackRate)
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

    const getSlideIndexAtTime = getSlideIndexAtTimeRef.current
    const slidesWithTiming = slidesWithTimingRef.current
    const activeIdx = getSlideIndexAtTime(time)
    setActiveSlide(activeIdx)

    const currentSlideTiming = slidesWithTiming[activeIdx]
    const slideAudioConfig = currentSlideTiming?.slide?.audio

    if (slideAudioConfig) {
      const relativeOffset = time - currentSlideTiming.start
      const audioRelativeTime = slideAudioConfig.trimStart + (relativeOffset * slideAudioConfig.playbackRate)
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

  const syncAudioRef = useRef(syncAudio)
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

      if (playheadRef.current) {
        playheadRef.current.style.left = `${nextTime * PX_PER_SEC}px`
      }
      if (timecodeRef.current) {
        timecodeRef.current.innerText = formatTime(nextTime)
      }

      if (timelineBodyRef.current) {
        const playheadX = nextTime * PX_PER_SEC
        const container = timelineBodyRef.current
        const halfW = container.clientWidth / 2
        if (playheadX > container.scrollLeft + halfW) {
          container.scrollLeft = playheadX - halfW
        }
      }

      const getSlideIndexAtTime = getSlideIndexAtTimeRef.current
      const prevIdx = getSlideIndexAtTime(prevTime)
      const nextIdx = getSlideIndexAtTime(nextTime)

      const captions = project?.captions ?? []
      const activeCaptionPrev = captions.find(c => prevTime >= c.start && prevTime <= c.end)
      const activeCaptionNext = captions.find(c => nextTime >= c.start && nextTime <= c.end)
      const captionChanged = activeCaptionPrev?.id !== activeCaptionNext?.id

      if (nextIdx !== prevIdx || didLoopOrEnd || captionChanged) {
        syncAudio(nextTime, true)
        setCurrentTimeState(nextTime)
      } else {
        frameCountRef.current++
        if (frameCountRef.current % 10 === 0) {
          syncAudio(nextTime)
        }
      }
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animatePlayback)
  }

  const setCurrentTime = useCallback((v: number | ((prev: number) => number)) => {
    const nextVal = typeof v === 'function' ? v(currentTimeRef.current) : v
    currentTimeRef.current = nextVal

    if (playheadRef.current) {
      playheadRef.current.style.left = `${nextVal * PX_PER_SEC}px`
    }
    if (timecodeRef.current) {
      timecodeRef.current.innerText = formatTime(nextVal)
    }

    syncAudioRef.current(nextVal, true)
    setCurrentTimeState(nextVal)
  }, [])

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
      
      setCurrentTimeState(currentTimeRef.current)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [isPlaying])

  useEffect(() => {
    syncAudio(currentTimeRef.current)
  }, [isPlaying, playbackSettings.backgroundMusic, project])

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
