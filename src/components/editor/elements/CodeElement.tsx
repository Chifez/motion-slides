import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CodeContent } from '@/types'
import { CODE_DEBOUNCE_MS } from '@/constants/animation'
import { getTokenizedLines } from '@/lib/shikiHighlighter'
import { tokenKey, CODE_PHASE } from '@/lib/motionEngine'

interface Props { content: CodeContent }

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/**
 * A flat token with a stable cross-line identity key.
 * All tokens for ALL lines are flattened into one array —
 * this is what enables cross-line FLIP (e.g. `}` moving from
 * line 3 to line 7 is tracked as the same token).
 */
interface FlatToken {
  key: string
  content: string
  color: string
  fontStyle: number
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * AnimToken = FlatToken + measured position + FLIP delta.
 *
 * Rendered as `position: absolute` in the stage layer at (x, y).
 * For "unchanged" tokens, `dx`/`dy` is the offset from old→new position;
 * Framer Motion animates from `initial={{ x: dx, y: dy }}` → `animate={{ x: 0, y: 0 }}`.
 */
interface AnimToken extends FlatToken {
  x: number
  y: number
  width: number
  height: number
  /** FLIP offset: prevX - nextX (start here, animate to 0) */
  dx: number
  /** FLIP offset: prevY - nextY (start here, animate to 0) */
  dy: number
  status: 'unchanged' | 'added' | 'removed'
  staggerIndex: number
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Structural punctuation characters that Shiki may bundle together into a
 * single token in one context (e.g. `{}` as an inline empty block) but emit
 * as individual tokens in another (e.g. `{` and `}` on separate lines).
 *
 * We split any token that is composed entirely of these characters into
 * individual single-character tokens, each inheriting the parent token's
 * color and fontStyle. This guarantees that `{}` and `{ }` and `{\n}`
 * all produce the same keys for `{` and `}`, making cross-slide FLIP work
 * regardless of how Shiki chose to group the punctuation.
 */
const PUNCTUATION_CHARS = new Set([
  '{', '}', '(', ')', '[', ']', '<', '>',
  ';', ':', ',', '.', '|', '&', '?', '!',
  '+', '-', '*', '/', '=', '%', '^', '~',
])

function isPurelyPunctuation(text: string): boolean {
  return text.length > 1 && [...text].every((ch) => PUNCTUATION_CHARS.has(ch))
}

/**
 * Split a token into individual single-character sub-tokens when it is
 * composed entirely of punctuation characters. Otherwise return as-is.
 * Each sub-token inherits the parent's color and fontStyle.
 */
function splitToken(tok: { content: string; color: string; fontStyle: number }) {
  if (!isPurelyPunctuation(tok.content)) return [tok]
  return [...tok.content].map((ch) => ({ content: ch, color: tok.color, fontStyle: tok.fontStyle }))
}

/**
 * Tokenize code and flatten all lines into a single array with stable cross-line keys.
 *
 * KEY DESIGN: Occurrence counting is global across ALL lines.
 * So two `}` tokens on different lines get `tk-xxx-0` and `tk-xxx-1`.
 * If they swap positions between slides, each keeps its identity and FLIP animates it.
 *
 * Multi-character punctuation tokens (e.g. `{}`, `=>`) are split into
 * individual characters before key assignment so that the same structural
 * character always gets the same key regardless of how Shiki grouped it.
 */
async function buildFlatTokens(
  value: string,
  language: string,
): Promise<FlatToken[]> {
  const lines = await getTokenizedLines(value || ' ', language || 'javascript')
  const occMap = new Map<string, number>()
  const flat: FlatToken[] = []

  for (let li = 0; li < lines.length; li++) {
    for (const rawTok of lines[li]) {
      // Normalise: split pure-punctuation compound tokens into single chars
      const subTokens = splitToken(rawTok)
      for (const tok of subTokens) {
        const occ = occMap.get(tok.content) ?? 0
        occMap.set(tok.content, occ + 1)
        flat.push({
          key: tokenKey(tok.content, occ),
          content: tok.content,
          color: tok.color,
          fontStyle: tok.fontStyle,
        })
      }
    }
    // Explicit newline between lines (not after the last)
    if (li < lines.length - 1) {
      flat.push({ key: `__nl${li}`, content: '\n', color: '', fontStyle: 0 })
    }
  }

  return flat
}

/**
 * Read every `[data-tok]` span's bounding rect from the ghost layer,
 * normalised to the wrapper's top-left as origin and corrected for any
 * CSS transform scale applied by an ancestor (e.g. the presentation canvas).
 *
 * getBoundingClientRect() returns viewport px (post-transform).
 * CSS left/top properties work in local CSS px (pre-transform).
 * Dividing by the scale factor converts between the two coordinate spaces.
 */
function measureGhostRects(
  ghostEl: HTMLElement,
  wrapperEl: HTMLElement,
): Map<string, Rect> {
  const wrapperRect = wrapperEl.getBoundingClientRect()

  // offsetWidth/Height are in CSS px (unaffected by transforms).
  // getBoundingClientRect().width/height are in viewport px (includes all ancestor scales).
  // Their ratio gives us the cumulative scale we need to undo.
  const scaleX = wrapperRect.width / wrapperEl.offsetWidth
  const scaleY = wrapperRect.height / wrapperEl.offsetHeight

  const map = new Map<string, Rect>()
  ghostEl.querySelectorAll<HTMLElement>('[data-tok]').forEach((span) => {
    const k = span.getAttribute('data-tok')!
    if (k.startsWith('__nl')) return
    const r = span.getBoundingClientRect()
    map.set(k, {
      x: (r.left - wrapperRect.left) / scaleX,
      y: (r.top - wrapperRect.top) / scaleY,
      width: r.width / scaleX,
      height: r.height / scaleY,
    })
  })
  return map
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function CodeElement({ content }: Props) {
  // ── DOM refs ──────────────────────────────────
  /**
   * wrapperRef: the `position: relative` div that both the ghost and stage
   * sit inside. All absolute coordinates are relative to this element.
   */
  const wrapperRef = useRef<HTMLDivElement>(null)
  /**
   * ghostRef: the invisible, in-flow div. It renders tokens as plain inline
   * spans to give the wrapper its natural height and to provide pixel-accurate
   * token positions we can measure before building the animated stage.
   */
  const ghostRef = useRef<HTMLDivElement>(null)

  // ── State ─────────────────────────────────────
  /** Token list the ghost currently renders (drives measurements). */
  const [ghostTokens, setGhostTokens] = useState<FlatToken[]>([])
  /** Absolutely-positioned animated tokens rendered in the stage. */
  const [animTokens, setAnimTokens] = useState<AnimToken[]>([])

  // ── Mutation refs (no re-render needed) ───────
  /**
   * Destination positions from the PREVIOUS render.
   * When a new transition begins, these become the FLIP "from" positions.
   */
  const prevPositionsRef = useRef<Map<string, Rect>>(new Map())
  /** FlatTokens from the previous render — needed to know which tokens were removed. */
  const prevTokensRef = useRef<FlatToken[]>([])

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─────────────────────────────────────────────
  // Step 1 — content changes → tokenize → update ghost
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const isFirst = ghostTokens.length === 0

    timerRef.current = setTimeout(async () => {
      try {
        const flat = await buildFlatTokens(content.value, content.language || 'javascript')
        setGhostTokens(flat)
      } catch {
        // Bare-text fallback: treat the whole value as a single token per line
        const lines = (content.value || '').split('\n')
        const flat: FlatToken[] = []
        lines.forEach((text, i) => {
          flat.push({ key: `__fb${i}`, content: text || '\u200b', color: '#e0e0e0', fontStyle: 0 })
          if (i < lines.length - 1) flat.push({ key: `__nl${i}`, content: '\n', color: '', fontStyle: 0 })
        })
        setGhostTokens(flat)
      }
    }, isFirst ? 0 : CODE_DEBOUNCE_MS)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.value, content.language])

  // ─────────────────────────────────────────────
  // Step 2 — ghost re-renders → measure positions → build FLIP animTokens
  //
  // useLayoutEffect fires synchronously after the DOM updates but before
  // the browser paints, so `ghostRef` already reflects the new tokens.
  // ─────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!wrapperRef.current || !ghostRef.current || ghostTokens.length === 0) return

    const nextPositions = measureGhostRects(ghostRef.current, wrapperRef.current)

    const isFirst = prevTokensRef.current.length === 0
    const prevPositions = prevPositionsRef.current
    const prevKeys = new Set(prevTokensRef.current.map((t) => t.key))
    const nextKeys = new Set(
      ghostTokens.filter((t) => !t.key.startsWith('__nl')).map((t) => t.key),
    )

    const newAnimTokens: AnimToken[] = []
    let addedIdx = 0

    // ── Unchanged + Added tokens ─────────────────
    for (const tok of ghostTokens) {
      if (tok.key.startsWith('__nl')) continue
      const next = nextPositions.get(tok.key)
      if (!next) continue

      if (isFirst) {
        // Very first render: snap everything in place, no animation.
        // initial={false} below prevents any entrance animation.
        newAnimTokens.push({ ...tok, ...next, dx: 0, dy: 0, status: 'unchanged', staggerIndex: 0 })
      } else if (prevKeys.has(tok.key) && prevPositions.has(tok.key)) {
        // Token existed before: compute FLIP delta so it flies from old → new position.
        const prev = prevPositions.get(tok.key)!
        newAnimTokens.push({
          ...tok, ...next,
          dx: prev.x - next.x,
          dy: prev.y - next.y,
          status: 'unchanged',
          staggerIndex: 0,
        })
      } else {
        // Brand-new token: fade in after the FLIP phase completes.
        newAnimTokens.push({ ...tok, ...next, dx: 0, dy: 0, status: 'added', staggerIndex: addedIdx++ })
      }
    }

    // ── Removed tokens ───────────────────────────
    // Render at their OLD pixel position and fade out immediately (Phase 0).
    if (!isFirst) {
      for (const tok of prevTokensRef.current) {
        if (tok.key.startsWith('__nl')) continue
        if (!nextKeys.has(tok.key) && prevPositions.has(tok.key)) {
          const prev = prevPositions.get(tok.key)!
          newAnimTokens.push({ ...tok, ...prev, dx: 0, dy: 0, status: 'removed', staggerIndex: 0 })
        }
      }
    }

    // Save current state for the next transition
    prevPositionsRef.current = nextPositions
    prevTokensRef.current = ghostTokens

    setAnimTokens(newAnimTokens)
  }, [ghostTokens])

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  const EASE_IN_OUT: [number, number, number, number] = [0.37, 0, 0.63, 1]
  const EASE_OUT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

  return (
    <div className="font-mono text-[12px] leading-relaxed bg-[#121212] rounded-lg px-3.5 py-3 w-full h-full overflow-auto">
      <div className="text-[9px] uppercase tracking-wider text-neutral-600 mb-2 select-none">
        {content.language || 'javascript'}
      </div>

      {/*
        Measurement + animation wrapper.
        `position: relative` makes it the coordinate origin for all
        absolute-positioned tokens in the stage.
      */}
      <div ref={wrapperRef} style={{ position: 'relative' }}>

        {/*
          ── Ghost layer ──────────────────────────────────────────────────
          Rendered in NORMAL TEXT FLOW so it determines the wrapper's height.
          Invisible (opacity: 0) and non-interactive.
          Each span gets `data-tok` so measureGhostRects() can find it.

          IMPORTANT: this must have identical font, size, line-height, and
          whitespace handling to what you'd normally render — otherwise the
          measured positions will be offset from what the user sees.
        */}
        <div
          ref={ghostRef}
          aria-hidden="true"
          style={{
            opacity: 0,
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'pre-wrap',
          }}
        >
          {ghostTokens.map((tok) => (
            <span key={tok.key} data-tok={tok.key}>
              {tok.content}
            </span>
          ))}
        </div>

        {/*
          ── Stage layer ──────────────────────────────────────────────────
          Absolutely overlays the ghost (same origin, same width).
          All tokens here are `position: absolute` at their measured (x, y).

          Why this works for FLIP:
          - Token at (x=40, y=80) in slide A, (x=40, y=160) in slide B
          - In the stage it renders at left:40 top:160 (the NEW position)
          - `initial={{ x: 0, y: -80 }}` offsets it back to where it was
          - `animate={{ x: 0, y: 0 }}` eases it to the new position
          - Net effect: the token visually flies from line 3 to line 7 ✓
        */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            // No `bottom` — let removed tokens overflow downward during exit
            pointerEvents: 'none',
          }}
        >
          <AnimatePresence>
            {animTokens.map((tok) => {
              const baseStyle: React.CSSProperties = {
                position: 'absolute',
                left: tok.x,
                top: tok.y,
                // Explicit width prevents token from wrapping when briefly at odd positions
                width: tok.width,
                color: tok.color,
                whiteSpace: 'pre',
                fontStyle: tok.fontStyle & 1 ? 'italic' : 'normal',
                fontWeight: tok.fontStyle & 2 ? 'bold' : 'normal',
                textDecoration: tok.fontStyle & 4 ? 'underline' : 'none',
              }

              // ── Phase 0: removed tokens fade out immediately ────────
              if (tok.status === 'removed') {
                return (
                  <motion.span
                    // Use a distinct key suffix so AnimatePresence can
                    // distinguish this exit from a same-keyed entrance
                    key={tok.key + '__rm'}
                    style={baseStyle}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: CODE_PHASE.EXIT_DUR,
                      ease: EASE_IN_OUT,
                    }}
                  >
                    {tok.content}
                  </motion.span>
                )
              }

              // ── Phase 2: new tokens fade in after layout settles ────
              if (tok.status === 'added') {
                return (
                  <motion.span
                    key={tok.key}
                    style={baseStyle}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: CODE_PHASE.ENTER_DUR,
                      ease: EASE_OUT,
                      // Wait for removes (Phase 0) + FLIP moves (Phase 1) to finish
                      delay: CODE_PHASE.ENTER_DELAY + tok.staggerIndex * 0.015,
                    }}
                  >
                    {tok.content}
                  </motion.span>
                )
              }

              // ── Phase 1: unchanged tokens fly to their new positions ─
              //
              // `initial={false}` on first render (dx===0, dy===0) = no animation, snap in place.
              // On subsequent transitions, `initial={{ x: dx, y: dy }}` starts the token
              // at its OLD visual position and `animate={{ x:0, y:0 }}` moves it to its new one.
              const hasMovement = tok.dx !== 0 || tok.dy !== 0
              return (
                <motion.span
                  key={tok.key}
                  style={baseStyle}
                  // `initial={false}` = don't animate from initial on mount;
                  // just snap to animate values. Used when there's no delta.
                  initial={hasMovement ? { x: tok.dx, y: tok.dy } : false}
                  animate={{ x: 0, y: 0 }}
                  transition={{
                    duration: CODE_PHASE.LAYOUT_DUR,
                    ease: EASE_IN_OUT,
                    // Wait for removed tokens to exit first
                    delay: CODE_PHASE.EXIT_DUR,
                  }}
                >
                  {tok.content}
                </motion.span>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}