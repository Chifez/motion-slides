import { useMemo, useCallback } from 'react'
import type { SlideWithTiming } from '@/components/editor/timeline/types'

interface Params {
  slides: any[]
  transitions: any[]
  playbackSettings: any
  activeSlideIndex: number
  isPlaying: boolean
  currentTime: number
}

interface Result {
  slidesWithTiming: SlideWithTiming[]
  totalDuration: number
  getSlideIndexAtTime: (time: number) => number
  liveSlideIndex: number
  liveSlide: any
  livePrevSlide: any
}

/**
 * Computes all timing-derived values for the timeline:
 * - per-slide start/end/duration map
 * - totalDuration
 * - live slide selection during playback
 */
export function useTimelineTiming({
  slides,
  transitions,
  playbackSettings,
  activeSlideIndex,
  isPlaying,
  currentTime,
}: Params): Result {
  const slidesWithTiming = useMemo<SlideWithTiming[]>(() => {
    let current = 0
    return slides.map((s, idx) => {
      const hasTransition = idx > 0
      const transitionDuration = hasTransition ? (playbackSettings.transitionDuration ?? 500) : 0
      const transitionObj = transitions.find(
        (t: any) => t.fromSlideId === s.id && t.trigger === 'auto',
      )
      const configuredSlideDuration = transitionObj
        ? (transitionObj.autoDelay ?? 3000)
        : (playbackSettings.autoplayDelay ?? 3000)
      const activeAudioDurationMs = s.audio
        ? ((s.audio.trimEnd - s.audio.trimStart) / s.audio.playbackRate) * 1000
        : 0
      const durationMs = Math.max(configuredSlideDuration, activeAudioDurationMs)
      const durationSec = durationMs / 1000
      const start = current
      const end = current + durationSec
      current = end
      return {
        slide: s,
        index: idx,
        start,
        end,
        duration: durationSec,
        transitionDuration: transitionDuration / 1000,
      }
    })
  }, [slides, transitions, playbackSettings])

  const totalDuration = useMemo(() => {
    if (slidesWithTiming.length === 0) return 0
    return slidesWithTiming[slidesWithTiming.length - 1].end
  }, [slidesWithTiming])

  const getSlideIndexAtTime = useCallback(
    (time: number) => {
      const found = slidesWithTiming.find(s => time >= s.start && time < s.end)
      if (found) return found.index
      if (time >= totalDuration) return Math.max(0, slides.length - 1)
      return 0
    },
    [slidesWithTiming, totalDuration, slides.length],
  )

  // Derive live slide index synchronously — no effect delay
  const liveSlideIndex = useMemo(
    () => (isPlaying ? getSlideIndexAtTime(currentTime) : activeSlideIndex),
    [isPlaying, currentTime, getSlideIndexAtTime, activeSlideIndex],
  )

  const liveSlide = slides[liveSlideIndex] ?? null
  const livePrevSlide = liveSlideIndex > 0 ? (slides[liveSlideIndex - 1] ?? null) : null

  return { slidesWithTiming, totalDuration, getSlideIndexAtTime, liveSlideIndex, liveSlide, livePrevSlide }
}
