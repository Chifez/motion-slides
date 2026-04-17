/**
 * Singleton Shiki highlighter instance.
 * Extracted from CodeElement to avoid coupling display logic with highlighting setup.
 */

import { CODE_LANGUAGES } from '@/constants/editor'

let highlighterPromise: Promise<import('shiki').Highlighter> | null = null

export function getHighlighter() {
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

export interface HighlightedLine {
  id: string
  html: string
}

/** Hash-based key for stable line identity during animations */
export function lineKey(text: string, index: number) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0
  return `L${index}-${Math.abs(h).toString(36)}`
}

/** Splits Shiki's HTML output into individual line objects */
export function splitHighlightedHtml(html: string): HighlightedLine[] {
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
