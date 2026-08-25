import { describe, it, expect } from 'vitest'
import {
  flawedContrastDeck,
  overflowCanvasDeck,
  overlappingNodesDeck,
  orphanedConnectorsDeck,
  brokenMagicMoveDeck,
  overloadedDensityDeck,
  pristineGoldenDeck,
} from './golden-decks.fixture'
import {
  evaluateStaticDeck,
  evaluateSlideAccessibility,
  evaluateSlideGeometry,
  evaluateSlideTopology,
  evaluateProjectMotionContinuity,
  getContrastRatio,
} from './static-evaluator'

describe('Static AST Evaluator Engine', () => {
  describe('Contrast & Accessibility Evaluation', () => {
    it('should compute high contrast ratio for white text on dark canvas', () => {
      const ratio = getContrastRatio('#ffffff', '#0b0c16')
      expect(ratio).toBeGreaterThan(15) // Deep dark background vs pure white has ratio ~ 18:1
    })

    it('should compute low contrast ratio for dark gray on dark canvas', () => {
      const ratio = getContrastRatio('#1a1b26', '#0b0c16')
      expect(ratio).toBeLessThan(4.5)
    })

    it('should flag contrast violations on flawedContrastDeck', () => {
      const slide = flawedContrastDeck.slides[0]
      const result = evaluateSlideAccessibility(slide, 0)

      expect(result.score).toBeLessThan(70)
      expect(result.issues.length).toBeGreaterThanOrEqual(2)
      expect(result.issues.some((i) => i.dimension === 'accessibility')).toBe(true)
    })
  })

  describe('Canvas Bounds & AABB Collision Evaluation', () => {
    it('should detect out-of-bounds elements on overflowCanvasDeck', () => {
      const slide = overflowCanvasDeck.slides[0]
      const result = evaluateSlideGeometry(slide, 0)

      expect(result.hasOutOfBounds).toBe(true)
      expect(result.issues.some((i) => i.message.includes('exceeds the safe 16:9 canvas margin'))).toBe(true)
    })

    it('should detect colliding shape nodes on overlappingNodesDeck', () => {
      const slide = overlappingNodesDeck.slides[0]
      const result = evaluateSlideGeometry(slide, 0)

      expect(result.hasOverlap).toBe(true)
      expect(result.issues.some((i) => i.message.includes('overlap in the layout'))).toBe(true)
    })
  })

  describe('Graph Topology & Orphaned Connectors Evaluation', () => {
    it('should flag orphaned connector lines on orphanedConnectorsDeck', () => {
      const slide = orphanedConnectorsDeck.slides[0]
      const result = evaluateSlideTopology(slide, 0)

      expect(result.issues.length).toBeGreaterThanOrEqual(2)
      expect(result.issues.every((i) => i.severity === 'critical')).toBe(true)
      expect(result.issues.some((i) => i.message.includes('orphaned'))).toBe(true)
    })
  })

  describe('Magic Move & Motion Continuity Evaluation', () => {
    it('should detect mismatched component IDs across adjacent slides on brokenMagicMoveDeck', () => {
      const result = evaluateProjectMotionContinuity(brokenMagicMoveDeck)

      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.issues[0].dimension).toBe('motionAndFlow')
      expect(result.issues[0].message).toContain('breaking Magic Move morphing')
    })
  })

  describe('Composite Deck Evaluation', () => {
    it('should grade flawed decks with low scores (< 70)', () => {
      const report = evaluateStaticDeck(flawedContrastDeck)
      expect(report.overallScore).toBeLessThan(80)
      expect(report.dimensions.accessibility.status).toBe('failed')
    })

    it('should identify empty deck as draft with score 0 and DRAFT grade', () => {
      const emptyDeck = {
        id: 'empty-deck',
        name: 'Empty Draft',
        description: '',
        slides: [{ id: 's1', name: 'Slide 1', elements: [], background: '#0b0c16' }],
        transitions: [],
        prototypeLayout: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
        synced: true,
        shareKey: 'empty',
        visibility: 'private' as const,
      }

      const report = evaluateStaticDeck(emptyDeck)
      expect(report.isEmptyDeck).toBe(true)
      expect(report.overallScore).toBe(0)
      expect(report.grade).toBe('DRAFT')
      expect(report.dimensions.accessibility.status).toBe('empty')
    })

    it('should grade pristineGoldenDeck with high scores (>= 90, Grade A/A+)', () => {
      const report = evaluateStaticDeck(pristineGoldenDeck)

      expect(report.overallScore).toBeGreaterThanOrEqual(90)
      expect(['A', 'A+']).toContain(report.grade)
      expect(report.criticalIssues.length).toBe(0)
      expect(report.dimensions.accessibility.status).toBe('passed')
      expect(report.dimensions.visualDensity.status).toBe('passed')
      expect(report.dimensions.motionAndFlow.status).toBe('passed')
    })
  })
})
