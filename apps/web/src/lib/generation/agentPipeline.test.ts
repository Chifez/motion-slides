import { describe, it, expect } from 'vitest'
import { hydrateLogicalSlides } from './generationClient'

describe('agentPipeline Logical Hydration', () => {
  it('should convert logicalNodes and logicalConnections to standard elements and connections on diagram slides', () => {
    const mockPresentation = {
      title: 'Hydration Test',
      description: 'System test description',
      slides: [
        {
          id: 'slide-1',
          title: 'Logical Diagram Slide',
          role: 'diagram',
          spatialPlan: 'test plan',
          logicalNodes: [
            { id: 'client-node', label: 'User Client', layer: 'Client', type: 'icon', iconPath: 'aws-client' },
            { id: 'db-node', label: 'Storage Database', layer: 'Data', type: 'shape', shapeType: 'cylinder' }
          ],
          logicalConnections: [
            {
              id: 'conn-1',
              from: 'client-node',
              fromPort: 'bottom',
              to: 'db-node',
              toPort: 'top',
              type: 'directed',
              label: 'SQL Connection',
            }
          ]
        }
      ]
    }

    const hydrated = hydrateLogicalSlides(mockPresentation)
    expect(hydrated.slides.length).toBe(1)

    const slide = hydrated.slides[0]
    expect(slide.elements).toBeDefined()
    expect(slide.elements.length).toBe(2)

    const clientNode = slide.elements.find((e: any) => e.id === 'client-node')
    expect(clientNode).toBeDefined()
    expect(clientNode.type).toBe('icon')
    expect(clientNode.position.w).toBe(0.09)
    expect(clientNode.position.h).toBe(0.10)

    const dbNode = slide.elements.find((e: any) => e.id === 'db-node')
    expect(dbNode).toBeDefined()
    expect(dbNode.type).toBe('shape')
    expect(dbNode.shape).toBe('cylinder')
    expect(dbNode.position.w).toBe(0.13)
    expect(dbNode.position.h).toBe(0.08)

    expect(slide.connections).toBeDefined()
    expect(slide.connections.length).toBe(1)

    const conn = slide.connections[0]
    expect(conn.id).toBe('conn-1')
    expect(conn.from).toBe('client-node')
    expect(conn.to).toBe('db-node')
    expect(conn.fromPort).toBe('bottom')
    expect(conn.toPort).toBe('top')
    expect(conn.routing).toBe('elbow-v')
    expect(conn.color).toBe('var(--ms-accent, #3b82f6)')
  })
})
