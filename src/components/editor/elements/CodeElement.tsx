import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CodeContent } from '@/types'
import { useMotionContext } from '@/context/MotionContext'
import { CODE_DEBOUNCE_MS } from '@/constants/animation'
import { getHighlighter, splitHighlightedHtml, type HighlightedLine } from '@/lib/shikiHighlighter'
import { diffCodeLines, type LineDiff } from '@/lib/motionEngine'

interface Props { content: CodeContent }

export function CodeElement({ content }: Props) {
  const [lines, setLines] = useState<HighlightedLine[]>([])
  const [lineDiffs, setLineDiffs] = useState<LineDiff[]>([])
  const prevLinesRef = useRef<HighlightedLine[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { isTransitioning, durationSec, ease } = useMotionContext()

  // This useEffect is correct — it syncs with an external system (Shiki highlighter)
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)

    const debounceMs = lines.length === 0 ? 0 : CODE_DEBOUNCE_MS

    timer.current = setTimeout(async () => {
      try {
        const hl = await getHighlighter()
        const lang = content.language || 'javascript'
        const html = hl.codeToHtml(content.value || ' ', { lang, theme: 'vitesse-dark' })
        const newLines = splitHighlightedHtml(html)

        // Compute diff for animation
        if (isTransitioning && prevLinesRef.current.length > 0) {
          const diff = diffCodeLines(prevLinesRef.current, newLines)
          setLineDiffs(diff)
        } else {
          // No diff needed — just show all lines as unchanged
          setLineDiffs(newLines.map((l, i) => ({
            key: `line-${i}`,
            html: l.html,
            status: 'unchanged' as const,
          })))
        }

        prevLinesRef.current = newLines
        setLines(newLines)
      } catch {
        const fallbackLines = content.value.split('\n').map((text, i) => ({
          id: `fallback-${i}`,
          html: text.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '&#8203;',
        }))
        setLineDiffs(fallbackLines.map((l, i) => ({
          key: `line-${i}`,
          html: l.html,
          status: 'unchanged' as const,
        })))
        prevLinesRef.current = fallbackLines
        setLines(fallbackLines)
      }
    }, debounceMs)

    return () => { if (timer.current) clearTimeout(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.value, content.language])

  const lineTransition = {
    duration: durationSec * 0.5,
    ease,
  }

  return (
    <motion.div
      layout
      className="font-mono text-[12px] leading-relaxed bg-[#121212] rounded-lg px-3.5 py-3 w-full h-full overflow-auto"
      transition={{ layout: { duration: durationSec, ease } }}
    >
      <div className="text-[9px] uppercase tracking-wider text-neutral-600 mb-2 select-none">
        {content.language || 'javascript'}
      </div>
      <AnimatePresence mode="popLayout">
        {lineDiffs.map((line) => (
          <motion.div
            key={line.key}
            layout
            className="whitespace-pre min-h-[1.4em]"
            dangerouslySetInnerHTML={{ __html: line.html }}
            initial={
              line.status === 'added'
                ? { opacity: 0, x: -15, height: 0 }
                : false
            }
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={
              line.status === 'removed'
                ? { opacity: 0, x: 15, height: 0 }
                : { opacity: 0 }
            }
            transition={lineTransition}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
