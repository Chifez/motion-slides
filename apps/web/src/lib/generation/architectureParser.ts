export interface ParsedComponent {
  name: string
  tier: 'client' | 'edge' | 'logic' | 'data' | 'external'
}

export interface ParsedArchitecture {
  description: string
  components: ParsedComponent[]
  flows: string[]
  tiers: {
    client: string[]
    edge: string[]
    logic: string[]
    data: string[]
    external: string[]
  }
}

const TIER_KEYWORDS: Record<ParsedComponent['tier'], RegExp> = {
  client:   /\b(web app|react|vue|angular|frontend|mobile|ios|android|browser|client|ui|spa|pwa|nextjs|nuxt)\b/i,
  edge:     /\b(cdn|cloudfront|nginx|load.?balancer|reverse.?proxy|api.?gateway|edge|waf|firewall)\b/i,
  logic:    /\b(service|server|lambda|function|worker|microservice|api|backend|handler|processor|engine|queue|bus|pubsub|kafka|rabbitmq|sqs|sns)\b/i,
  data:     /\b(database|db|postgres|mysql|mongodb|redis|cache|s3|bucket|storage|elasticsearch|dynamodb|firestore|sqlite|rds|aurora|cosmos)\b/i,
  external: /\b(stripe|twilio|sendgrid|oauth|auth0|cognito|third.?party|external|provider|webhook|saas)\b/i,
}

/**
 * @param name - Raw component name from user input.
 * @returns The tier this component belongs to based on keyword matching.
 */
function classifyTier(name: string): ParsedComponent['tier'] {
  for (const [tier, pattern] of Object.entries(TIER_KEYWORDS) as [ParsedComponent['tier'], RegExp][]) {
    if (pattern.test(name)) return tier
  }
  return 'logic'
}

/**
 * parseArchitecture
 *
 * Tier-aware parser that extracts components from a text description and
 * categorizes them into frontend/edge/logic/data/external groups. This
 * structured briefing enables the AI to apply correct zone placement.
 */
export function parseArchitecture(text: string): ParsedArchitecture {
  const lines  = text.split('\n').filter(l => l.trim().length > 0)
  const seen   = new Set<string>()
  const components: ParsedComponent[] = []
  const flows: string[] = []

  for (const line of lines) {
    const isFlow = line.includes('->') || line.includes('-->') || /connects? to/i.test(line)

    if (isFlow) {
      flows.push(line)
      const parts = line.split(/->|-->|\bconnects? to\b/i)
      for (const part of parts) {
        const clean = part.trim().replace(/[\[\](){}]/g, '').trim()
        if (clean && !seen.has(clean.toLowerCase())) {
          seen.add(clean.toLowerCase())
          components.push({ name: clean, tier: classifyTier(clean) })
        }
      }
    } else {
      const clean = line.trim().replace(/[\[\](){}]/g, '').trim()
      if (clean && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase())
        components.push({ name: clean, tier: classifyTier(clean) })
      }
    }
  }

  const tiers = {
    client:   components.filter(c => c.tier === 'client').map(c => c.name),
    edge:     components.filter(c => c.tier === 'edge').map(c => c.name),
    logic:    components.filter(c => c.tier === 'logic').map(c => c.name),
    data:     components.filter(c => c.tier === 'data').map(c => c.name),
    external: components.filter(c => c.tier === 'external').map(c => c.name),
  }

  return { description: text, components, flows, tiers }
}

/**
 * buildArchitectureBriefing
 *
 * Converts a parsed architecture into a structured LLM briefing that
 * explicitly communicates tier membership to improve zone placement.
 */
export function buildArchitectureBriefing(parsed: ParsedArchitecture): string {
  const lines: string[] = [
    `Architecture Description:\n${parsed.description}`,
    '',
    '--- Tier Classification ---',
  ]

  if (parsed.tiers.client.length > 0)   lines.push(`Client Tier: ${parsed.tiers.client.join(', ')}`)
  if (parsed.tiers.edge.length > 0)     lines.push(`Edge/Gateway Tier: ${parsed.tiers.edge.join(', ')}`)
  if (parsed.tiers.logic.length > 0)    lines.push(`Logic/Service Tier: ${parsed.tiers.logic.join(', ')}`)
  if (parsed.tiers.data.length > 0)     lines.push(`Data/Storage Tier: ${parsed.tiers.data.join(', ')}`)
  if (parsed.tiers.external.length > 0) lines.push(`External Services: ${parsed.tiers.external.join(', ')}`)

  if (parsed.flows.length > 0) {
    lines.push('', '--- Detected Flows ---')
    lines.push(...parsed.flows)
  }

  lines.push('', '--- Instruction ---')
  lines.push('Use the tier classification above to assign each component to the correct canvas zone. Do not mix tiers on the same horizontal level.')

  return lines.join('\n')
}
