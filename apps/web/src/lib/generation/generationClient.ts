/**
 * generationClient.ts
 */

import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { 
  GeneratedPresentationSchema,
  GeneratedPresentationLaxSchema,
  formatZodIssues,
  type GeneratedPresentation,
  type AISlideType
} from './slideGenerationSchema'
import { 
  SYSTEM_PROMPT, 
  buildArchitecturePrompt,
  buildRefinementPrompt,
  buildReadmePrompt
} from './promptBuilder'
import { buildIconHotlist } from './iconResolver'
import { detectBlueprint } from './diagramBlueprints'
import { computeLayerReflow, formatReflowInstructions } from './reflowEngine'
import { parseStyleTokens, type StyleGuideTokens } from './styleTokenParser'

// ─── Provider Factory ─────────────────────────────────────────────────────────

function getModel(modelName = 'gpt-4o') {
  if (modelName.includes('claude')) {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    return anthropic(modelName)
  }
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openai(modelName)
}

const ENRICHED_SYSTEM_PROMPT = buildEnrichedSystemPrompt()

function buildEnrichedSystemPrompt(): string {
  const tokens = parseStyleTokens()
  return SYSTEM_PROMPT + `
<style_guide>
Use ONLY HSL tokens for colors.
LIGHT MODE: --ms-bg-base: ${tokens.light['--ms-bg-base']}, --ms-accent: ${tokens.light['--ms-accent']}
DARK MODE: --ms-bg-base: ${tokens.dark['--ms-bg-base']}, --ms-accent: ${tokens.dark['--ms-accent']}
</style_guide>
`
}

// ─── Architecture Mode ────────────────────────────────────────────────────────

export async function generateFromArchitecture(opts: any): Promise<GeneratedPresentation> {
  const hotlist = buildIconHotlist(opts.description)
  const blueprint = detectBlueprint(opts.description)
  
  const userPrompt = buildArchitecturePrompt({ 
    briefing: opts.description,
    hotlist,
    blueprint,
    slideCount: opts.slideCount
  })

  return callLLMWithCorrection(userPrompt, 12000, opts.model)
}

// ─── README Mode ──────────────────────────────────────────────────────────────

export async function generateFromReadme(opts: any): Promise<GeneratedPresentation> {
  const hotlist = buildIconHotlist(opts.markdown)
  const userPrompt = buildReadmePrompt({ ...opts, briefing: opts.markdown, hotlist })
  return callLLMWithCorrection(userPrompt, 10000, opts.model)
}

// ─── Refinement Mode ──────────────────────────────────────────────────────────

export async function refinePresentation(opts: any): Promise<GeneratedPresentation> {
  const userPrompt = buildRefinementPrompt(opts)
  return callLLMWithCorrection(userPrompt, 12000, opts.model)
}

// ─── Core LLM Call with Correction Loop ───────────────────────────────────────

async function callLLMWithCorrection(
  userPrompt: string,
  maxTokens: number,
  modelName?: string
): Promise<GeneratedPresentation> {
  // Pass 1: Primary Generation (uses Lax Schema)
  const presentation = await callLLM(userPrompt, maxTokens, modelName)
  
  // Validation Pass (uses Strict Schema)
  const result = GeneratedPresentationSchema.safeParse(presentation)
  if (!result.success) {
    console.warn('[generationClient] Layout/tier validation violations found. Triggering self-correction loop...')
    console.warn(formatZodIssues(result.error.issues))
    return await selfCorrect(presentation, result.error.issues, modelName)
  }
  
  return presentation
}

async function selfCorrect(
  presentation: GeneratedPresentation, 
  issues: any[],
  modelName?: string
): Promise<GeneratedPresentation> {
  const fixedSlides = [...presentation.slides]
  let changed = false

  // Group issues by slide
  const slideIssuesMap = new Map<number, any[]>()
  issues.forEach(issue => {
    if (issue.path[0] === 'slides') {
      const idx = issue.path[1] as number
      if (!slideIssuesMap.has(idx)) slideIssuesMap.set(idx, [])
      slideIssuesMap.get(idx)!.push(issue)
    }
  })

  for (const [idx, slideIssues] of slideIssuesMap.entries()) {
    const slide = presentation.slides[idx]
    
    // Pillar 4: Mathematical Layer Reflow
    const reflow = computeLayerReflow(slide, slideIssues)
    const reflowInstructions = formatReflowInstructions(reflow)
    
    console.log(`[generationClient] Reflowing slide ${idx} with ${reflowInstructions.length} instructions`)

    const correctionPrompt = buildRefinementPrompt({
      previousPresentation: { slides: [slide] },
      instruction: "The following slide has layout/schema violations. Apply the mandatory position fixes exactly.",
      reflowInstructions
    })

    try {
      // Pass 2: Lightweight correction (uses the same model as primary)
      const correctedObj = await callLLM(correctionPrompt, 4000, modelName)
      if (correctedObj.slides?.[0]) {
        fixedSlides[idx] = correctedObj.slides[0]
        changed = true
      }
    } catch (err) {
      console.error(`[generationClient] Failed to correct slide ${idx}`, err)
    }
  }

  return changed ? { ...presentation, slides: fixedSlides } : presentation
}

async function callLLM(
  userPrompt: string,
  maxTokens: number,
  modelName = 'gpt-4o'
): Promise<any> {
  const model = getModel(modelName)

  try {
    const { object } = await generateObject({
      model,
      schema: GeneratedPresentationLaxSchema,
      system: ENRICHED_SYSTEM_PROMPT,
      prompt: userPrompt,
      // @ts-ignore
      maxTokens: maxTokens,
      temperature: 0.3,
    })
    return object
  } catch (err: any) {
    console.error('[AI Generation Engine] Failed to generate valid schema object.')
    if (err.issues && Array.isArray(err.issues)) {
      console.error('Validation Issues:\n' + formatZodIssues(err.issues))
    } else if (err.error && err.error.issues) {
      console.error('Validation Issues:\n' + formatZodIssues(err.error.issues))
    } else {
      console.error(err)
    }
    throw err
  }
}

/** @deprecated */
export async function generatePresentation(opts: { userPrompt: string, maxTokens?: number }) {
  return callLLM(opts.userPrompt, opts.maxTokens ?? 8000)
}
