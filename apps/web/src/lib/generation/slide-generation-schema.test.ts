import { describe, it, expect } from 'vitest'
import { GeneratedPresentationLaxSchema, GeneratedPresentationSchema } from './slide-generation-schema'

describe('AI Schema Decoupling (Lax vs Strict)', () => {
  const mockValidBase = {
    title: 'Valid Base Presentation',
    description: 'Basic metadata structure',
    theme: {
      primaryColor: 'var(--ms-primary)',
      secondaryColor: 'var(--ms-secondary)',
      backgroundColor: 'var(--ms-bg)',
      textColor: 'var(--ms-text)',
      accentColor: 'var(--ms-accent)',
      fontFamily: 'inter' as const,
    }
  }

  it('should accept basic slide shapes in both Lax and Strict schemas when there are no layout issues', () => {
    const presentation = {
      ...mockValidBase,
      slides: [
        {
          id: 'slide-1',
          title: 'Title Slide',
          role: 'diagram' as const,
          background: 'var(--ms-bg-base)',
          spatialPlan: 'standard layout',
          transition: null,
          speakerNotes: null,
          layoutTemplate: null,
          logicalNodes: null,
          logicalConnections: null,
          elements: [
            {
              id: 'node-client',
              type: 'icon' as const,
              iconPath: 'aws-client',
              label: 'User Browser',
              layer: 'Client Layer',
              position: { x: 0.1, y: 0.2, w: 0.08, h: 0.08 },
              animation: null,
              animationDelay: null,
            },
            {
              id: 'node-server',
              type: 'icon' as const,
              iconPath: 'aws-ec2',
              label: 'App Server',
              layer: 'Logic Layer',
              position: { x: 0.4, y: 0.5, w: 0.08, h: 0.08 },
              animation: null,
              animationDelay: null,
            },
            {
              id: 'node-db',
              type: 'icon' as const,
              iconPath: 'aws-rds',
              label: 'Main Database',
              layer: 'Data Layer',
              position: { x: 0.7, y: 0.7, w: 0.08, h: 0.08 },
              animation: null,
              animationDelay: null,
            },
          ],
          connections: []
        }
      ]
    }

    const laxResult = GeneratedPresentationLaxSchema.safeParse(presentation)
    const strictResult = GeneratedPresentationSchema.safeParse(presentation)

    expect(laxResult.success).toBe(true)
    expect(strictResult.success).toBe(true)
  })

  it('should allow canvas coordinate overflow in Lax schema but fail in Strict schema', () => {
    const presentation = {
      ...mockValidBase,
      slides: [
        {
          id: 'slide-1',
          title: 'Overflow Slide',
          role: 'diagram' as const,
          background: 'var(--ms-bg-base)',
          spatialPlan: 'standard layout',
          transition: null,
          speakerNotes: null,
          layoutTemplate: null,
          logicalNodes: null,
          logicalConnections: null,
          elements: [
            {
              id: 'node-overflow',
              type: 'icon' as const,
              iconPath: 'aws-client',
              label: 'Overflow Icon',
              layer: 'Client Layer',
              position: { x: 0.95, y: 0.2, w: 0.10, h: 0.08 }, // x + w = 1.05 (> 1.001)
              animation: null,
              animationDelay: null,
            }
          ],
          connections: []
        }
      ]
    }

    const laxResult = GeneratedPresentationLaxSchema.safeParse(presentation)
    const strictResult = GeneratedPresentationSchema.safeParse(presentation)

    expect(laxResult.success).toBe(true) // Lax should succeed
    expect(strictResult.success).toBe(false) // Strict should catch the overflow
    if (!strictResult.success) {
      expect(strictResult.error.issues[0].message).toContain('overflows canvas')
    }
  })

  it('should allow wrong tier placement in Lax schema but fail in Strict schema', () => {
    const presentation = {
      ...mockValidBase,
      slides: [
        {
          id: 'slide-1',
          title: 'Tier Violation Slide',
          role: 'diagram' as const,
          background: 'var(--ms-bg-base)',
          spatialPlan: 'standard layout',
          transition: null,
          speakerNotes: null,
          layoutTemplate: null,
          logicalNodes: null,
          logicalConnections: null,
          elements: [
            {
              id: 'node-database',
              type: 'icon' as const,
              iconPath: 'aws-rds',
              label: 'Users SQL Database',
              layer: 'Data Layer',
              position: { x: 0.3, y: 0.2, w: 0.08, h: 0.08 }, // y = 0.2 (which is < 0.66, data tier constraint)
              animation: null,
              animationDelay: null,
            }
          ],
          connections: []
        }
      ]
    }

    const laxResult = GeneratedPresentationLaxSchema.safeParse(presentation)
    const strictResult = GeneratedPresentationSchema.safeParse(presentation)

    expect(laxResult.success).toBe(true) // Lax should succeed
    expect(strictResult.success).toBe(false) // Strict should fail the tier check
    if (!strictResult.success) {
      expect(strictResult.error.issues[0].message).toContain('bottom tier')
    }
  })
})
