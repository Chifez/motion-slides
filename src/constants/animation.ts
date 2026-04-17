// ─────────────────────────────────────────────
// Animation & Timing Constants
// ─────────────────────────────────────────────

/** Default transition duration between slides (ms) */
export const DEFAULT_TRANSITION_DURATION = 500

/** Ease curve for layout animations [cubic-bezier] */
export const LAYOUT_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

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
