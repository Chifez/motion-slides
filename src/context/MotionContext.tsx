/**
 * MotionContext — Passes resolved transition settings AND identity tracking
 * from PresentationOverlay down to CanvasElement and its children.
 *
 * During editing mode, this context is NOT provided (elements use defaults).
 * During presentation mode, PresentationOverlay wraps the canvas and provides:
 *   - The user's chosen duration & easing
 *   - Which element IDs are "continuing" (Magic Move) vs "new" (staggered build-in)
 */

import { createContext, useContext, useMemo } from 'react'
import type { Transition } from 'framer-motion'
import type { PlaybackSettings, Slide } from '@/types'
import {
  buildTransition,
  cubicBezierToArray,
  msToSec,
  getContinuingIds,
  getNewElementIds,
  MAGIC_SPRING,
  BUILD_IN_SPRING,
  staggerDelay,
} from '@/lib/motionEngine'
import { LAYOUT_DURATION, LAYOUT_EASE } from '@/constants/animation'

export interface MotionContextValue {
  /** Whether we are currently in a slide transition (presentation mode) */
  isTransitioning: boolean
  /** The resolved framer-motion Transition object */
  transition: Transition
  /** Duration in seconds */
  durationSec: number
  /** Ease as [x1, y1, x2, y2] array */
  ease: [number, number, number, number]
  /** Spring transition for continuing elements (Magic Move) */
  magicSpring: typeof MAGIC_SPRING
  /** Spring transition for new element build-in */
  buildInSpring: typeof BUILD_IN_SPRING
  /** Element IDs that exist in both the previous and current slide */
  continuingIds: Set<string>
  /** Element IDs that are new in the current slide */
  newElementIds: Set<string>
  /** Total count of new elements (for stagger calculation) */
  newElementCount: number
  /** Get the stagger delay (in seconds) for a new element */
  getStaggerDelay: (staggerIndex: number) => number
}

/** Default context when no provider is present (editor mode) */
const EMPTY_SET = new Set<string>()
const defaultValue: MotionContextValue = {
  isTransitioning: false,
  transition: {
    layout: { duration: LAYOUT_DURATION, ease: LAYOUT_EASE },
    opacity: { duration: 0.3, ease: 'easeOut' },
    default: { duration: LAYOUT_DURATION, ease: LAYOUT_EASE },
  },
  durationSec: LAYOUT_DURATION,
  ease: LAYOUT_EASE,
  magicSpring: MAGIC_SPRING,
  buildInSpring: BUILD_IN_SPRING,
  continuingIds: EMPTY_SET,
  newElementIds: EMPTY_SET,
  newElementCount: 0,
  getStaggerDelay: () => 0,
}

const MotionCtx = createContext<MotionContextValue>(defaultValue)

export function useMotionContext() {
  return useContext(MotionCtx)
}

interface ProviderProps {
  settings: PlaybackSettings
  /** The slide we are transitioning FROM (null on first render) */
  previousSlide: Slide | null
  /** The slide we are transitioning TO */
  currentSlide: Slide | null
  children: React.ReactNode
}

export function MotionProvider({ settings, previousSlide, currentSlide, children }: ProviderProps) {
  const value = useMemo<MotionContextValue>(() => {
    const transition = buildTransition(settings)
    const durationSec = msToSec(settings.transitionDuration)
    const ease = cubicBezierToArray(settings.transitionEase)
    const continuing = getContinuingIds(previousSlide, currentSlide)
    const newIds = getNewElementIds(previousSlide, currentSlide)

    return {
      isTransitioning: true,
      transition,
      durationSec,
      ease,
      magicSpring: MAGIC_SPRING,
      buildInSpring: BUILD_IN_SPRING,
      continuingIds: continuing,
      newElementIds: newIds,
      newElementCount: newIds.size,
      getStaggerDelay: (staggerIndex: number) =>
        staggerDelay(staggerIndex, newIds.size, durationSec),
    }
  }, [
    settings.transitionDuration,
    settings.transitionEase.x1, settings.transitionEase.y1,
    settings.transitionEase.x2, settings.transitionEase.y2,
    previousSlide, currentSlide,
  ])

  return <MotionCtx value={value}>{children}</MotionCtx>
}
