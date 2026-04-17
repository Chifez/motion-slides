// ─────────────────────────────────────────────
// Export & Playback Settings Constants
// ─────────────────────────────────────────────

import type { PlaybackSettings } from '@/types'

/** Available export resolutions */
export const EXPORT_RESOLUTIONS = [
  { width: 1280, height: 720, label: '720p (HD)' },
  { width: 1920, height: 1080, label: '1080p (Full HD)' },
  { width: 2560, height: 1440, label: '1440p (2K)' },
  { width: 3840, height: 2160, label: '2160p (4K)' },
] as const

/** Video export bitrate (bits per second) */
export const EXPORT_BITRATE = 8_000_000

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

/** Transition easing presets */
export const TRANSITION_EASE_OPTIONS = [
  { value: 'spring', label: 'Spring' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'linear', label: 'Linear' },
] as const

/** Default playback settings */
export const DEFAULT_PLAYBACK_SETTINGS: PlaybackSettings = {
  autoplay: false,
  autoplayDelay: 3000,
  loop: true,
  transitionDuration: 500,
  transitionEase: 'ease-out',
  exportResolution: { ...EXPORT_RESOLUTIONS[0] },
}
