import fs from 'fs'
import path from 'path'

export interface StyleGuideTokens {
  light: Record<string, string>
  dark:  Record<string, string>
}

/**
 * Extracts --ms-* HSL tokens from styles.css to provide ground truth to the AI.
 */
export function parseStyleTokens(): StyleGuideTokens {
  try {
    const cssPath = path.join(process.cwd(), 'apps/web/src/styles.css')
    if (!fs.existsSync(cssPath)) {
      return { light: {}, dark: {} }
    }

    const css = fs.readFileSync(cssPath, 'utf-8')
    const tokens: StyleGuideTokens = { light: {}, dark: {} }

    // Match :root and .dark blocks
    const rootMatch = css.match(/:root\s*{([^}]+)}/)
    const darkMatch = css.match(/\.dark\s*{([^}]+)}/)

    if (rootMatch) {
      tokens.light = extractVars(rootMatch[1])
    }
    if (darkMatch) {
      tokens.dark = extractVars(darkMatch[1])
    }

    return tokens
  } catch (err) {
    console.error('Failed to parse style tokens:', err)
    return { light: {}, dark: {} }
  }
}

function extractVars(block: string): Record<string, string> {
  const vars: Record<string, string> = {}
  const lines = block.split(';')
  for (const line of lines) {
    const [key, val] = line.split(':')
    if (key && val && key.trim().startsWith('--ms-')) {
      vars[key.trim()] = val.trim()
    }
  }
  return vars
}
