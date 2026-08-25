import { describe, it, expect } from 'vitest'
import {
  flawedContrastDeck,
  orphanedConnectorsDeck,
  overflowCanvasDeck,
  brokenMagicMoveDeck,
  pristineGoldenDeck,
} from './golden-decks.fixture'
import { applyRemediationPlan } from './remediation-engine'
import { evaluateStaticDeck } from './static-evaluator'
import type { TextContent } from '@motionslides/shared'

describe('Auto-Remediation Engine', () => {
  it('should auto-fix contrast violations on flawedContrastDeck and elevate score to passing', () => {
    const initialReport = evaluateStaticDeck(flawedContrastDeck)
    expect(initialReport.overallScore).toBeLessThan(80)

    const result = applyRemediationPlan(flawedContrastDeck, initialReport)

    expect(result.actionsApplied.length).toBeGreaterThan(0)
    expect(result.remediatedReport.overallScore).toBeGreaterThanOrEqual(85)
    expect(result.remediatedReport.dimensions.accessibility.status).toBe('passed')

    // Verify text color actually changed in the AST
    const textEl = result.updatedProject.slides[0].elements.find((e) => e.id === 'title-low-contrast')
    expect((textEl?.content as TextContent).color).toBe('#ffffff')
  })

  it('should prune orphaned connector lines from orphanedConnectorsDeck', () => {
    const initialReport = evaluateStaticDeck(orphanedConnectorsDeck)
    expect(initialReport.criticalIssues.length).toBeGreaterThan(0)

    const result = applyRemediationPlan(orphanedConnectorsDeck, initialReport)

    expect(result.remediatedReport.criticalIssues.length).toBe(0)
    expect(result.actionsApplied.some((a) => a.type === 'prune_orphaned_line')).toBe(true)

    // Verify orphaned lines are deleted from AST
    const slide = result.updatedProject.slides[0]
    expect(slide.elements.find((e) => e.id === 'line-orphan-dead-target')).toBeUndefined()
    expect(slide.elements.find((e) => e.id === 'line-orphan-both-dead')).toBeUndefined()
  })

  it('should clamp out-of-bounds elements within safe canvas margins on overflowCanvasDeck', () => {
    const initialReport = evaluateStaticDeck(overflowCanvasDeck)
    const result = applyRemediationPlan(overflowCanvasDeck, initialReport)

    expect(result.actionsApplied.some((a) => a.type === 'clamp_to_safe_bounds')).toBe(true)

    const leftEl = result.updatedProject.slides[0].elements.find((e) => e.id === 'box-left-overflow')
    expect(leftEl?.position.x).toBeGreaterThanOrEqual(80)

    const rightEl = result.updatedProject.slides[0].elements.find((e) => e.id === 'box-right-overflow')
    expect((rightEl?.position.x || 0) + (rightEl?.size.width || 0)).toBeLessThanOrEqual(1200)
  })

  it('should align Magic Move component IDs across adjacent slides on brokenMagicMoveDeck', () => {
    const initialReport = evaluateStaticDeck(brokenMagicMoveDeck)
    const result = applyRemediationPlan(brokenMagicMoveDeck, initialReport)

    expect(result.actionsApplied.some((a) => a.type === 'sync_magic_move_ids')).toBe(true)

    const slide1Node = result.updatedProject.slides[0].elements[0]
    const slide2Node = result.updatedProject.slides[1].elements[0]

    expect(slide2Node.id).toBe(slide1Node.id)
    expect(result.remediatedReport.dimensions.motionAndFlow.status).toBe('passed')
  })

  it('should maintain high score on pristineGoldenDeck without making unwanted changes', () => {
    const initialReport = evaluateStaticDeck(pristineGoldenDeck)
    const result = applyRemediationPlan(pristineGoldenDeck, initialReport)

    expect(result.actionsApplied.length).toBe(0)
    expect(result.remediatedReport.overallScore).toBeGreaterThanOrEqual(90)
  })
})
