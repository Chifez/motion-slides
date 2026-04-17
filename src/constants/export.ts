// ─────────────────────────────────────────────
// Export & Playback Settings Constants
// ─────────────────────────────────────────────

import type { PlaybackSettings, CubicBezier } from '@/types'

/** Supported aspect ratio keys */
export type AspectRatioKey = '16:9' | '9:16' | '1:1' | '4:3'

/** Aspect ratio presets with labels */
export const ASPECT_RATIO_OPTIONS: { value: AspectRatioKey; label: string }[] = [
  { value: '16:9', label: 'Widescreen (16:9)' },
  { value: '9:16', label: 'Vertical (9:16)' },
  { value: '1:1', label: 'Square (1:1)' },
  { value: '4:3', label: 'Traditional (4:3)' },
]

/** Available export resolutions grouped by aspect ratio */
export const EXPORT_RESOLUTIONS: Record<
  AspectRatioKey,
  readonly { width: number; height: number; label: string }[]
> = {
  '16:9': [
    { width: 1280, height: 720, label: '720p (HD)' },
    { width: 1920, height: 1080, label: '1080p (Full HD)' },
    { width: 2560, height: 1440, label: '1440p (2K)' },
    { width: 3840, height: 2160, label: '2160p (4K)' },
  ],
  '9:16': [
    { width: 720, height: 1280, label: '720×1280 (HD)' },
    { width: 1080, height: 1920, label: '1080×1920 (Full HD)' },
  ],
  '1:1': [
    { width: 720, height: 720, label: '720×720 (HD)' },
    { width: 1080, height: 1080, label: '1080×1080 (Full HD)' },
  ],
  '4:3': [
    { width: 960, height: 720, label: '960×720 (SD)' },
    { width: 1440, height: 1080, label: '1440×1080 (HD)' },
    { width: 1920, height: 1440, label: '1920×1440 (Full HD)' },
  ],
}

/** Video export bitrate (bits per second) */
export const EXPORT_BITRATE = 20_000_000

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
  exportResolution: { ...EXPORT_RESOLUTIONS['16:9'][0] },
}
