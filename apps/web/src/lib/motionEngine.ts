import type { SceneElement, Slide, CubicBezier, PlaybackSettings } from '@motionslides/shared'
import type { Transition } from 'framer-motion'

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
 * Tells us which elements should morph vs. enter/exit.
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

  for (const fromEl of fromElements) {
    if (!toMap.has(fromEl.id)) {
      removed.push(fromEl)
    }
  }

  return { updated, added, removed, unchanged }
}

/**
 * Returns the Set of element IDs that exist in BOTH slides.
 * These elements should morph without fade in/out.
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
 * Returns the Set of element IDs that are NEW in the target slide.
 */
export function getNewElementIds(from: Slide | null, to: Slide | null): Set<string> {
  const fromIds = new Set((from?.elements ?? []).map((el) => el.id))
  const newIds = new Set<string>()
  for (const el of to?.elements ?? []) {
    if (!fromIds.has(el.id)) newIds.add(el.id)
  }
  return newIds
}

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

/**
 * Magic Move easing — critically damped (zero bounce).
 * Critical damping condition: damping >= 2 * sqrt(stiffness * mass)
 */
export const MAGIC_SPRING = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 34,
  mass: 1,
}

export const BUILD_IN_SPRING = {
  type: 'spring' as const,
  stiffness: 240,
  damping: 30,
  mass: 0.9,
}

/**
 * Phased code animation timing.
 * 
 * Sequence matches animate-code.com's model:
 * 1. EXIT: Removed lines fade/height out
 * 2. LAYOUT: Container resizes
 * 3. ENTER: New lines fade/slide in
 */
export const CODE_PHASE = {
  EXIT_DUR: 0.18,
  LAYOUT_DUR: 0.32,
  /** EXIT_DUR + LAYOUT_DUR: ensure new elements wait for reflow */
  ENTER_DELAY: 0.50,
  ENTER_DUR: 0.22,
  LINE_STAGGER: 0.05,
} as const

export const PHASE_1_DURATION = CODE_PHASE.EXIT_DUR + CODE_PHASE.LAYOUT_DUR
export const PHASE_2_DELAY = PHASE_1_DURATION

/**
 * Build a framer-motion Transition object from the user's playback settings.
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
 */
export function staggerDelay(index: number, total: number, baseDuration: number): number {
  if (total <= 1) return 0
  const maxStagger = baseDuration * 0.3
  return (index / (total - 1)) * maxStagger
}

/**
 * Generate a stable key for a token.
 * Occurrence index enables cross-line FLIP identity tracking.
 */
export function tokenKey(content: string, occurrence: number): string {
  return `tk-${stableHash(content)}-${occurrence}`
}

function stableHash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

export function cubicBezierToArray(bezier: CubicBezier): [number, number, number, number] {
  return [bezier.x1, bezier.y1, bezier.x2, bezier.y2]
}

export function msToSec(ms: number): number {
  return ms / 1000
}
