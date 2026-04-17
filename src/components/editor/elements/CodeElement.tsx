import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CodeContent } from '@/types'
// MotionContext import removed — we no longer gate on isTransitioning
import { CODE_DEBOUNCE_MS } from '@/constants/animation'
import { getHighlighter, splitHighlightedHtml, type HighlightedLine } from '@/lib/shikiHighlighter'
import { diffCodeLines, type LineDiff, CODE_PHASE } from '@/lib/motionEngine'

interface Props { content: CodeContent }

/**
 * CodeElement — Phased "animate-code.com" style animation sequence:
 *
 *   Phase 0 (immediate):     Removed lines exit (height collapses, fades out)
 *   Phase 1 (after exit):    Container and unchanged lines reflow to new positions
 *   Phase 2 (after reflow):  New lines fade/slide in with cascade stagger
 *
 * Each phase waits for the previous one to finish before starting,
 * so the user always sees: space opens up → content arrives.
 *
 * Spring physics are critically damped (no bounce).
 */
export function CodeElement({ content }: Props) {
  const [lines, setLines] = useState<HighlightedLine[]>([])
  const [lineDiffs, setLineDiffs] = useState<LineDiff[]>([])
  const prevLinesRef = useRef<HighlightedLine[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)

    const debounceMs = lines.length === 0 ? 0 : CODE_DEBOUNCE_MS

    timer.current = setTimeout(async () => {
      try {
        const hl = await getHighlighter()
        const lang = content.language || 'javascript'
        const html = hl.codeToHtml(content.value || ' ', { lang, theme: 'vitesse-dark' })
        const newLines = splitHighlightedHtml(html)

        // Diff whenever we have a previous state.
        // No isTransitioning gate needed — the diff engine handles
        // the "no change" case correctly by returning all lines as unchanged.
        if (prevLinesRef.current.length > 0) {
          setLineDiffs(diffCodeLines(prevLinesRef.current, newLines))
        } else {
          setLineDiffs(newLines.map((l, i) => ({
            key: `line-init-${i}`,
            html: l.html,
            status: 'unchanged' as const,
            staggerIndex: 0,
          })))
        }

        prevLinesRef.current = newLines
        setLines(newLines)
      } catch {
        const fallback = content.value.split('\n').map((text, i) => ({
          id: `fallback-${i}`,
          html: text.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '&#8203;',
        }))
        setLineDiffs(fallback.map((l, i) => ({
          key: `line-init-${i}`,
          html: l.html,
          status: 'unchanged' as const,
          staggerIndex: 0,
        })))
        prevLinesRef.current = fallback
        setLines(fallback)
      }
    }, debounceMs)

    return () => { if (timer.current) clearTimeout(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.value, content.language])

  // ── Easing curve: ease-in-out cubic (no bounce, smooth deceleration) ──
  const EASE_OUT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]
  const EASE_IN_OUT: [number, number, number, number] = [0.37, 0, 0.63, 1]

  return (
    <motion.div
      layout
      className="font-mono text-[12px] leading-relaxed bg-[#121212] rounded-lg px-3.5 py-3 w-full h-full overflow-auto"
      // Phase 1: container resizes with ease-in-out — waits for exits to finish
      transition={{
        layout: {
          duration: CODE_PHASE.LAYOUT_DUR,
          ease: EASE_IN_OUT,
          delay: CODE_PHASE.EXIT_DUR,  // starts after removed lines are gone
        },
      }}
    >
      <div className="text-[9px] uppercase tracking-wider text-neutral-600 mb-2 select-none">
        {content.language || 'javascript'}
      </div>
      <AnimatePresence mode="popLayout">
        {lineDiffs.map((line) => {

          // ── UNCHANGED lines ──
          // Use layoutId so framer-motion tracks them and slides them
          // to the new Y position as the container expands/contracts.
          // Delay matches container — they move in lockstep with Phase 1.
          if (line.status === 'unchanged') {
            return (
              <motion.div
                key={line.key}
                layoutId={line.key}
                layout
                className="whitespace-pre min-h-[1.4em]"
                dangerouslySetInnerHTML={{ __html: line.html }}
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
              />
            )
          }

          // ── ADDED lines ──
          // Phase 2: all enter together once the container resize is fully complete.
          if (line.status === 'added') {
            return (
              <motion.div
                key={line.key}
                layout
                className="whitespace-pre min-h-[1.4em] overflow-hidden"
                dangerouslySetInnerHTML={{ __html: line.html }}
                initial={{ opacity: 0, y: 6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
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
              />
            )
          }

          // ── REMOVED lines ──
          // Phase 0: exit immediately (no delay) so space collapses
          // before anything else moves. Quick so Phase 1 can start fast.
          const exitDelay = line.staggerIndex * (CODE_PHASE.EXIT_DUR / 3)
          return (
            <motion.div
              key={line.key}
              layout
              className="whitespace-pre min-h-[1.4em] overflow-hidden"
              dangerouslySetInnerHTML={{ __html: line.html }}
              initial={false}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                height: 0,
                transition: {
                  duration: CODE_PHASE.EXIT_DUR,
                  ease: EASE_IN_OUT,
                  delay: exitDelay,
                },
              }}
              transition={{
                layout: { duration: CODE_PHASE.LAYOUT_DUR, ease: EASE_IN_OUT },
              }}
            />
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}
