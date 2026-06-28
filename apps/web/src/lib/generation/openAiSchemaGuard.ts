/**
 * Validates JSON Schema trees against OpenAI structured-output rules:
 * every key in `properties` must appear in `required`.
 */

export function findOpenAiSchemaViolations(schema: unknown, path = 'root'): string[] {
  if (!schema || typeof schema !== 'object') return []

  const node = schema as Record<string, unknown>
  const issues: string[] = []

  if (node.type === 'object' && node.properties && typeof node.properties === 'object') {
    const properties = node.properties as Record<string, unknown>
    const propKeys = Object.keys(properties)
    const required = Array.isArray(node.required) ? (node.required as string[]) : []

    for (const key of propKeys) {
      if (!required.includes(key)) {
        issues.push(`${path}: missing '${key}' in required`)
      }
      issues.push(...findOpenAiSchemaViolations(properties[key], `${path}.${key}`))
    }
  }

  if (node.items) {
    issues.push(...findOpenAiSchemaViolations(node.items, `${path}[]`))
  }

  for (const branch of ['anyOf', 'oneOf', 'allOf'] as const) {
    const branches = node[branch]
    if (Array.isArray(branches)) {
      branches.forEach((sub, index) => {
        issues.push(...findOpenAiSchemaViolations(sub, `${path}.${branch}[${index}]`))
      })
    }
  }

  if (node.$defs && typeof node.$defs === 'object') {
    for (const [name, def] of Object.entries(node.$defs as Record<string, unknown>)) {
      issues.push(...findOpenAiSchemaViolations(def, `${path}#$defs.${name}`))
    }
  }

  if (node.definitions && typeof node.definitions === 'object') {
    for (const [name, def] of Object.entries(node.definitions as Record<string, unknown>)) {
      issues.push(...findOpenAiSchemaViolations(def, `${path}#definitions.${name}`))
    }
  }

  return issues
}
