import { z } from 'zod'
import type { Project } from '@motionslides/shared'
import type { EvaluationIssue } from './evaluation-types'

export const SemanticCritiqueSchema = z.object({
  narrativeScore: z.number().min(0).max(100).describe('Story arc clarity, progression, and logical flow score 0-100'),
  narrativeFeedback: z.string().describe('Overall narrative evaluation and storytelling critique'),
  pacingScore: z.number().min(0).max(100).describe('Slide information density and pacing score 0-100'),
  slideCritiques: z.array(
    z.object({
      slideIndex: z.number(),
      headlineQuality: z.enum(['strong', 'acceptable', 'weak', 'generic']),
      cognitiveOverload: z.boolean(),
      suggestedSplit: z.boolean().describe('Whether this slide tries to communicate too much and should be split into 2'),
      feedback: z.string(),
    })
  ),
})

export type SemanticCritiqueResult = z.infer<typeof SemanticCritiqueSchema>

export interface ScopedDeckContext {
  deckTitle: string
  originalPrompt?: string
  slideCount: number
  slides: Array<{
    index: number
    name: string
    wordCount: number
    nodeCount: number
    elementLabels: string[]
    speakerNotes?: string
  }>
}

/**
 * Extracts a lightweight, high-signal representation of the presentation AST
 * for the Semantic Critic (following Anthropic context engineering principles).
 */
export function extractScopedDeckContext(project: Project, originalPrompt?: string): ScopedDeckContext {
  return {
    deckTitle: project.name,
    originalPrompt,
    slideCount: project.slides.length,
    slides: project.slides.map((s, idx) => {
      const labels: string[] = []
      let wordCount = 0

      for (const el of s.elements) {
        if (el.type === 'text') {
          const val = (el.content as any).value || ''
          wordCount += val.split(/\s+/).filter(Boolean).length
          labels.push(val.slice(0, 40))
        } else if (el.type === 'shape') {
          const sc = el.content as any
          if (sc.label) {
            wordCount += sc.label.split(/\s+/).filter(Boolean).length
            labels.push(sc.label)
          }
          if (sc.sublabel) {
            wordCount += sc.sublabel.split(/\s+/).filter(Boolean).length
            labels.push(sc.sublabel)
          }
        }
      }

      return {
        index: idx,
        name: s.name,
        wordCount,
        nodeCount: s.elements.filter((e) => e.type === 'shape').length,
        elementLabels: labels,
        speakerNotes: s.script || undefined,
      }
    }),
  }
}

/**
 * Evaluate narrative structure and design semantics.
 * If mock or offline mode, falls back to deterministic heuristic evaluation.
 */
export function evaluateSemanticFallback(context: ScopedDeckContext): SemanticCritiqueResult {
  let narrativeScore = 85
  const critiques: SemanticCritiqueResult['slideCritiques'] = []

  const genericTitles = new Set(['slide 1', 'slide 2', 'slide 3', 'stuff', 'overview', 'more stuff', 'untitled'])

  for (const s of context.slides) {
    const isGeneric = genericTitles.has(s.name.trim().toLowerCase())
    const isOverloaded = s.nodeCount > 12 || s.wordCount > 100

    if (isGeneric) narrativeScore -= 15
    if (isOverloaded) narrativeScore -= 10

    critiques.push({
      slideIndex: s.index,
      headlineQuality: isGeneric ? 'generic' : 'strong',
      cognitiveOverload: isOverloaded,
      suggestedSplit: isOverloaded,
      feedback: isGeneric
        ? `Headline "${s.name}" is too generic. Use active, action-oriented phrasing.`
        : isOverloaded
        ? `High cognitive density (${s.nodeCount} nodes, ${s.wordCount} words). Consider splitting.`
        : 'Good focus and clarity.',
    })
  }

  narrativeScore = Math.max(20, Math.min(100, narrativeScore))

  return {
    narrativeScore,
    narrativeFeedback:
      narrativeScore >= 80
        ? 'Well-structured narrative arc with clear topical progression.'
        : 'Narrative requires stronger framing, active headlines, and topic separation.',
    pacingScore: Math.round(narrativeScore * 0.95),
    slideCritiques: critiques,
  }
}

/**
 * Converts semantic critiques into standardized EvaluationIssues.
 */
export function convertCritiqueToIssues(critique: SemanticCritiqueResult): EvaluationIssue[] {
  const issues: EvaluationIssue[] = []

  for (const sc of critique.slideCritiques) {
    if (sc.headlineQuality === 'generic' || sc.headlineQuality === 'weak') {
      issues.push({
        id: `semantic-headline-${sc.slideIndex}`,
        slideIndex: sc.slideIndex,
        dimension: 'narrative',
        severity: 'warning',
        message: `Slide ${sc.slideIndex + 1} has a weak or generic headline: "${sc.feedback}"`,
        suggestedFix: 'Replace with an active, insight-driven takeaway title.',
        autoFixable: false,
      })
    }

    if (sc.cognitiveOverload) {
      issues.push({
        id: `semantic-overload-${sc.slideIndex}`,
        slideIndex: sc.slideIndex,
        dimension: 'visualDensity',
        severity: 'warning',
        message: `Slide ${sc.slideIndex + 1} has cognitive overload and should be split into 2 sequential slides.`,
        suggestedFix: 'Split components across two slides and link them via Magic Move.',
        autoFixable: false,
      })
    }
  }

  return issues
}
