export interface NextSlideParams {
  activeSlideIndex: number
  totalSlides: number
  loop: boolean
  autoTransitionTargetIndex: number | null
  clickTransitionTargetIndex: number | null
}

export type NextSlideDecision =
  | { action: 'goto'; index: number }
  | { action: 'pause' }

/**
 * Resolves the next presentation slide across explicit `auto` transitions,
 * outgoing prototype `click` links, linear progression, and end-of-deck looping.
 */
export function resolveNextPresentationSlide({
  activeSlideIndex,
  totalSlides,
  loop,
  autoTransitionTargetIndex,
  clickTransitionTargetIndex,
}: NextSlideParams): NextSlideDecision {
  if (totalSlides <= 0) return { action: 'pause' }
  const isLastSlide = activeSlideIndex >= totalSlides - 1

  if (
    autoTransitionTargetIndex !== null &&
    autoTransitionTargetIndex >= 0 &&
    autoTransitionTargetIndex < totalSlides
  ) {
    if (isLastSlide && autoTransitionTargetIndex === 0 && !loop) {
      return { action: 'pause' }
    }
    return { action: 'goto', index: autoTransitionTargetIndex }
  }

  if (!isLastSlide) {
    if (
      clickTransitionTargetIndex !== null &&
      clickTransitionTargetIndex >= 0 &&
      clickTransitionTargetIndex < totalSlides
    ) {
      return { action: 'goto', index: clickTransitionTargetIndex }
    }
    return { action: 'goto', index: activeSlideIndex + 1 }
  }

  if (loop) {
    return { action: 'goto', index: 0 }
  }
  return { action: 'pause' }
}

/**
 * Keeps elapsed slide playback time strictly within the active slide window so caption
 * timing never overflows into the following slide when autoplay is paused or disabled.
 */
export function clampSlideElapsedTime(elapsed: number, slideDurationSec: number): number {
  if (!Number.isFinite(elapsed) || elapsed <= 0) return 0
  if (!Number.isFinite(slideDurationSec) || slideDurationSec <= 0) return 0
  return Math.min(elapsed, Math.max(0, slideDurationSec - 0.02))
}
