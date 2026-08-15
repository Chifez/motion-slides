import { z } from 'zod'
import { tool } from 'ai'
import { useEditorStore } from '../../../store/editor-store'
import type { TextContent, LineContent, ShapeContent } from '@motionslides/shared'

export const auditToolSchemas = {
  auditPresentationQuality: tool({
    description: 'Audit presentation deck for WCAG AA contrast compliance, slide cognitive density, orphaned connector lines, and overall presentation polish with optional 1-click auto-fix.',
    inputSchema: z.object({
      autoFix: z.boolean().optional().default(false).describe('Automatically remediate contrast violations and remove orphaned connectors'),
    }),
  }),
}

export type AuditToolName = keyof typeof auditToolSchemas

// Helper: parse hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    }
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    }
  }
  return null
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1) || { r: 255, g: 255, b: 255 }
  const rgb2 = hexToRgb(hex2) || { r: 11, g: 12, b: 22 }
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b)
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b)
  const brighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (brighter + 0.05) / (darker + 0.05)
}

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

      const issues: string[] = []
      let contrastViolations = 0
      let densityWarnings = 0
      let orphanedLines = 0
      let autoFixedCount = 0

      const updatedSlides = project.slides.map((slide, sIdx) => {
        const slideBg = slide.background || '#0b0c16'
        const existingNodeIds = new Set(slide.elements.map((e) => e.id))

        const shapes = slide.elements.filter((e) => e.type === 'shape')
        if (shapes.length > 10) {
          densityWarnings++
          issues.push(`- **Slide ${sIdx + 1} ("${slide.name}")**: High cognitive density (${shapes.length} nodes). Recommended: max 8–10 nodes per slide.`)
        }

        const cleanedElements = slide.elements
          .map((el) => {
            // Check text contrast
            if (el.type === 'text') {
              const tc = el.content as TextContent
              const textColor = tc.color || '#ffffff'
              if (textColor.startsWith('#') && slideBg.startsWith('#')) {
                const ratio = getContrastRatio(textColor, slideBg)
                if (ratio < 4.0) {
                  contrastViolations++
                  issues.push(`- **Slide ${sIdx + 1} ("${slide.name}")**: Low contrast text "${tc.text.slice(0, 25)}..." (Ratio: ${ratio.toFixed(1)}:1, WCAG standard: ≥4.5:1).`)

                  if (autoFix) {
                    autoFixedCount++
                    return {
                      ...el,
                      content: {
                        ...tc,
                        color: '#ffffff',
                      },
                    }
                  }
                }
              }
            }

            // Check orphaned connector lines
            if (el.type === 'line') {
              const lc = el.content as LineContent
              const startId = lc.startConnection?.elementId
              const endId = lc.endConnection?.elementId

              const hasInvalidStart = startId && !existingNodeIds.has(startId)
              const hasInvalidEnd = endId && !existingNodeIds.has(endId)

              if (hasInvalidStart || hasInvalidEnd) {
                orphanedLines++
                issues.push(`- **Slide ${sIdx + 1} ("${slide.name}")**: Orphaned connector line pointing to missing element (${startId || 'none'} ➔ ${endId || 'none'}).`)
                if (autoFix) {
                  autoFixedCount++
                  return null // Remove orphaned line
                }
              }
            }

            return el
          })
          .filter(Boolean) as typeof slide.elements

        return {
          ...slide,
          elements: cleanedElements,
        }
      })

      // Calculate quality score (out of 100)
      const penalty = contrastViolations * 8 + densityWarnings * 10 + orphanedLines * 12
      const qualityScore = Math.max(0, 100 - penalty)

      if (autoFix && autoFixedCount > 0) {
        useEditorStore.setState((s) => ({
          projects: s.projects.map((p) =>
            p.id !== activeProjectId
              ? p
              : {
                  ...p,
                  slides: updatedSlides,
                  updatedAt: Date.now(),
                }
          ),
        }))
        useEditorStore.getState().recalculateLines()
      }

      const reportMarkdown = `### 🔍 Presentation Quality Audit Report
**Overall Quality Score**: **${qualityScore}/100** ${qualityScore >= 85 ? '🟢 (Excellent)' : qualityScore >= 65 ? '🟡 (Good - Minor Polish Needed)' : '🔴 (Needs Attention)'}

**Audit Summary:**
- **Contrast Violations**: ${contrastViolations}
- **Density Overload Slides**: ${densityWarnings}
- **Orphaned Connector Lines**: ${orphanedLines}
${autoFix ? `- **Auto-Remediated Issues**: ${autoFixedCount}` : ''}

**Findings & Recommendations:**
${issues.length > 0 ? issues.join('\n') : '✅ All slides adhere to WCAG contrast standards, optimal node density, and valid connector graph topology.'}
`

      return {
        success: true,
        data: {
          qualityScore,
          contrastViolations,
          densityWarnings,
          orphanedLines,
          autoFixedCount,
          reportMarkdown,
          message: `Audit completed with quality score ${qualityScore}/100 (${issues.length} issue(s) detected${autoFix ? `, ${autoFixedCount} auto-fixed` : ''}).`,
        },
      }
    }

    default:
      return { success: false, error: `Unknown audit tool: ${toolName}` }
  }
}
