// ─────────────────────────────────────────────
// Animation & Timing Constants
// ─────────────────────────────────────────────

/** Default transition duration between slides (ms) */
export const DEFAULT_TRANSITION_DURATION = 500

/**
 * Ease curve for layout animations [cubic-bezier]
 * Matches the "Apple" preset from our bezier presets.
 */
export const LAYOUT_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

/** Layout animation duration (seconds) */
export const LAYOUT_DURATION = 0.5

/** Presentation controls auto-hide delay (ms) */
export const CONTROLS_AUTO_HIDE_MS = 2500

/** Code element highlighting debounce (ms) */
export const CODE_DEBOUNCE_MS = 350

/** Minimum pixel movement before a drag is registered */
export const DRAG_THRESHOLD_PX = 2

/** Delay before isDragging flag resets after pointer-up (ms) */
export const DRAG_RESET_DELAY_MS = 10

/** Minimum element width during resize (px) */
export const MIN_ELEMENT_WIDTH = 40

/** Minimum element height during resize (px) */
export const MIN_ELEMENT_HEIGHT = 24

// ─────────────────────────────────────────────
// Magic Move — Entrance / Exit Defaults
// ─────────────────────────────────────────────

/** Default entrance animation for elements appearing on a new slide */
export const ENTRANCE_INITIAL = { opacity: 0, y: 20, scale: 0.97 }

/** Default exit animation for elements disappearing from a slide */
export const EXIT_TARGET = { opacity: 0, y: -12, scale: 0.98 }
