import { z } from 'zod'
import { tool } from 'ai'
import { useEditorStore } from '../../../store/editor-store'
import { aggregateDeckEvaluation } from '../evaluation/score-aggregator'
import { applyRemediationPlan } from '../evaluation/remediation-engine'
import { saveEvaluationReport } from '../evaluation/evaluation-history-store'

export const auditToolSchemas = {
  auditPresentationQuality: tool({
    description: 'Audit presentation deck for WCAG AA contrast compliance, cognitive density, orphaned connectors, and narrative polish with optional 1-click auto-fix.',
    inputSchema: z.object({
      autoFix: z.boolean().optional().default(false).describe('Automatically remediate contrast violations, safe margin bounds, and orphaned connectors'),
    }),
  }),
}

export type AuditToolName = keyof typeof auditToolSchemas

export async function executeAuditTool(
  toolName: AuditToolName,
  args: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const store = useEditorStore.getState()
  const activeProjectId = store.activeProjectId
  const project = store.activeProject()

  if (!activeProjectId || !project) {
    return { success: false, error: 'No active project found for presentation audit.' }
  }

  switch (toolName) {
    case 'auditPresentationQuality': {
      const { autoFix = false } = args as { autoFix?: boolean }

      // 1. Run Composite Evaluation
      const report = aggregateDeckEvaluation(project, { triggeredBy: 'manual' })

      let finalReport = report
      let actionsAppliedCount = 0

      // 2. If autoFix is requested, run auto-remediation engine and update store
      if (autoFix && (report.criticalIssues.length > 0 || report.warningIssues.some((i) => i.autoFixable))) {
        const remediation = applyRemediationPlan(project, report)
        actionsAppliedCount = remediation.actionsApplied.length

        if (actionsAppliedCount > 0) {
          useEditorStore.setState((s) => ({
            projects: s.projects.map((p) => (p.id !== activeProjectId ? p : remediation.updatedProject)),
          }))
          useEditorStore.getState().recalculateLines()
          finalReport = remediation.remediatedReport
        }
      }

      // 3. Persist to evaluation history in IndexedDB
      await saveEvaluationReport(activeProjectId, finalReport)

      // 4. Format rich markdown report for the chat UI
      const issueMarkdown = [
        ...finalReport.criticalIssues.map((i) => `🚨 **Slide ${i.slideIndex + 1}**: ${i.message} *(Fix: ${i.suggestedFix})*`),
        ...finalReport.warningIssues.map((i) => `⚠️ **Slide ${i.slideIndex + 1}**: ${i.message}`),
      ]

      const reportMarkdown = `### 🔍 Presentation Quality & Critic Report
**Overall Quality Score**: **${finalReport.overallScore}/100** (Grade: **${finalReport.grade}**)

**Dimensional Breakdown:**
- **Accessibility (WCAG AA)**: ${finalReport.dimensions.accessibility.score}/100 (${finalReport.dimensions.accessibility.status})
- **Visual Density & Bounds**: ${finalReport.dimensions.visualDensity.score}/100 (${finalReport.dimensions.visualDensity.status})
- **Typography & Polish**: ${finalReport.dimensions.typography.score}/100 (${finalReport.dimensions.typography.status})
- **Narrative Arc**: ${finalReport.dimensions.narrative.score}/100 (${finalReport.dimensions.narrative.status})
- **Motion Continuity**: ${finalReport.dimensions.motionAndFlow.score}/100 (${finalReport.dimensions.motionAndFlow.status})

${autoFix ? `**Auto-Remediation Applied:** ${actionsAppliedCount} issue(s) resolved.` : ''}

**Key Findings:**
${issueMarkdown.length > 0 ? issueMarkdown.join('\n') : '✅ All slides adhere to high quality, WCAG AA contrast, and clean layout standards.'}
`

      return {
        success: true,
        data: {
          qualityScore: finalReport.overallScore,
          grade: finalReport.grade,
          contrastViolations: finalReport.dimensions.accessibility.issueCount,
          densityWarnings: finalReport.dimensions.visualDensity.issueCount,
          orphanedLines: finalReport.criticalIssues.filter((i) => i.message.includes('orphaned')).length,
          autoFixedCount: actionsAppliedCount,
          reportMarkdown,
          evaluationReport: finalReport,
          message: `Audit completed with quality score ${finalReport.overallScore}/100 (Grade ${finalReport.grade}).`,
        },
      }
    }

    default:
      return { success: false, error: `Unknown audit tool: ${toolName}` }
  }
}
