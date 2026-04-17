// ─────────────────────────────────────────────
// Canvas Dimensions & Layout Constants
// ─────────────────────────────────────────────

import type { AspectRatioKey } from '@/constants/export'

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

const CANVAS_DIMENSIONS: Record<AspectRatioKey, { width: number; height: number }> = {
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '1:1':  { width: 720, height: 720 },
  '4:3':  { width: 960, height: 720 },
}

/**
 * Returns the logical canvas dimensions for a given aspect ratio.
 * Falls back to 16:9 if an invalid key is provided.
 */
export function getCanvasDimensions(ratio: AspectRatioKey): { width: number; height: number } {
  return CANVAS_DIMENSIONS[ratio] ?? CANVAS_DIMENSIONS['16:9']
}
