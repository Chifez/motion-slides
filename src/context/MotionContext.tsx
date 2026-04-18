/**
 * MotionContext — Passes resolved transition settings AND identity tracking
 * from PresentationOverlay down to CanvasElement and its children.
 *
 * During editing mode, this context is NOT provided (elements use defaults).
 * During presentation mode, PresentationOverlay wraps the canvas and provides:
 *   - The user's chosen duration & easing (or per-transition overrides)
 *   - Which element IDs are "continuing" (Magic Move) vs "new" (staggered build-in)
 *   - The transition animation direction (slide-left, zoom, fade, etc.)
 */

import { createContext, useContext, useMemo } from 'react'
import type { Transition } from 'framer-motion'
import type { PlaybackSettings, Slide, SlideTransition, TransitionAnimation } from '@/types'
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
  /**
   * The transition animation style from the prototype SlideTransition.
   * Drives enter/exit direction for new/removed elements.
   * Defaults to 'fade' when no prototype transition is defined.
   */
  transitionAnimation: TransitionAnimation
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
  transitionAnimation: 'fade',
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
  /**
   * Optional per-transition override from prototype mode.
   * When provided, its duration/ease/animation take precedence over global settings.
   */
  activeTransition?: SlideTransition | null
  children: React.ReactNode
}

export function MotionProvider({ settings, previousSlide, currentSlide, activeTransition, children }: ProviderProps) {
  const value = useMemo<MotionContextValue>(() => {
    // Per-transition settings override global playback settings when defined
    const durationMs = activeTransition?.duration ?? settings.transitionDuration
    const easeBezier = activeTransition?.ease ?? settings.transitionEase

    const transition = buildTransition({ ...settings, transitionDuration: durationMs, transitionEase: easeBezier })
    const durationSec = msToSec(durationMs)
    const ease = cubicBezierToArray(easeBezier)
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
      transitionAnimation: activeTransition?.animation ?? 'fade',
    }
  }, [
    settings.transitionDuration,
    settings.transitionEase.x1, settings.transitionEase.y1,
    settings.transitionEase.x2, settings.transitionEase.y2,
    activeTransition,
    previousSlide, currentSlide,
  ])

  return <MotionCtx value={value}>{children}</MotionCtx>
}
