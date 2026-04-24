import type { AspectRatioKey } from './types'

// ─────────────────────────────────────────────
// Canvas Dimensions & Layout Constants
// ─────────────────────────────────────────────

/** Base canvas width in logical pixels (16:9 aspect ratio) */
export const CANVAS_WIDTH = 1280

/** Base canvas height in logical pixels (16:9 aspect ratio) */
export const CANVAS_HEIGHT = 720

/** Padding around the canvas inside the stage container */
export const CANVAS_PADDING = 64

/** Canvas aspect ratio */
export const CANVAS_ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT

/** Default canvas/slide background color */
export const CANVAS_BG = '#0a0a0a'

/** Stage (container behind canvas) background color */
export const STAGE_BG = '#111111'

/** Elevated z-index for selected elements */
export const SELECTED_Z_INDEX = 100

/** Bounding box z-index */
export const BOUNDING_BOX_Z_INDEX = 200

// ─────────────────────────────────────────────
// Dynamic Canvas Dimensions by Aspect Ratio
// ─────────────────────────────────────────────

export const CANVAS_DIMENSIONS: Record<AspectRatioKey, { width: number; height: number }> = {
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '1:1':  { width: 720, height: 720 },
  '4:3':  { width: 960, height: 720 },
}

/**
 * Returns the logical canvas dimensions for a given aspect ratio.
 */
export function getCanvasDimensions(ratio: AspectRatioKey): { width: number; height: number } {
  return CANVAS_DIMENSIONS[ratio] ?? CANVAS_DIMENSIONS['16:9']
}

// ─────────────────────────────────────────────
// Export & Playback Presets
// ─────────────────────────────────────────────

export const ASPECT_RATIO_OPTIONS: { value: AspectRatioKey; label: string }[] = [
  { value: '16:9', label: 'Widescreen (16:9)' },
  { value: '9:16', label: 'Vertical (9:16)' },
  { value: '1:1', label: 'Square (1:1)' },
  { value: '4:3', label: 'Traditional (4:3)' },
]

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
