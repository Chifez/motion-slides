import { describe, it, expect } from 'vitest'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { GeneratedPresentationLaxSchema } from './slideGenerationSchema'
import { findOpenAiSchemaViolations } from './openAiSchemaGuard'

describe('OpenAI structured output schema compatibility', () => {
  it('should have every object property listed in required (OpenAI strict mode)', () => {
    const jsonSchema = zodToJsonSchema(GeneratedPresentationLaxSchema, {
      name: 'response',
      $refStrategy: 'none',
    })

    const violations = findOpenAiSchemaViolations(jsonSchema)
    expect(violations).toEqual([])
  })
})
