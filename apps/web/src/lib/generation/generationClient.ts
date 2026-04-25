import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { GeneratedPresentationSchema, type GeneratedPresentation } from './slideGenerationSchema'
import { SYSTEM_PROMPT } from './promptBuilder'

/**
 * AI Provider Factory
 * Switches between OpenAI (dev) and Anthropic (prod) based on env vars.
 */
function getModel() {
  const provider = process.env.AI_PROVIDER || 'openai'
  
  if (provider === 'anthropic') {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
    // User requested Claude Sonnet 4.6
    return anthropic('claude-sonnet-4-6')
  }

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  return openai('gpt-4o') // Best for structured output in development
}

export interface GenerationOptions {
  userPrompt: string
  maxTokens?: number
}

export async function generatePresentation(
  opts: GenerationOptions,
): Promise<GeneratedPresentation> {
  const model = getModel()

  const { object } = await generateObject({
    model,
    schema: GeneratedPresentationSchema,
    system: SYSTEM_PROMPT,
    prompt: opts.userPrompt,
    maxTokens: opts.maxTokens ?? 8000,
  })

  return object
}
