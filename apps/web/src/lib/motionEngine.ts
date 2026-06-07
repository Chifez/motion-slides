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
 * Levenshtein distance for text label similarity checking.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

function getElementTextLabel(el: SceneElement): string | null {
  if (el.type === 'text') {
    return (el.content as any).value || null
  }
  if (el.type === 'shape') {
    return (el.content as any).label || (el.content as any).iconLabel || null
  }
  return null
}

function calculateSimilarityScore(elA: SceneElement, elB: SceneElement): number {
  if (elA.type !== elB.type) return 0

  let score = 0

  // 1. Label/Content match (weight: 50)
  const labelA = getElementTextLabel(elA)
  const labelB = getElementTextLabel(elB)
  
  if (labelA && labelB) {
    if (labelA.toLowerCase() === labelB.toLowerCase()) {
      score += 50
    } else {
      const editDistance = levenshteinDistance(labelA.toLowerCase(), labelB.toLowerCase())
      const maxLen = Math.max(labelA.length, labelB.length)
      if (maxLen > 0) {
        const similarity = 1 - editDistance / maxLen
        score += Math.round(similarity * 35)
      }
    }
  }

  // 2. Icon / shape properties match (weight: 30)
  if (elA.type === 'shape' && elB.type === 'shape') {
    const contentA = elA.content as any
    const contentB = elB.content as any
    if (contentA.shapeType === contentB.shapeType) {
      score += 10
      if (contentA.iconPath && contentB.iconPath && contentA.iconPath === contentB.iconPath) {
        score += 20
      }
    }
  }

  // 3. Proximity match (weight: 20)
  const dx = elA.position.x - elB.position.x
  const dy = elA.position.y - elB.position.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  if (distance < 500) {
    score += Math.round((1 - distance / 500) * 20)
  }

  return score
}

/**
 * Calculates a map of target element ID -> source element ID.
 * Uses strict ID matches first, then falls back to semantic heuristics.
 */
export function getHeuristicMatchingMap(from: Slide | null, to: Slide | null): Record<string, string> {
  const matchingMap: Record<string, string> = {}
  if (!from || !to) return matchingMap

  const fromElements = [...from.elements]
  const toElements = [...to.elements]

  const matchedFromIds = new Set<string>()
  const matchedToIds = new Set<string>()

  // 1. Strict ID Match Pass
  for (const toEl of toElements) {
    const fromEl = fromElements.find(e => e.id === toEl.id)
    if (fromEl) {
      matchingMap[toEl.id] = fromEl.id
      matchedFromIds.add(fromEl.id)
      matchedToIds.add(toEl.id)
    }
  }

  // 2. Heuristic Match Pass
  const unmatchedTo = toElements.filter(e => !matchedToIds.has(e.id))
  const unmatchedFrom = fromElements.filter(e => !matchedFromIds.has(e.id))

  for (const toEl of unmatchedTo) {
    let bestCandidate: SceneElement | null = null
    let highestScore = 0

    for (const fromEl of unmatchedFrom) {
      if (matchedFromIds.has(fromEl.id)) continue
      
      const score = calculateSimilarityScore(fromEl, toEl)
      if (score > highestScore && score >= 75) {
        highestScore = score
        bestCandidate = fromEl
      }
    }

    if (bestCandidate) {
      matchingMap[toEl.id] = bestCandidate.id
      matchedFromIds.add(bestCandidate.id)
      matchedToIds.add(toEl.id)
    }
  }

  return matchingMap
}

/**
 * Diff two slides by matching elements using strict ID + heuristic fallback.
 * Tells us which elements should morph vs. enter/exit.
 */
export function diffSlides(from: Slide | null, to: Slide | null): DiffResult {
  const fromElements = from?.elements ?? []
  const toElements = to?.elements ?? []

  const matchingMap = getHeuristicMatchingMap(from, to)
  const continuingFromIds = new Set(Object.values(matchingMap))

  const updated: DiffResult['updated'] = []
  const unchanged: SceneElement[] = []
  const added: SceneElement[] = []
  const removed: SceneElement[] = []

  const fromMap = new Map(fromElements.map((el) => [el.id, el]))

  for (const toEl of toElements) {
    const fromId = matchingMap[toEl.id]
    if (fromId) {
      const fromEl = fromMap.get(fromId)
      if (fromEl) {
        if (hasElementChanged(fromEl, toEl)) {
          updated.push({ from: fromEl, to: toEl })
        } else {
          unchanged.push(toEl)
        }
      }
    } else {
      added.push(toEl)
    }
  }

  for (const fromEl of fromElements) {
    if (!continuingFromIds.has(fromEl.id)) {
      removed.push(fromEl)
    }
  }

  return { updated, added, removed, unchanged }
}

/**
 * Returns the Set of element IDs that exist in BOTH slides (strict ID or heuristic).
 * These elements should morph without fade in/out.
 */
export function getContinuingIds(from: Slide | null, to: Slide | null): Set<string> {
  const continuing = new Set<string>()
  if (!to) return continuing
  
  const map = getHeuristicMatchingMap(from, to)
  for (const toId of Object.keys(map)) {
    continuing.add(toId)
  }
  return continuing
}

/**
 * Returns the Set of element IDs that are NEW in the target slide (no matching element in source).
 */
export function getNewElementIds(from: Slide | null, to: Slide | null): Set<string> {
  const newIds = new Set<string>()
  if (!to) return newIds

  const map = getHeuristicMatchingMap(from, to)
  for (const el of to.elements) {
    if (!map[el.id]) {
      newIds.add(el.id)
    }
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
