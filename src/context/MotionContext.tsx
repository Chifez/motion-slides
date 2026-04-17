/**
 * MotionContext — Passes resolved transition settings from PresentationOverlay
 * down to CanvasElement and its children without prop drilling.
 *
 * During editing mode, this context is NOT provided (elements use defaults).
 * During presentation mode, PresentationOverlay wraps the canvas and provides
 * the user's chosen duration & easing.
 */

import { createContext, useContext, useMemo } from 'react'
import type { Transition } from 'framer-motion'
import type { PlaybackSettings } from '@/types'
import { buildTransition, cubicBezierToArray, msToSec } from '@/lib/motionEngine'
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
}

/** Default context when no provider is present (editor mode) */
const defaultValue: MotionContextValue = {
  isTransitioning: false,
  transition: {
    layout: { duration: LAYOUT_DURATION, ease: LAYOUT_EASE },
    opacity: { duration: 0.3, ease: 'easeOut' },
    default: { duration: LAYOUT_DURATION, ease: LAYOUT_EASE },
  },
  durationSec: LAYOUT_DURATION,
  ease: LAYOUT_EASE,
}

const MotionCtx = createContext<MotionContextValue>(defaultValue)

export function useMotionContext() {
  return useContext(MotionCtx)
}

interface ProviderProps {
  settings: PlaybackSettings
  children: React.ReactNode
}

export function MotionProvider({ settings, children }: ProviderProps) {
  const value = useMemo<MotionContextValue>(() => {
    const transition = buildTransition(settings)
    const durationSec = msToSec(settings.transitionDuration)
    const ease = cubicBezierToArray(settings.transitionEase)
    return { isTransitioning: true, transition, durationSec, ease }
  }, [settings.transitionDuration, settings.transitionEase.x1, settings.transitionEase.y1, settings.transitionEase.x2, settings.transitionEase.y2])

  return <MotionCtx value={value}>{children}</MotionCtx>
}
