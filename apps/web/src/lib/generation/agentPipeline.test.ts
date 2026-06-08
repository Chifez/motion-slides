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
            { id: 'client-node', label: 'User Client', layer: 'Client Tier', type: 'icon', iconPath: 'aws-client' },
            { id: 'db-node', label: 'Storage Database', layer: 'Data Tier', type: 'shape', shapeType: 'cylinder' }
          ],
          logicalConnections: [
            { id: 'conn-1', from: 'client-node', to: 'db-node', type: 'directed', label: 'SQL Connection' }
          ]
        }
      ]
    }

    const hydrated = hydrateLogicalSlides(mockPresentation)
    expect(hydrated.slides.length).toBe(1)

    const slide = hydrated.slides[0]
    expect(slide.elements).toBeDefined()
    expect(slide.elements.length).toBe(2)

    // First node should be mapped to an icon element with default 0.08x0.08 dimensions
    const clientNode = slide.elements.find((e: any) => e.id === 'client-node')
    expect(clientNode).toBeDefined()
    expect(clientNode.type).toBe('icon')
    expect(clientNode.position.w).toBe(0.08)
    expect(clientNode.position.h).toBe(0.08)

    // Second node should be mapped to a shape element with standard 0.14x0.08 dimensions
    const dbNode = slide.elements.find((e: any) => e.id === 'db-node')
    expect(dbNode).toBeDefined()
    expect(dbNode.type).toBe('shape')
    expect(dbNode.shape).toBe('cylinder')
    expect(dbNode.position.w).toBe(0.14)
    expect(dbNode.position.h).toBe(0.08)

    // Connections should be mapped correctly
    expect(slide.connections).toBeDefined()
    expect(slide.connections.length).toBe(1)
    
    const conn = slide.connections[0]
    expect(conn.id).toBe('conn-1')
    expect(conn.from).toBe('client-node')
    expect(conn.to).toBe('db-node')
    expect(conn.routing).toBe('elbow-v') // different layers -> elbow-v
  })
})
