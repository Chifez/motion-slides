import { marked } from 'marked'

export interface ParsedSection {
  title:    string
  content:  string
  level:    number
  elements: string[]
}

export interface ParsedReadme {
  title:    string
  sections: ParsedSection[]
}

/**
 * parseReadme
 *
 * Uses 'marked' to lex the markdown and extract a flat list of sections
 * based on headers (h1, h2, h3).
 */
export function parseReadme(markdown: string): ParsedReadme {
  const tokens = marked.lexer(markdown)
  const sections: ParsedSection[] = []
  let title = 'Presentation'
  let currentSection: ParsedSection | null = null

  for (const token of tokens) {
    if (token.type === 'heading') {
      if (token.depth === 1 && sections.length === 0) {
        title = token.text
      }

      currentSection = {
        title:    token.text,
        content:  '',
        level:    token.depth,
        elements: []
      }
      sections.push(currentSection)
    } else if (currentSection) {
      if (token.type === 'text' || token.type === 'paragraph') {
        currentSection.content += token.text + '\n'
      } else if (token.type === 'list') {
        token.items.forEach(item => currentSection?.elements.push(item.text))
      } else if (token.type === 'code') {
        currentSection.elements.push(`CODE:${token.lang ?? 'text'}:${token.text}`)
      }
    }
  }

  return { title, sections }
}

/**
 * buildReadmeBriefing
 *
 * Compresses the parsed readme into a prompt-friendly string.
 */
export function buildReadmeBriefing(parsed: ParsedReadme, maxSlides: number): string {
  let briefing = `TITLE: ${parsed.title}\n\n`
  
  parsed.sections.forEach(s => {
    briefing += `## ${s.title}\n`
    if (s.content) briefing += `${s.content.slice(0, 300)}\n`
    if (s.elements.length > 0) {
      briefing += s.elements.map(e => `- ${e}`).join('\n') + '\n'
    }
    briefing += '\n'
  })

  return briefing
}
