/**
 * 🎬 Motion Engine — Core Animation Logic
 *
 * Implements the architecture from MOTION.md:
 *   Match → Diff → Measure → Invert → Animate → Render
 *
 * This module is framework-agnostic logic. React/Framer Motion integration
 * lives in the components and MotionContext.
 */

import type { SceneElement, Slide, CubicBezier, PlaybackSettings } from '@/types'
import type { Transition } from 'framer-motion'

// ─────────────────────────────────────────────
// 1. Element Matching & Diff Engine
// ─────────────────────────────────────────────

export interface DiffResult {
  /** Elements present in both slides (matched by ID) */
  updated: { from: SceneElement; to: SceneElement }[]
  /** Elements only in the incoming slide */
  added: SceneElement[]
  /** Elements only in the outgoing slide */
  removed: SceneElement[]
  /** Elements in both slides with identical properties */
  unchanged: SceneElement[]
}

/**
 * Diff two slides by matching elements strictly by ID.
 * This is the heart of Magic Move — it tells us which elements
 * should morph vs. enter/exit.
 */
export function diffSlides(from: Slide | null, to: Slide | null): DiffResult {
  const fromElements = from?.elements ?? []
  const toElements = to?.elements ?? []

  const fromMap = new Map(fromElements.map((el) => [el.id, el]))
  const toMap = new Map(toElements.map((el) => [el.id, el]))

  const updated: DiffResult['updated'] = []
  const unchanged: SceneElement[] = []
  const added: SceneElement[] = []
  const removed: SceneElement[] = []

  // Walk the destination slide — find matches and additions
  for (const toEl of toElements) {
    const fromEl = fromMap.get(toEl.id)
    if (fromEl) {
      if (hasElementChanged(fromEl, toEl)) {
        updated.push({ from: fromEl, to: toEl })
      } else {
        unchanged.push(toEl)
      }
    } else {
      added.push(toEl)
    }
  }

  // Walk the source slide — find removals
  for (const fromEl of fromElements) {
    if (!toMap.has(fromEl.id)) {
      removed.push(fromEl)
    }
  }

  return { updated, added, removed, unchanged }
}

/**
 * Returns the Set of element IDs that exist in BOTH slides.
 * These are "continuing" elements — they should Magic Move
 * (no fade in/out, just smooth position/size interpolation).
 */
export function getContinuingIds(from: Slide | null, to: Slide | null): Set<string> {
  const fromIds = new Set((from?.elements ?? []).map((el) => el.id))
  const toIds = (to?.elements ?? []).map((el) => el.id)
  const continuing = new Set<string>()
  for (const id of toIds) {
    if (fromIds.has(id)) continuing.add(id)
  }
  return continuing
}

/**
 * Returns the Set of element IDs that are NEW in the target slide
 * (not present in the source slide). Used for staggered build-in.
 */
export function getNewElementIds(from: Slide | null, to: Slide | null): Set<string> {
  const fromIds = new Set((from?.elements ?? []).map((el) => el.id))
  const newIds = new Set<string>()
  for (const el of to?.elements ?? []) {
    if (!fromIds.has(el.id)) newIds.add(el.id)
  }
  return newIds
}

/** Check if any animatable property has changed between two element states */
function hasElementChanged(a: SceneElement, b: SceneElement): boolean {
  return (
    a.position.x !== b.position.x ||
    a.position.y !== b.position.y ||
    a.size.width !== b.size.width ||
    a.size.height !== b.size.height ||
    a.rotation !== b.rotation ||
    a.opacity !== b.opacity
  )
}

// ─────────────────────────────────────────────
// 2. Transition Builder
// ─────────────────────────────────────────────

/**
 * Magic Move easing — critically damped (zero bounce).
 *
 * Critical damping condition: damping >= 2 * sqrt(stiffness * mass)
 * At stiffness=280, mass=1: critical = 2*sqrt(280) ≈ 33.5
 * We use 34 for a touch of snap without any oscillation.
 */
export const MAGIC_SPRING = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 34,
  mass: 1,
}

/**
 * Build-in spring — slightly softer, still no bounce.
 * Used for new elements appearing after layout has settled.
 */
export const BUILD_IN_SPRING = {
  type: 'spring' as const,
  stiffness: 240,
  damping: 30,
  mass: 0.9,
}

/**
 * Phased code animation timing.
 *
 * The sequence matches animate-code.com's model:
 *   Phase 0 (0ms):       Removed lines exit (height → 0, opacity → 0)
 *   Phase 1 (EXIT_DUR):  Layout settles — container resizes, unchanged lines reflow
 *   Phase 2 (ENTER_DELAY): New lines fade/slide in to fill the created space
 *
 * All durations are in seconds.
 */
export const CODE_PHASE = {
  /** How long removed lines/tokens take to exit */
  EXIT_DUR: 0.18,
  /** How long the layout reflow (container resize + line shift) takes */
  LAYOUT_DUR: 0.32,
  /**
   * When new lines/tokens start entering.
   * = EXIT_DUR + LAYOUT_DUR (0.18 + 0.32 = 0.50s)
   * New elements only appear once the container resize is 100% complete.
   */
  ENTER_DELAY: 0.50,
  /** How long each new line/token takes to fade/slide in */
  ENTER_DUR: 0.22,
  /** Per-line stagger between new lines cascading in */
  LINE_STAGGER: 0.05,
} as const

/**
 * Phase 1 total duration (morph / fly phase).
 * Shared by CanvasElement for new-element entrance delay.
 * = EXIT_DUR + LAYOUT_DUR
 */
export const PHASE_1_DURATION = CODE_PHASE.EXIT_DUR + CODE_PHASE.LAYOUT_DUR

/**
 * Phase 2 start delay — when NEW shapes/text/lines/code-tokens should begin
 * appearing. Equals PHASE_1_DURATION so all morphs complete before any
 * new element is revealed.
 */
export const PHASE_2_DELAY = PHASE_1_DURATION

/**
 * Build a framer-motion Transition object from the user's playback settings.
 * This is the single source of truth for how fast and smooth animations feel.
 */
export function buildTransition(settings: PlaybackSettings): Transition {
  const durationSec = settings.transitionDuration / 1000
  const ease = cubicBezierToArray(settings.transitionEase)

  return {
    layout: {
      duration: durationSec,
      ease,
    },
    opacity: {
      duration: durationSec * 0.6,
      ease: 'easeOut',
    },
    default: {
      duration: durationSec,
      ease,
    },
  }
}

/**
 * Build the entrance animation for newly added elements.
 * Subtle slide-up + fade, consistent with Keynote's "build in" feel.
 */
export function buildEntranceVariants(durationSec: number, ease: number[]) {
  return {
    initial: { opacity: 0, y: 20, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -12, scale: 0.98 },
    transition: {
      duration: durationSec * 0.7,
      ease,
    },
  }
}

/**
 * Build per-element stagger delay for entrance animations.
 * Elements enter sequentially with a subtle cascade.
 */
export function staggerDelay(index: number, total: number, baseDuration: number): number {
  if (total <= 1) return 0
  const maxStagger = baseDuration * 0.3 // stagger spans 30% of total duration
  return (index / (total - 1)) * maxStagger
}

// ─────────────────────────────────────────────
// 3. Token Key Generation
// ─────────────────────────────────────────────

/**
 * Generate a stable key for a token.
 * Format: `tk-{contentHash}-{occurrenceIndex}`
 * Two tokens with identical text get distinct keys via occurrence index,
 * enabling cross-line FLIP identity tracking.
 */
export function tokenKey(content: string, occurrence: number): string {
  return `tk-${stableHash(content)}-${occurrence}`
}

/** Produce a short deterministic hash from a string for stable keys */
function stableHash(text: string): string {
  let h = 0x811c9dc5 // FNV offset basis
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) // FNV prime
  }
  return (h >>> 0).toString(36)
}

// ─────────────────────────────────────────────
// 4. Utility Helpers
// ─────────────────────────────────────────────

/** Convert our CubicBezier type to framer-motion's [x1, y1, x2, y2] array */
export function cubicBezierToArray(bezier: CubicBezier): [number, number, number, number] {
  return [bezier.x1, bezier.y1, bezier.x2, bezier.y2]
}

/** Convert milliseconds to seconds for framer-motion */
export function msToSec(ms: number): number {
  return ms / 1000
}
