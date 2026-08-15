import { parseReadme } from './markdown-parser'

export interface ExtractedDocument {
  fileName: string
  fileType: 'markdown' | 'text' | 'json' | 'yaml' | 'code' | 'pdf' | 'doc'
  title: string
  rawText: string
  summaryBriefing: string
}

/**
 * Extract clean text and structured briefing from an uploaded File or raw string.
 */
export async function extractDocumentContent(file: File): Promise<ExtractedDocument> {
  const fileName = file.name
  const extension = fileName.split('.').pop()?.toLowerCase() || ''
  
  let rawText = ''
  try {
    rawText = await file.text()
  } catch (err) {
    console.error('Failed to read file as text:', err)
    rawText = ''
  }

  // Determine file type
  let fileType: ExtractedDocument['fileType'] = 'text'
  if (['md', 'markdown', 'mdown'].includes(extension)) {
    fileType = 'markdown'
  } else if (['json'].includes(extension)) {
    fileType = 'json'
  } else if (['yaml', 'yml'].includes(extension)) {
    fileType = 'yaml'
  } else if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'sql'].includes(extension)) {
    fileType = 'code'
  } else if (['pdf'].includes(extension)) {
    fileType = 'pdf'
  } else if (['doc', 'docx'].includes(extension)) {
    fileType = 'doc'
  }

  // Generate Title & Summary Briefing
  let title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
  // Capitalize title
  title = title.charAt(0).toUpperCase() + title.slice(1)

  let summaryBriefing = ''

  if (fileType === 'markdown') {
    const parsed = parseReadme(rawText)
    if (parsed.title && parsed.title !== 'Presentation') {
      title = parsed.title
    }
    summaryBriefing = `[DOCUMENT: ${fileName}]\nTITLE: ${title}\n`
    parsed.sections.forEach((s) => {
      summaryBriefing += `\n### ${s.title}\n`
      if (s.content) summaryBriefing += `${s.content.slice(0, 300)}\n`
      if (s.elements.length > 0) {
        summaryBriefing += s.elements.slice(0, 8).map((e) => `- ${e}`).join('\n') + '\n'
      }
    })
  } else if (fileType === 'json' || fileType === 'yaml') {
    summaryBriefing = `[SPECIFICATION: ${fileName}]\nTITLE: ${title}\nFORMAT: ${fileType.toUpperCase()}\n\n${rawText.slice(0, 2000)}`
  } else {
    summaryBriefing = `[DOCUMENT: ${fileName}]\nTITLE: ${title}\n\n${rawText.slice(0, 2500)}`
  }

  return {
    fileName,
    fileType,
    title,
    rawText,
    summaryBriefing: summaryBriefing.trim(),
  }
}
