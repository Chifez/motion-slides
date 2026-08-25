import { describe, it, expect } from 'vitest'
import { weakNarrativeDeck, pristineGoldenDeck } from './golden-decks.fixture'
import {
  extractScopedDeckContext,
  evaluateSemanticFallback,
  convertCritiqueToIssues,
  SemanticCritiqueSchema,
} from './semantic-critic'
import { aggregateDeckEvaluation } from './score-aggregator'

describe('Semantic LLM Critic & Score Aggregator', () => {
  it('should extract scoped context without exposing raw coordinates', () => {
    const context = extractScopedDeckContext(pristineGoldenDeck, 'Build a video transcoding pitch deck')

    expect(context.deckTitle).toBe(pristineGoldenDeck.name)
    expect(context.slideCount).toBe(pristineGoldenDeck.slides.length)
    expect(context.slides[0].name).toBe('Hero Title')
    expect(context.slides[0].wordCount).toBeGreaterThan(0)
    // Verify no coordinates or raw SVG properties in scoped context
    expect((context.slides[0] as any).position).toBeUndefined()
  })

  it('should evaluate weakNarrativeDeck with low narrative scores (< 70)', () => {
    const context = extractScopedDeckContext(weakNarrativeDeck)
    const critique = evaluateSemanticFallback(context)

    expect(critique.narrativeScore).toBeLessThan(70)
    expect(critique.slideCritiques.some((s) => s.headlineQuality === 'generic')).toBe(true)

    const issues = convertCritiqueToIssues(critique)
    expect(issues.some((i) => i.dimension === 'narrative')).toBe(true)
  })

  it('should validate SemanticCritiqueSchema against mock outputs', () => {
    const mockOutput = {
      narrativeScore: 92,
      narrativeFeedback: 'Clear causal storytelling from edge ingestion to storage tier.',
      pacingScore: 88,
      slideCritiques: [
        {
          slideIndex: 0,
          headlineQuality: 'strong' as const,
          cognitiveOverload: false,
          suggestedSplit: false,
          feedback: 'Compelling hero framing.',
        },
      ],
    }

    const validated = SemanticCritiqueSchema.parse(mockOutput)
    expect(validated.narrativeScore).toBe(92)
  })

  it('should aggregate composite score combining static metrics and semantic critique', () => {
    const compositeReport = aggregateDeckEvaluation(pristineGoldenDeck, {
      originalPrompt: 'Enterprise Media Transcoder architecture deck',
      semanticCritique: {
        narrativeScore: 95,
        narrativeFeedback: 'Exemplary narrative arc and clear architectural progression.',
        pacingScore: 92,
        slideCritiques: [],
      },
    })

    expect(compositeReport.overallScore).toBeGreaterThanOrEqual(92)
    expect(compositeReport.grade).toBe('A+')
    expect(compositeReport.dimensions.narrative.score).toBe(95)
    expect(compositeReport.dimensions.accessibility.status).toBe('passed')
  })
})
