import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CodeContent } from '@/types'
import { CODE_DEBOUNCE_MS } from '@/constants/animation'
import { getTokenizedLines } from '@/lib/shikiHighlighter'
import {
  diffCodeLines,
  diffLineTokens,
  type LineDiff,
  type TokenInfo,
  type TokenDiff,
  CODE_PHASE,
} from '@/lib/motionEngine'

interface Props { content: CodeContent }

/**
 * CodeElement — Token-level "Magic Move" animation.
 *
 * Architecture:
 *   1. Shiki tokenizes code into a 2D array: line[] of token[].
 *   2. Line-level LCS diff determines which lines are unchanged/added/removed.
 *   3. For UNCHANGED lines, token-level diff finds which *tokens* moved/changed.
 *   4. Each token is a `motion.span` with a stable `layoutId` key.
 *      Framer Motion's FLIP animates tokens flying to their new positions.
 *
 * Phase sequence (same as before, now at token granularity):
 *   Phase 0 — removed lines/tokens exit (fade+collapse)
 *   Phase 1 — container + unchanged tokens reflow to new positions
 *   Phase 2 — new tokens fade in after layout settles
 */
export function CodeElement({ content }: Props) {
  const [lineDiffs, setLineDiffs] = useState<LineDiff[]>([])
  // tokenDiffs: for each line key → the token-level diff result
  const [tokenDiffs, setTokenDiffs] = useState<Map<string, TokenDiff[]>>(new Map())

  // Previous structured tokens for diffing
  const prevTokensRef = useRef<TokenInfo[][]>([])
  const prevLineDiffsRef = useRef<LineDiff[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)

    const debounceMs = prevLineDiffsRef.current.length === 0 ? 0 : CODE_DEBOUNCE_MS

    timer.current = setTimeout(async () => {
      try {
        const nextTokenLines = await getTokenizedLines(
          content.value || ' ',
          content.language || 'javascript',
        )

        // Build the HighlightedLine[] shape from tokens (for line-level LCS)
        const nextLines = nextTokenLines.map((lineTokens, i) => ({
          id: `line-${i}`,
          html: lineTokens.map((t) => t.content).join(''),
        }))

        // ── Line-level diff ──
        let newLineDiffs: LineDiff[]
        if (prevLineDiffsRef.current.length > 0) {
          const prevLines = prevTokensRef.current.map((lineTokens, i) => ({
            id: `line-${i}`,
            html: lineTokens.map((t) => t.content).join(''),
          }))
          newLineDiffs = diffCodeLines(prevLines, nextLines)
        } else {
          newLineDiffs = nextLines.map((_, i) => ({
            key: `line-init-${i}`,
            html: '',
            status: 'unchanged' as const,
            staggerIndex: 0,
          }))
        }

        // ── Token-level diff for unchanged lines ──
        // We need to match line keys to their token arrays.
        // Build a map: prev plain text → index in prevTokenLines
        const prevTextToIdx = new Map<string, number>()
        prevTokensRef.current.forEach((lineTokens, i) => {
          const text = lineTokens.map((t) => t.content).join('')
          prevTextToIdx.set(text, i)
        })

        const newTokenDiffs = new Map<string, TokenDiff[]>()
        let nextLineIdx = 0

        for (const lineDiff of newLineDiffs) {
          if (lineDiff.status === 'unchanged') {
            const nextLineTokens = nextTokenLines[nextLineIdx] ?? []
            const lineText = nextLineTokens.map((t) => t.content).join('')
            const prevIdx = prevTextToIdx.get(lineText) ?? nextLineIdx
            const prevLineTokens = prevTokensRef.current[prevIdx] ?? []

            newTokenDiffs.set(
              lineDiff.key,
              diffLineTokens(prevLineTokens, nextLineTokens),
            )
            nextLineIdx++
          } else if (lineDiff.status === 'added') {
            // For added lines, all tokens are 'added'
            const nextLineTokens = nextTokenLines[nextLineIdx] ?? []
            newTokenDiffs.set(
              lineDiff.key,
              nextLineTokens.map((tok, ti) => ({
                key: `add-tok-${lineDiff.key}-${ti}`,
                content: tok.content,
                color: tok.color,
                fontStyle: tok.fontStyle,
                status: 'added' as const,
                staggerIndex: ti,
              })),
            )
            nextLineIdx++
          }
          // 'removed' lines have no nextLineIdx to advance
        }

        prevTokensRef.current = nextTokenLines
        prevLineDiffsRef.current = newLineDiffs
        setLineDiffs(newLineDiffs)
        setTokenDiffs(newTokenDiffs)
      } catch {
        // Fallback: no-token mode, treat each line as a single text token
        const fallbackLines = (content.value || '').split('\n')
        const newLineDiffs: LineDiff[] = fallbackLines.map((text, i) => ({
          key: `line-init-${i}`,
          html: text,
          status: 'unchanged' as const,
          staggerIndex: 0,
        }))
        const newTokenDiffs = new Map<string, TokenDiff[]>()
        fallbackLines.forEach((text, i) => {
          newTokenDiffs.set(`line-init-${i}`, [{
            key: `tok-fallback-${i}`,
            content: text || '\u200b',
            color: '#e0e0e0',
            fontStyle: 0,
            status: 'unchanged',
            staggerIndex: 0,
          }])
        })
        prevTokensRef.current = fallbackLines.map((t) => [{ content: t, color: '#e0e0e0', fontStyle: 0 }])
        prevLineDiffsRef.current = newLineDiffs
        setLineDiffs(newLineDiffs)
        setTokenDiffs(newTokenDiffs)
      }
    }, debounceMs)

    return () => { if (timer.current) clearTimeout(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.value, content.language])

  // ── Easing ──
  const EASE_OUT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]
  const EASE_IN_OUT: [number, number, number, number] = [0.37, 0, 0.63, 1]

  return (
    <motion.div
      layout
      className="font-mono text-[12px] leading-relaxed bg-[#121212] rounded-lg px-3.5 py-3 w-full h-full overflow-auto"
      // Phase 1: container resizes with ease-in-out after exits finish
      transition={{
        layout: {
          duration: CODE_PHASE.LAYOUT_DUR,
          ease: EASE_IN_OUT,
          delay: CODE_PHASE.EXIT_DUR,
        },
      }}
    >
      <div className="text-[9px] uppercase tracking-wider text-neutral-600 mb-2 select-none">
        {content.language || 'javascript'}
      </div>
      <AnimatePresence mode="popLayout">
        {lineDiffs.map((line) => {
          const tokens = tokenDiffs.get(line.key)

          // ── REMOVED lines ──
          if (line.status === 'removed') {
            return (
              <motion.div
                key={line.key}
                layout
                className="whitespace-pre min-h-[1.4em] overflow-hidden flex flex-wrap"
                initial={false}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  height: 0,
                  transition: {
                    duration: CODE_PHASE.EXIT_DUR,
                    ease: EASE_IN_OUT,
                  },
                }}
                transition={{
                  layout: { duration: CODE_PHASE.LAYOUT_DUR, ease: EASE_IN_OUT },
                }}
              >
                {/* Render removed line as plain text — no token FLIP needed */}
                <span className="text-neutral-500">{line.html}</span>
              </motion.div>
            )
          }

          // ── ADDED lines ──
          if (line.status === 'added') {
            return (
              <motion.div
                key={line.key}
                layout
                className="whitespace-pre min-h-[1.4em] overflow-hidden flex flex-wrap"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{
                  duration: CODE_PHASE.ENTER_DUR,
                  ease: EASE_OUT,
                  delay: CODE_PHASE.ENTER_DELAY,
                  layout: {
                    duration: CODE_PHASE.LAYOUT_DUR,
                    ease: EASE_IN_OUT,
                    delay: CODE_PHASE.EXIT_DUR,
                  },
                }}
              >
                <TokenRow tokens={tokens ?? []} easeOut={EASE_OUT} easeInOut={EASE_IN_OUT} />
              </motion.div>
            )
          }

          // ── UNCHANGED lines ──
          // Use layoutId on the line container so the whole row slides to
          // its new Y position. Individual tokens inside also have layoutIds.
          return (
            <motion.div
              key={line.key}
              layoutId={line.key}
              layout
              className="whitespace-pre min-h-[1.4em] flex flex-wrap"
              initial={false}
              animate={{ opacity: 1 }}
              transition={{
                layout: {
                  duration: CODE_PHASE.LAYOUT_DUR,
                  ease: EASE_IN_OUT,
                  delay: CODE_PHASE.EXIT_DUR,
                },
                opacity: { duration: 0 },
              }}
            >
              <TokenRow tokens={tokens ?? []} easeOut={EASE_OUT} easeInOut={EASE_IN_OUT} />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// TokenRow — renders token-level motion.spans
// ─────────────────────────────────────────────

interface TokenRowProps {
  tokens: TokenDiff[]
  easeOut: [number, number, number, number]
  easeInOut: [number, number, number, number]
}

/**
 * Renders one line's worth of tokens as individual `motion.span` elements.
 * Each token has a stable `layoutId` so Framer Motion can FLIP it to its
 * new position when it moves between lines/positions across slides.
 */
function TokenRow({ tokens, easeOut, easeInOut }: TokenRowProps) {
  return (
    <AnimatePresence mode="popLayout">
      {tokens.map((tok) => {
        const style: React.CSSProperties = {
          color: tok.color,
          fontStyle: tok.fontStyle & 1 ? 'italic' : undefined,
          fontWeight: tok.fontStyle & 2 ? 'bold' : undefined,
          textDecoration: tok.fontStyle & 4 ? 'underline' : undefined,
        }

        if (tok.status === 'removed') {
          return (
            <motion.span
              key={tok.key}
              style={style}
              initial={false}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: { duration: CODE_PHASE.EXIT_DUR, ease: easeInOut },
              }}
            >
              {tok.content}
            </motion.span>
          )
        }

        if (tok.status === 'added') {
          return (
            <motion.span
              key={tok.key}
              style={style}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: CODE_PHASE.ENTER_DUR,
                ease: easeOut,
                delay: CODE_PHASE.ENTER_DELAY + tok.staggerIndex * 0.02,
              }}
            >
              {tok.content}
            </motion.span>
          )
        }

        // Unchanged token — use layoutId for FLIP positioning
        return (
          <motion.span
            key={tok.key}
            layoutId={tok.key}
            layout
            style={style}
            initial={false}
            animate={{ opacity: 1, color: tok.color }}
            transition={{
              layout: {
                duration: CODE_PHASE.LAYOUT_DUR,
                ease: easeInOut,
                delay: CODE_PHASE.EXIT_DUR,
              },
              color: {
                duration: CODE_PHASE.LAYOUT_DUR,
                ease: easeInOut,
                delay: CODE_PHASE.EXIT_DUR,
              },
              opacity: { duration: 0 },
            }}
          >
            {tok.content}
          </motion.span>
        )
      })}
    </AnimatePresence>
  )
}
