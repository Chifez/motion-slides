/**
 * generationClient.ts
 *
 * Adaptive AI generation client supporting OpenAI (dev) and Anthropic (prod).
 * Injects contextual icon paths using RAG before calling the LLM.
 */

import { createOpenAI }    from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateObject }  from 'ai'
import { 
  GeneratedPresentationSchema, 
  type GeneratedPresentation 
} from './slideGenerationSchema'
import { 
  SYSTEM_PROMPT, 
  buildReadmePrompt, 
  buildArchitecturePrompt 
} from './promptBuilder'
import { buildIconHotlist } from './iconResolver'

// ─── Provider Factory ─────────────────────────────────────────────────────────

function getModel() {
  const provider = process.env.AI_PROVIDER || 'openai'
  
  if (provider === 'anthropic') {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
    // Claude 3.5 Sonnet is highly recommended for structured output
    return anthropic('claude-3-5-sonnet-20240620')
  }

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  return openai('gpt-4o')
}

// ─── README Mode ──────────────────────────────────────────────────────────────

export interface ReadmeGenerationOptions {
  briefing:    string
  rawMarkdown: string
  slideCount:  number
  style:       'technical' | 'executive' | 'tutorial'
  theme:       'dark' | 'light' | 'auto'
}

export async function generateFromReadme(
  opts: ReadmeGenerationOptions,
): Promise<GeneratedPresentation> {
  const availableIcons = buildIconHotlist(opts.rawMarkdown)
  const userPrompt = buildReadmePrompt({
    briefing:      opts.briefing,
    slideCount:    opts.slideCount,
    style:         opts.style,
    theme:         opts.theme,
    availableIcons,
  })
  
  return callLLM(userPrompt, 8000)
}

// ─── Architecture Mode ────────────────────────────────────────────────────────

export interface ArchGenerationOptions {
  briefing:     string
  rawInput:     string
  diagramStyle: 'generic' | 'aws' | 'gcp' | 'minimal'
  slideCount:   number
  theme:        'dark' | 'light' | 'auto'
}

export async function generateFromArchitecture(
  opts: ArchGenerationOptions,
): Promise<GeneratedPresentation> {
  const availableIcons = buildIconHotlist(opts.rawInput)
  const userPrompt = buildArchitecturePrompt({
    briefing:      opts.briefing,
    diagramStyle:  opts.diagramStyle,
    slideCount:    opts.slideCount,
    theme:         opts.theme,
    availableIcons,
  })
  
  return callLLM(userPrompt, 12000)
}

// ─── Core LLM Call ────────────────────────────────────────────────────────────

async function callLLM(
  userPrompt: string,
  maxTokens:  number,
): Promise<GeneratedPresentation> {
  const model = getModel()

  const { object } = await generateObject({
    model,
    schema: GeneratedPresentationSchema,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    // @ts-ignore - maxTokens might not be typed depending on the exact 'ai' sdk version
    maxTokens: maxTokens,
    // Lower temperature for more stable JSON formatting
    temperature: 0.3,
  })

  return object
}

/**
 * @deprecated Use generateFromReadme or generateFromArchitecture instead.
 * Kept for backward compatibility during transition.
 */
export async function generatePresentation(opts: { userPrompt: string, maxTokens?: number }) {
  return callLLM(opts.userPrompt, opts.maxTokens ?? 8000)
}
