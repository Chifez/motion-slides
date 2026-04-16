import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CodeContent } from '../../../types'

interface Props { content: CodeContent }

// Singleton highlighter promise — created once
let highlighterPromise: Promise<import('shiki').Highlighter> | null = null

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(({ createHighlighter }) =>
      createHighlighter({
        themes: ['github-dark'],
        langs: ['javascript', 'typescript', 'python', 'bash', 'json', 'html', 'css', 'sql'],
      }),
    )
  }
  return highlighterPromise
}

interface HighlightedLine {
  id: string   // stable key for AnimatePresence
  html: string // pre-rendered HTML for each line
}

// Hash based on the line content + its index to keep same-content lines across slides stable
function lineKey(text: string, index: number) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0
  return `L${index}-${Math.abs(h).toString(36)}`
}

function splitHighlightedHtml(html: string): HighlightedLine[] {
  // Shiki wraps each line in <span class="line">…</span>
  const lineRegex = /<span class="line">(.*?)<\/span>/gs
  const lines: HighlightedLine[] = []
  let match: RegExpExecArray | null
  let i = 0
  while ((match = lineRegex.exec(html)) !== null) {
    lines.push({ id: lineKey(match[1], i), html: match[1] || '&#8203;' })
    i++
  }
  return lines
}

export function CodeElement({ content }: Props) {
  const [lines, setLines] = useState<HighlightedLine[]>([])

  // Debounce highlighting so it doesn't fire on every keystroke
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)

    // Immediate first-render (no debounce for the first paint)
    const debounceMs = lines.length === 0 ? 0 : 300

    timer.current = setTimeout(async () => {
      try {
        const hl = await getHighlighter()
        const lang = (content.language as Parameters<typeof hl.codeToHtml>[1]['lang']) || 'javascript'
        const html = hl.codeToHtml(content.value || ' ', { lang, theme: 'github-dark' })
        setLines(splitHighlightedHtml(html))
      } catch {
        // Fallback: plain lines
        setLines(
          content.value.split('\n').map((text, i) => ({
            id: lineKey(text, i),
            html: text || '&#8203;',
          })),
        )
      }
    }, debounceMs)

    return () => { if (timer.current) clearTimeout(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.value, content.language])

  return (
    <div className="font-mono text-[13px] leading-relaxed bg-[#0d1117] border border-white/[0.08] rounded-lg px-3.5 py-3 w-full h-full overflow-hidden">
      <AnimatePresence mode="sync" initial={false}>
        {lines.map((line) => (
          <motion.span
            key={line.id}
            layout="position"
            className="block whitespace-pre min-h-[1.4em]"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            dangerouslySetInnerHTML={{ __html: line.html }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
