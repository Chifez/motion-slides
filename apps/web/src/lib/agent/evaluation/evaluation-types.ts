import type { Project, Slide, SceneElement, SlideTransition } from '@motionslides/shared'

export type DimensionKey =
  | 'narrative'
  | 'visualDensity'
  | 'typography'
  | 'accessibility'
  | 'motionAndFlow'

export type IssueSeverity = 'critical' | 'warning' | 'info'

export interface DimensionScore {
  score: number // 0 - 100
  weight: number // 0 - 1.0
  status: 'passed' | 'warning' | 'failed' | 'empty'
  summary: string
  issueCount: number
}

export interface EvaluationIssue {
  id: string
  slideIndex: number
  elementId?: string
  dimension: DimensionKey
  severity: IssueSeverity
  message: string
  suggestedFix: string
  autoFixable: boolean
  fixPayload?: Record<string, unknown>
}

export interface RemediationAction {
  id: string
  type:
    | 'fix_contrast'
    | 'prune_orphaned_line'
    | 'deconflict_overlap'
    | 'clamp_to_safe_bounds'
    | 'sync_magic_move_ids'
    | 'split_overloaded_slide'
    | 'harmonize_typography'
  slideIndex: number
  elementId?: string
  description: string
  applied: boolean
  payload?: Record<string, unknown>
}

export interface SlideEvaluationReport {
  slideIndex: number
  slideId: string
  slideName: string
  score: number // 0 - 100
  status: 'passed' | 'warning' | 'failed' | 'empty'
  dimensions: Record<DimensionKey, number>
  issues: EvaluationIssue[]
  metrics: {
    nodeCount: number
    wordCount: number
    connectorCount: number
    contrastRatioMin: number
    hasOverlap: boolean
    hasOutOfBounds: boolean
  }
}

export interface DeckEvaluationReport {
  projectId: string
  runId: string
  timestamp: number
  overallScore: number // 0 - 100 (0 for empty deck)
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' | 'DRAFT'
  isEmptyDeck: boolean
  dimensions: Record<DimensionKey, DimensionScore>
  slideReports: SlideEvaluationReport[]
  criticalIssues: EvaluationIssue[]
  warningIssues: EvaluationIssue[]
  remediationPlan: RemediationAction[]
  triggeredBy: 'manual' | 'post-generation' | 'regression-ci'
}
