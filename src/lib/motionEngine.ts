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

/** Default spring config — feels premium like Keynote */
export const MAGIC_SPRING = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 26,
  mass: 1,
}

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
  /** Stable identity for this line across transitions */
  key: string
  /** The HTML content to render */
  html: string
  /** What happened to this line in the transition */
  status: 'unchanged' | 'added' | 'removed'
}

/**
 * Diff two arrays of highlighted lines using content-based matching.
 * Uses a simple LCS (Longest Common Subsequence) approach to identify
 * which lines moved, which were added, and which were removed.
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
  const result: LineDiff[] = []
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

  for (const entry of merged) {
    if (entry.type === 'unchanged' && entry.nextIdx !== undefined) {
      result.push({
        key: `line-${nextTexts[entry.nextIdx]}-${entry.nextIdx}`,
        html: nextLines[entry.nextIdx].html,
        status: 'unchanged',
      })
    } else if (entry.type === 'added' && entry.nextIdx !== undefined) {
      result.push({
        key: `line-add-${nextTexts[entry.nextIdx]}-${entry.nextIdx}`,
        html: nextLines[entry.nextIdx].html,
        status: 'added',
      })
    } else if (entry.type === 'removed' && entry.prevIdx !== undefined) {
      result.push({
        key: `line-rm-${prevTexts[entry.prevIdx]}-${entry.prevIdx}`,
        html: prevLines[entry.prevIdx].html,
        status: 'removed',
      })
    }
  }

  return result
}

/** Strip HTML tags to get plain text for comparison */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
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
