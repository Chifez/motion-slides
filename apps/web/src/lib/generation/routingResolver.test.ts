import { describe, it, expect } from 'vitest'
import { resolveRoute, buildRoundedPath } from './routingResolver'

describe('routingResolver', () => {
  it('should generate a straight line for straight routing hint', () => {
    const path = resolveRoute('straight', { x: 0.1, y: 0.1 }, { x: 0.5, y: 0.5 }, 1000, 1000)
    expect(path).toBe('M 100.0 100.0 L 500.0 500.0')
  })

  it('should generate a rounded path with Bezier Q commands for elbow-v routing', () => {
    const from = { x: 100, y: 100 }
    const corner = { x: 100, y: 500 }
    const to = { x: 500, y: 500 }
    
    const path = buildRoundedPath([from, corner, to], 20)
    // tangent start A: corner - direction1 * r = (100, 500) - (0, 1)*20 = (100, 480)
    // tangent end B: corner + direction2 * r = (100, 500) + (1, 0)*20 = (120, 500)
    expect(path).toBe('M 100.0 100.0 L 100.0 480.0 Q 100.0 500.0 120.0 500.0 L 500.0 500.0')
  })

  it('should generate a rounded path with Bezier Q commands for elbow-h routing via resolveRoute', () => {
    const path = resolveRoute('elbow-h', { x: 0.1, y: 0.1 }, { x: 0.5, y: 0.5 }, 1000, 1000)
    // fx=100, fy=100, tx=500, ty=500. corner is (500, 100).
    // tangent start A: (484.0, 100.0), tangent end B: (500.0, 116.0)
    expect(path).toContain('Q 500.0 100.0')
    expect(path).toContain('L 484.0 100.0')
  })
})
