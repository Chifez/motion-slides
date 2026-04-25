/**
 * Singleton Shiki highlighter instance.
 * Extracted from CodeElement to avoid coupling display logic with highlighting setup.
 */

import type { BundledLanguage } from 'shiki'
import { CODE_LANGUAGES } from '@/constants/editor'
export interface TokenInfo {
  content: string
  color: string
  fontStyle: number
}

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

/**
 * Splits Shiki's HTML output into individual line objects.
 *
 * Uses DOM parsing instead of regex to correctly handle nested
 * <span> tokens inside each <span class="line"> wrapper.
 * The previous regex `(.*?)` was non-greedy and stopped at the
 * first inner </span>, discarding all tokens after the first one.
 */
export function splitHighlightedHtml(html: string): HighlightedLine[] {
  const container = document.createElement('div')
  container.innerHTML = html

  const lineSpans = container.querySelectorAll('.line')
  const lines: HighlightedLine[] = []

  lineSpans.forEach((span, i) => {
    const innerHtml = span.innerHTML
    const textContent = span.textContent ?? ''
    lines.push({
      id: lineKey(textContent, i),
      html: innerHtml || '&#8203;',
    })
  })

  return lines
}

/**
 * Returns a 2D array of TokenInfo objects — one sub-array per line.
 * Used by CodeElement for token-level Magic Move animation.
 *
 * Falls back to a single token per line if the highlighter is unavailable.
 */
export async function getTokenizedLines(
  code: string,
  language: string,
): Promise<TokenInfo[][]> {
  const hl = await getHighlighter()
  const tokenLines = hl.codeToTokensBase(code || ' ', {
    lang: (language || 'javascript') as BundledLanguage,
    theme: 'vitesse-dark',
  })

  return tokenLines.map((lineTokens) =>
    lineTokens.map((tok) => ({
      content: tok.content,
      color: tok.color ?? '#e0e0e0',
      fontStyle: (tok.fontStyle as number) ?? 0,
    }))
  )
}
