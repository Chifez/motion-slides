export interface ParsedArchitecture {
  description: string
  components:  string[]
  flows:        string[]
}

/**
 * parseArchitecture
 * 
 * Extracts components and flows from a text description.
 * This is a simple heuristic parser; the LLM will do the heavy lifting.
 */
export function parseArchitecture(text: string): ParsedArchitecture {
  const lines      = text.split('\n').filter(l => l.trim().length > 0)
  const components = new Set<string>()
  const flows      = []

  for (const line of lines) {
    // Look for arrows or "connects to" phrases
    if (line.includes('->') || line.includes('-->') || line.toLowerCase().includes('connects to')) {
      flows.push(line)
      const parts = line.split(/[->]|connects to/i)
      parts.forEach(p => {
        const clean = p.trim().replace(/[\[\](){}]/g, '')
        if (clean) components.add(clean)
      })
    } else {
      const clean = line.trim().replace(/[\[\](){}]/g, '')
      if (clean) components.add(clean)
    }
  }

  return {
    description: text,
    components:  Array.from(components),
    flows
  }
}

export function buildArchitectureBriefing(parsed: ParsedArchitecture): string {
  let b = `Architecture Description:\n${parsed.description}\n\n`
  b += `Detected Components:\n${parsed.components.join(', ')}\n\n`
  if (parsed.flows.length > 0) {
    b += `Detected Flows:\n${parsed.flows.join('\n')}\n`
  }
  return b
}
