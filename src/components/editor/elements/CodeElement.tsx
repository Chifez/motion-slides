import { useEffect, useState, useRef } from 'react'
import type { CodeContent } from '../../../types'

interface Props { content: CodeContent }

// Supported languages — used by both CodeElement and InspectorPanel
export const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Bash' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
] as const

// Singleton highlighter promise — created once
let highlighterPromise: Promise<import('shiki').Highlighter> | null = null

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(({ createHighlighter }) =>
      createHighlighter({
        themes: ['vitesse-dark'],
        langs: CODE_LANGUAGES.map((l) => l.value),
      }),
    )
  }
  return highlighterPromise
}

interface HighlightedLine {
  id: string
  html: string
}

function lineKey(text: string, index: number) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0
  return `L${index}-${Math.abs(h).toString(36)}`
}

function splitHighlightedHtml(html: string): HighlightedLine[] {
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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)

    const debounceMs = lines.length === 0 ? 0 : 350

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
      {/* Language badge */}
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
