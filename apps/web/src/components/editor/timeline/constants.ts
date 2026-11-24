import type { TransitionAnimation } from '@motionslides/shared'

export const DEFAULT_PX_PER_SEC = 80
export const PX_PER_SEC = DEFAULT_PX_PER_SEC
export const MIN_PX_PER_SEC = 24
export const MAX_PX_PER_SEC = 200
export const TRACK_HEADER_W = 152

export const WAVE_PATTERN = [
  3, 7, 12, 18, 14, 9, 20, 15, 6, 22, 17, 10, 25, 19, 8, 23, 14, 11, 18, 6, 21, 13, 7, 24, 16,
]

export const RULER_H = 28
export const SLIDE_TRACK_H = 74
export const CAPTION_TRACK_H = 44
export const VO_TRACK_H = 48
export const BGM_TRACK_H = 48

export const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5] as const

export const AUDIO_TYPE_BGM = 'bgm' as const
export const AUDIO_TYPE_VOICEOVER = 'voiceover' as const
export const AUDIO_DRAWER_VO = 'vo' as const
export const AUDIO_DRAWER_BGM = 'bgm' as const

export const BGM_LABEL = 'Background Music'
export const VO_LABEL_PREFIX = 'Voiceover – Slide'
export const VO_ADD_LABEL = 'Add Voiceover'
export const BGM_SUBTITLE = 'Plays across all slides'

export const BGM_ACCENT_COLOR = 'var(--ms-tl-bgm-accent)'
export const VO_ACCENT_COLOR = 'var(--ms-tl-vo-accent)'

export const TRANSITION_LABELS: Record<TransitionAnimation, string> = {
  'magic-move': 'Morph',
  fade: 'Fade',
  'slide-left': 'Slide L',
  'slide-right': 'Slide R',
  'slide-up': 'Slide U',
  'slide-down': 'Slide D',
  zoom: 'Zoom',
  flip: 'Flip',
}

/** Formats seconds into a fixed-width `MM:SS.d` timecode string. */
export function formatTime(time: number): string {
  const safe = Math.max(0, Number.isFinite(time) ? time : 0)
  const mins = Math.floor(safe / 60)
  const secs = Math.floor(safe % 60)
  const ms = Math.floor((safe % 1) * 10)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`
}

/** Formats whole-second timeline ruler marks cleanly across short and multi-minute decks. */
export function formatRulerTick(sec: number): string {
  const safe = Math.max(0, Math.round(sec))
  if (safe < 60) return `${safe}s`
  const mins = Math.floor(safe / 60)
  const rem = safe % 60
  return `${mins}:${String(rem).padStart(2, '0')}`
}

/** Returns adaptive major and minor tick spacing (in seconds) for the active zoom level. */
export function getRulerIntervals(pxPerSec: number): { majorSec: number; minorSec: number } {
  if (pxPerSec >= 130) return { majorSec: 1, minorSec: 0.25 }
  if (pxPerSec >= 70) return { majorSec: 2, minorSec: 0.5 }
  if (pxPerSec >= 40) return { majorSec: 5, minorSec: 1 }
  return { majorSec: 10, minorSec: 2 }
}

/** Calculates a clamped px/sec zoom level that fits `totalDuration` inside `viewportWidth`. */
export function computeFitPxPerSec(totalDuration: number, viewportWidth: number): number {
  const usableWidth = Math.max(200, viewportWidth) - 32
  const raw = usableWidth / Math.max(totalDuration, 1)
  return Math.round(Math.min(MAX_PX_PER_SEC, Math.max(MIN_PX_PER_SEC, raw)))
}

/**
 * Resolves `var(--token)` references using computed DOM styles so HTML5 Canvas 2D
 * `fillStyle` receives concrete color strings instead of falling back to `#000000`.
 */
export function resolveCanvasColor(
  el: HTMLElement | null,
  color: string,
  fallback = 'rgba(255, 255, 255, 0.35)',
): string {
  const trimmed = color.trim()
  if (!trimmed.startsWith('var(') || !trimmed.endsWith(')')) {
    return trimmed || fallback
  }
  const inner = trimmed.slice(4, -1).trim()
  const commaIdx = inner.indexOf(',')
  const varName = (commaIdx === -1 ? inner : inner.slice(0, commaIdx)).trim()
  const inlineFallback = commaIdx === -1 ? '' : inner.slice(commaIdx + 1).trim()

  if (el && typeof window !== 'undefined' && varName.startsWith('--')) {
    const resolved = window.getComputedStyle(el).getPropertyValue(varName).trim()
    if (resolved) return resolved
  }
  return inlineFallback || fallback
}
