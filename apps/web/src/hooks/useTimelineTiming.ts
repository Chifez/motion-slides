import type { Slide, SlideTransition, PlaybackSettings } from '@motionslides/shared'
import type { SlideWithTiming } from '@/components/editor/timeline/types'

interface Params {
  slides: Slide[]
  transitions: SlideTransition[]
  playbackSettings: PlaybackSettings
  activeSlideIndex: number
  isPlaying: boolean
  currentTime: number
}

interface Result {
  slidesWithTiming: SlideWithTiming[]
  totalDuration: number
  getSlideIndexAtTime: (time: number) => number
  liveSlideIndex: number
  liveSlide: Slide | null
  livePrevSlide: Slide | null
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
  let current = 0
  const slidesWithTiming: SlideWithTiming[] = slides.map((s, idx) => {
    const hasTransition = idx > 0
    const transitionDuration = hasTransition ? (playbackSettings.transitionDuration ?? 500) : 0
    const transitionObj = transitions.find(
      (t: SlideTransition) => t.fromSlideId === s.id && t.trigger === 'auto',
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

  const totalDuration = slidesWithTiming.length === 0 ? 0 : slidesWithTiming[slidesWithTiming.length - 1].end

  const getSlideIndexAtTime = (time: number) => {
    const found = slidesWithTiming.find(s => time >= s.start && time < s.end)
    if (found) return found.index
    if (time >= totalDuration) return Math.max(0, slides.length - 1)
    return 0
  }

  // Derive live slide index synchronously — no effect delay
  const liveSlideIndex = isPlaying ? getSlideIndexAtTime(currentTime) : activeSlideIndex

  const liveSlide = slides[liveSlideIndex] ?? null
  const livePrevSlide = liveSlideIndex > 0 ? (slides[liveSlideIndex - 1] ?? null) : null

  return { slidesWithTiming, totalDuration, getSlideIndexAtTime, liveSlideIndex, liveSlide, livePrevSlide }
}
