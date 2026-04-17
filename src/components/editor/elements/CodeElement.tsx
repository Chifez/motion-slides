import { useEffect, useState, useRef } from 'react'
import type { CodeContent } from '@/types'
import { CODE_DEBOUNCE_MS } from '@/constants/animation'
import { getHighlighter, splitHighlightedHtml, lineKey, type HighlightedLine } from '@/lib/shikiHighlighter'

interface Props { content: CodeContent }

export function CodeElement({ content }: Props) {
  const [lines, setLines] = useState<HighlightedLine[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // This useEffect is correct — it syncs with an external system (Shiki highlighter)
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)

    const debounceMs = lines.length === 0 ? 0 : CODE_DEBOUNCE_MS

    timer.current = setTimeout(async () => {
      try {
        const hl = await getHighlighter()
        const lang = content.language || 'javascript'
        const html = hl.codeToHtml(content.value || ' ', { lang, theme: 'vitesse-dark' })
        setLines(splitHighlightedHtml(html))
      } catch {
        setLines(
          content.value.split('\n').map((text, i) => ({
            id: lineKey(text, i),
            html: text.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '&#8203;',
          })),
        )
      }
    }, debounceMs)

    return () => { if (timer.current) clearTimeout(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.value, content.language])

  return (
    <div className="font-mono text-[12px] leading-relaxed bg-[#121212] rounded-lg px-3.5 py-3 w-full h-full overflow-auto">
      <div className="text-[9px] uppercase tracking-wider text-neutral-600 mb-2 select-none">
        {content.language || 'javascript'}
      </div>
      {lines.map((line) => (
        <div
          key={line.id}
          className="whitespace-pre min-h-[1.4em]"
          dangerouslySetInnerHTML={{ __html: line.html }}
        />
      ))}
    </div>
  )
}
