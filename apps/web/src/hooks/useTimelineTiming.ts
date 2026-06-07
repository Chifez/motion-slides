import { useState, useEffect } from 'react'
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
  /**
   * The previous slide for transition rendering. This is set when the live
   * slide index changes and automatically cleared to null after the transition
   * duration elapses — exactly mirroring PresentationOverlay's lifecycle.
   */
  livePrevSlide: Slide | null
  /**
   * The resolved transition between livePrevSlide → liveSlide.
   * Null when there is no prototype transition defined for this pair.
   */
  liveActiveTransition: SlideTransition | null
}

/**
 * Computes all timing-derived values for the timeline:
 * - per-slide start/end/duration map
 * - totalDuration
 * - live slide selection during playback
 * - livePrevSlide with a self-clearing timer (mirrors PresentationOverlay)
 * - liveActiveTransition for the current slide pair
 */
export function useTimelineTiming({
  slides,
  transitions,
  playbackSettings,
  activeSlideIndex,
  isPlaying,
  currentTime,
}: Params): Result {
  // ─── Pure computation: slide timing layout ────────────────────────────────
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

  const totalDuration =
    slidesWithTiming.length === 0 ? 0 : slidesWithTiming[slidesWithTiming.length - 1].end

  const getSlideIndexAtTime = (time: number) => {
    const found = slidesWithTiming.find(s => time >= s.start && time < s.end)
    if (found) return found.index
    if (time >= totalDuration) return Math.max(0, slides.length - 1)
    return 0
  }

  // ─── Live slide index (synchronous — no effect delay) ─────────────────────
  const liveSlideIndex = isPlaying ? getSlideIndexAtTime(currentTime) : activeSlideIndex

  // ─── Transition pair lookup ───────────────────────────────────────────────
  // Resolve the prototype transition (if any) between the slide we're leaving
  // and the slide we're entering. Used by MotionStage/MotionProvider.
  const currentSlide = slides[liveSlideIndex] ?? null

  // ─── Self-clearing livePrevSlide ─────────────────────────────────────────
  // We derive the transitionState synchronously during the render pass when
  // liveSlideIndex changes. React will immediately re-run the render pass
  // with the updated state before paint, eliminating the one-frame mismatch.
  const [lastIndex, setLastIndex] = useState(liveSlideIndex)
  const [transitionState, setTransitionState] = useState<{
    prevSlide: Slide | null
    activeTransition: SlideTransition | null
    durationMs: number
  }>({ prevSlide: null, activeTransition: null, durationMs: 0 })

  if (liveSlideIndex !== lastIndex) {
    const prevSlide = slides[lastIndex] ?? null
    const nextSlide = slides[liveSlideIndex] ?? null
    const resolvedTransition = prevSlide && nextSlide
      ? (transitions.find(
          t => t.fromSlideId === prevSlide.id && t.toSlideId === nextSlide.id,
        ) ?? null)
      : null
    const durationMs = resolvedTransition?.duration ?? playbackSettings.transitionDuration ?? 500

    setLastIndex(liveSlideIndex)
    setTransitionState({
      prevSlide,
      activeTransition: resolvedTransition,
      durationMs,
    })
  }

  // After the transition is done, clear the previous slide so MotionStage
  // exits the "transitioning" state and renders the new slide at rest.
  useEffect(() => {
    if (!transitionState.prevSlide) return

    const timer = setTimeout(() => {
      setTransitionState({ prevSlide: null, activeTransition: null, durationMs: 0 })
    }, transitionState.durationMs + 50) // +50ms buffer matches PresentationOverlay

    return () => clearTimeout(timer)
  }, [transitionState.prevSlide, transitionState.durationMs])

  return {
    slidesWithTiming,
    totalDuration,
    getSlideIndexAtTime,
    liveSlideIndex,
    liveSlide: currentSlide,
    livePrevSlide: transitionState.prevSlide,
    liveActiveTransition: transitionState.activeTransition,
  }
}
