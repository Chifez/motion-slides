/**
 * apps/web/src/constants/export.ts
 *
 * Re-exports common constants from @motionslides/shared to maintain
 * backward compatibility while centralizing business logic.
 */

export * from '@motionslides/shared'

import type { PlaybackSettings, CubicBezier } from '@motionslides/shared'
import { EXPORT_RESOLUTIONS } from '@motionslides/shared'

/** Video export bitrate (bits per second) */
export const EXPORT_BITRATE = 50_000_000

/** Preferred MIME type for video export */
export const EXPORT_MIME_TYPE_VP9 = 'video/webm;codecs=vp9'
export const EXPORT_MIME_TYPE_FALLBACK = 'video/webm'

/** Autoplay delay options (ms) */
export const AUTOPLAY_DELAY_OPTIONS = [
  { value: 2000, label: '2 seconds' },
  { value: 3000, label: '3 seconds' },
  { value: 5000, label: '5 seconds' },
  { value: 8000, label: '8 seconds' },
  { value: 10000, label: '10 seconds' },
] as const

/** Transition duration presets */
export const TRANSITION_DURATION_OPTIONS = [
  { value: 300, label: 'Fast (300ms)' },
  { value: 500, label: 'Default (500ms)' },
  { value: 800, label: 'Slow (800ms)' },
  { value: 1200, label: 'Cinematic (1.2s)' },
] as const

/** Bezier easing presets */
export interface BezierPreset {
  label: string
  value: CubicBezier
}

export const BEZIER_PRESETS: BezierPreset[] = [
  { label: 'Linear',      value: { x1: 0,    y1: 0,     x2: 1,    y2: 1    } },
  { label: 'Ease Out',    value: { x1: 0,    y1: 0,     x2: 0.58, y2: 1    } },
  { label: 'Ease In-Out', value: { x1: 0.42, y1: 0,     x2: 0.58, y2: 1    } },
  { label: 'Apple',       value: { x1: 0.25, y1: 0.1,   x2: 0.25, y2: 1    } },
  { label: 'Snappy',      value: { x1: 0.68, y1: -0.55, x2: 0.27, y2: 1.55 } },
  { label: 'Smooth',      value: { x1: 0.4,  y1: 0,     x2: 0.2,  y2: 1    } },
]

/** Default playback settings */
export const DEFAULT_PLAYBACK_SETTINGS: PlaybackSettings = {
  autoplay: false,
  autoplayDelay: 3000,
  loop: true,
  transitionDuration: 500,
  transitionEase: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 }, // Apple
  aspectRatio: '16:9',
  exportResolution: { ...EXPORT_RESOLUTIONS['16:9'][1] },
}
