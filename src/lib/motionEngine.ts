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
  /** How long removed lines take to exit */
  EXIT_DUR: 0.18,
  /** How long the layout reflow (container resize + line shift) takes */
  LAYOUT_DUR: 0.32,
  /**
   * When new lines start entering.
   * = EXIT_DUR + LAYOUT_DUR (0.18 + 0.32 = 0.50s)
   * New lines only appear once the container resize is 100% complete.
   */
  ENTER_DELAY: 0.50,
  /** How long each new line takes to fade/slide in */
  ENTER_DUR: 0.22,
  /** Per-line stagger between new lines cascading in */
  LINE_STAGGER: 0.05,
} as const

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
// 3. Code Line Diffing (LCS)
// ─────────────────────────────────────────────

export interface LineDiff {
  /** Stable identity for this line across transitions — used as layoutId */
  key: string
  /** The HTML content to render */
  html: string
  /** What happened to this line in the transition */
  status: 'unchanged' | 'added' | 'removed'
  /** Stagger index for sequenced build-in/out */
  staggerIndex: number
}

/**
 * Diff two arrays of highlighted lines using LCS (Myers' algorithm variant).
 *
 * KEY DESIGN DECISION for Magic Move:
 * - "Unchanged" lines get a STABLE key based on content hash.
 *   This means framer-motion's layoutId will track them across transitions
 *   and smoothly slide them to their new Y position.
 * - "Added" and "Removed" lines get unique keys so they properly
 *   enter/exit with AnimatePresence.
 */
export function diffCodeLines(
  prevLines: { id: string; html: string }[],
  nextLines: { id: string; html: string }[],
): LineDiff[] {
  // Extract text content from HTML for comparison
  const prevTexts = prevLines.map((l) => stripHtml(l.html))
  const nextTexts = nextLines.map((l) => stripHtml(l.html))

  // Build LCS table
  const m = prevTexts.length
  const n = nextTexts.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = prevTexts[i - 1] === nextTexts[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  // Backtrack to build diff
  let i = m
  let j = n

  const merged: { type: 'unchanged' | 'added' | 'removed'; prevIdx?: number; nextIdx?: number }[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && prevTexts[i - 1] === nextTexts[j - 1]) {
      merged.unshift({ type: 'unchanged', prevIdx: i - 1, nextIdx: j - 1 })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      merged.unshift({ type: 'added', nextIdx: j - 1 })
      j--
    } else {
      merged.unshift({ type: 'removed', prevIdx: i - 1 })
      i--
    }
  }

  // Build result with stable keys for unchanged lines
  const result: LineDiff[] = []
  let addedCount = 0
  let removedCount = 0
  const contentOccurrenceMap = new Map<string, number>()

  for (const entry of merged) {
    if (entry.type === 'unchanged' && entry.nextIdx !== undefined) {
      // STABLE KEY: content hash + occurrence index.
      // The occurrence suffix prevents two identical lines (e.g. `}`)
      // from sharing the same layoutId, which causes Framer Motion
      // to arbitrarily pick one and snap the other.
      const contentHash = stableHash(nextTexts[entry.nextIdx])
      const occurrence = contentOccurrenceMap.get(contentHash) ?? 0
      contentOccurrenceMap.set(contentHash, occurrence + 1)

      result.push({
        key: `cl-${contentHash}-${occurrence}`,
        html: nextLines[entry.nextIdx].html,
        status: 'unchanged',
        staggerIndex: 0,
      })
    } else if (entry.type === 'added' && entry.nextIdx !== undefined) {
      result.push({
        key: `cl-add-${entry.nextIdx}-${stableHash(nextTexts[entry.nextIdx])}`,
        html: nextLines[entry.nextIdx].html,
        status: 'added',
        staggerIndex: addedCount++,
      })
    } else if (entry.type === 'removed' && entry.prevIdx !== undefined) {
      result.push({
        key: `cl-rm-${entry.prevIdx}-${stableHash(prevTexts[entry.prevIdx])}`,
        html: prevLines[entry.prevIdx].html,
        status: 'removed',
        staggerIndex: removedCount++,
      })
    }
  }

  return result
}

/** Strip HTML tags to get plain text for comparison */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
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
