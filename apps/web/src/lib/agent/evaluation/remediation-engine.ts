import type { Project, Slide, SceneElement, TextContent, LineContent } from '@motionslides/shared'
import type { DeckEvaluationReport, RemediationAction, EvaluationIssue } from './evaluation-types'
import { evaluateStaticDeck } from './static-evaluator'

export interface RemediationResult {
  updatedProject: Project
  actionsApplied: RemediationAction[]
  remediatedReport: DeckEvaluationReport
}

export function applyRemediationPlan(project: Project, report?: DeckEvaluationReport): RemediationResult {
  const currentReport = report || evaluateStaticDeck(project)
  const actionsApplied: RemediationAction[] = []

  // Deep clone project to prevent mutating the original input
  const updatedProject: Project = JSON.parse(JSON.stringify(project))

  // Collect auto-fixable issues
  const fixableIssues = [...currentReport.criticalIssues, ...currentReport.warningIssues].filter((i) => i.autoFixable)

  for (const issue of fixableIssues) {
    const slide = updatedProject.slides[issue.slideIndex]
    if (!slide) continue

    // 1. Contrast Auto-Fix
    if (issue.dimension === 'accessibility' && issue.elementId) {
      const el = slide.elements.find((e) => e.id === issue.elementId)
      if (el && el.type === 'text') {
        const tc = el.content as TextContent
        tc.color = (issue.fixPayload?.targetColor as string) || '#ffffff'
        actionsApplied.push({
          id: `remediation-${issue.id}`,
          type: 'fix_contrast',
          slideIndex: issue.slideIndex,
          elementId: issue.elementId,
          description: `Fixed text contrast to high-visibility #ffffff on "${slide.name}"`,
          applied: true,
          payload: { newColor: '#ffffff' },
        })
      }
    }

    // 2. Orphan Line Pruning
    if (issue.severity === 'critical' && issue.elementId && issue.message.includes('orphaned')) {
      const lineIndex = slide.elements.findIndex((e) => e.id === issue.elementId)
      if (lineIndex >= 0) {
        slide.elements.splice(lineIndex, 1)
        actionsApplied.push({
          id: `remediation-${issue.id}`,
          type: 'prune_orphaned_line',
          slideIndex: issue.slideIndex,
          elementId: issue.elementId,
          description: `Pruned orphaned connector line "${issue.elementId}" from "${slide.name}"`,
          applied: true,
        })
      }
    }

    // 3. Safe Bounds Clamping
    if (issue.dimension === 'visualDensity' && issue.elementId && issue.fixPayload?.clampedX !== undefined) {
      const el = slide.elements.find((e) => e.id === issue.elementId)
      if (el) {
        el.position.x = issue.fixPayload.clampedX as number
        el.position.y = issue.fixPayload.clampedY as number
        actionsApplied.push({
          id: `remediation-${issue.id}`,
          type: 'clamp_to_safe_bounds',
          slideIndex: issue.slideIndex,
          elementId: issue.elementId,
          description: `Repositioned element "${el.id}" within safe 16:9 canvas margins on "${slide.name}"`,
          applied: true,
          payload: { clampedX: el.position.x, clampedY: el.position.y },
        })
      }
    }

    // 4. Magic Move ID Alignment
    if (issue.dimension === 'motionAndFlow' && issue.fixPayload?.canonicalId && issue.fixPayload?.targetElementId) {
      const canonicalId = issue.fixPayload.canonicalId as string
      const targetId = issue.fixPayload.targetElementId as string

      const el = slide.elements.find((e) => e.id === targetId)
      if (el) {
        el.id = canonicalId

        // Update any connected lines referencing old targetId on this slide
        for (const line of slide.elements.filter((e) => e.type === 'line')) {
          const lc = line.content as LineContent
          if (lc.startConnection?.elementId === targetId) lc.startConnection.elementId = canonicalId
          if (lc.endConnection?.elementId === targetId) lc.endConnection.elementId = canonicalId
        }

        actionsApplied.push({
          id: `remediation-${issue.id}`,
          type: 'sync_magic_move_ids',
          slideIndex: issue.slideIndex,
          elementId: targetId,
          description: `Synchronized component ID to canonical "${canonicalId}" for Magic Move morphing on "${slide.name}"`,
          applied: true,
          payload: { canonicalId, oldId: targetId },
        })
      }
    }
  }

  // Re-evaluate updated project to calculate remediated score
  const remediatedReport = evaluateStaticDeck(updatedProject, {
    runId: `remediated-${Date.now()}`,
    triggeredBy: currentReport.triggeredBy,
  })
  remediatedReport.remediationPlan = actionsApplied

  return {
    updatedProject,
    actionsApplied,
    remediatedReport,
  }
}
