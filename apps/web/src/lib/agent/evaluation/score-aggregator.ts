import type { Project } from '@motionslides/shared'
import type { DeckEvaluationReport } from './evaluation-types'
import { evaluateStaticDeck } from './static-evaluator'
import {
  extractScopedDeckContext,
  evaluateSemanticFallback,
  convertCritiqueToIssues,
  type SemanticCritiqueResult,
} from './semantic-critic'

export interface CompositeEvaluationOptions {
  runId?: string
  triggeredBy?: 'manual' | 'post-generation' | 'regression-ci'
  originalPrompt?: string
  semanticCritique?: SemanticCritiqueResult
}

/**
 * Aggregates static deterministic AST analysis and semantic LLM critique into a single composite report.
 */
export function aggregateDeckEvaluation(
  project: Project,
  options: CompositeEvaluationOptions = {}
): DeckEvaluationReport {
  // 1. Run static analysis
  const staticReport = evaluateStaticDeck(project, {
    runId: options.runId,
    triggeredBy: options.triggeredBy,
  })

  // Short-circuit for empty drafts
  if (staticReport.isEmptyDeck) {
    return staticReport
  }

  // 2. Resolve semantic critique (passed in or computed fallback)
  const scopedContext = extractScopedDeckContext(project, options.originalPrompt)
  const semantic = options.semanticCritique || evaluateSemanticFallback(scopedContext)
  const semanticIssues = convertCritiqueToIssues(semantic)

  // 3. Merge issues
  const allIssues = [...staticReport.criticalIssues, ...staticReport.warningIssues, ...semanticIssues]

  // 4. Update narrative dimension score with semantic critique score
  const narrativeDimension = {
    score: semantic.narrativeScore,
    weight: 0.25,
    status: (semantic.narrativeScore >= 85 ? 'passed' : semantic.narrativeScore >= 65 ? 'warning' : 'failed') as 'passed' | 'warning' | 'failed',
    summary: semantic.narrativeFeedback,
    issueCount: semanticIssues.filter((i) => i.dimension === 'narrative').length,
  }

  // 5. Calculate final weighted composite score
  // Narrative: 25%, Accessibility: 20%, Visual Density: 20%, Motion: 20%, Typography: 15%
  const compositeScore = Math.round(
    narrativeDimension.score * 0.25 +
    staticReport.dimensions.accessibility.score * 0.20 +
    staticReport.dimensions.visualDensity.score * 0.20 +
    staticReport.dimensions.motionAndFlow.score * 0.20 +
    staticReport.dimensions.typography.score * 0.15
  )

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F'
  if (compositeScore >= 95) grade = 'A+'
  else if (compositeScore >= 85) grade = 'A'
  else if (compositeScore >= 75) grade = 'B'
  else if (compositeScore >= 65) grade = 'C'
  else if (compositeScore >= 50) grade = 'D'

  return {
    ...staticReport,
    overallScore: compositeScore,
    grade,
    dimensions: {
      ...staticReport.dimensions,
      narrative: narrativeDimension,
    },
    criticalIssues: allIssues.filter((i) => i.severity === 'critical'),
    warningIssues: allIssues.filter((i) => i.severity === 'warning'),
  }
}
