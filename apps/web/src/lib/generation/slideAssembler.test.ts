import { describe, it, expect } from 'vitest'
import { assembleSlides } from './slideAssembler'
import type { GeneratedPresentation } from './slideGenerationSchema'

describe('Dagre Diagram Layout In Slide Assembler', () => {
  it('should auto-layout nodes on diagram slides and generate layer boundaries', () => {
    const mockPresentation: GeneratedPresentation = {
      title: 'Test System',
      description: 'A simple test architecture',
      theme: {
        primaryColor: 'var(--ms-primary)',
        secondaryColor: 'var(--ms-secondary)',
        backgroundColor: 'var(--ms-bg)',
        textColor: 'var(--ms-text)',
        accentColor: 'var(--ms-accent)',
        fontFamily: 'inter',
      },
      slides: [
        {
          id: 'slide-1',
          title: 'Architecture Overview',
          role: 'diagram',
          layoutTemplate: 'diagram-only',
          background: 'var(--ms-bg-base)',
          spatialPlan: 'tiered client-logic-database layout',
          logicalNodes: null,
          logicalConnections: null,
          transition: null,
          speakerNotes: null,
          elements: [
            {
              id: 'node-client',
              type: 'icon',
              iconPath: 'aws-client',
              label: 'Browser Client',
              layer: 'Client Layer',
              position: { x: 0.1, y: 0.1, w: 0.08, h: 0.08 },
              animation: null,
              animationDelay: null,
            },
            {
              id: 'node-gateway',
              type: 'icon',
              iconPath: 'aws-api-gateway',
              label: 'API Gateway',
              layer: 'API Edge',
              position: { x: 0.3, y: 0.3, w: 0.08, h: 0.08 },
              animation: null,
              animationDelay: null,
            },
            {
              id: 'node-service',
              type: 'icon',
              iconPath: 'aws-lambda',
              label: 'Auth Lambda',
              layer: 'API Edge',
              position: { x: 0.3, y: 0.5, w: 0.08, h: 0.08 },
              animation: null,
              animationDelay: null,
            },
            {
              id: 'node-db',
              type: 'shape',
              shape: 'cylinder',
              label: 'User DB',
              sublabel: null,
              iconPath: null,
              layer: 'Database Layer',
              position: { x: 0.5, y: 0.7, w: 0.14, h: 0.08 },
              style: {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'var(--ms-accent)',
                borderWidth: 2,
                opacity: 1,
              },
              animation: null,
              animationDelay: null,
            },
            {
              id: 'node-config',
              type: 'code',
              code: 'const config = {}',
              language: 'javascript',
              layer: 'API Edge',
              position: { x: 0.7, y: 0.3, w: 0.2, h: 0.1 },
              animation: null,
              animationDelay: null,
            }
          ],
          connections: [
            {
              id: 'conn-1',
              from: 'node-client',
              to: 'node-gateway',
              type: 'directed',
              label: 'HTTPS',
              color: 'var(--ms-accent)',
              routing: 'straight',
            },
            {
              id: 'conn-2',
              from: 'node-gateway',
              to: 'node-service',
              type: 'directed',
              label: 'Invoke',
              color: 'var(--ms-accent)',
              routing: 'straight',
            }
          ],
        }
      ]
    }

    const slides = assembleSlides(mockPresentation, 1280, 720)
    expect(slides.length).toBe(1)
    
    const slide = slides[0]
    
    // Check that layout positions were recalculated and are not equal to the input raw coordinates
    const clientNode = slide.elements.find(e => e.id === 'node-client')
    expect(clientNode).toBeDefined()
    
    const gatewayNode = slide.elements.find(e => e.id === 'node-gateway')
    expect(gatewayNode).toBeDefined()

    // Assert that the layout positions of node-gateway and node-service are recalculated
    expect(gatewayNode!.position.x).not.toBe(Math.round(0.3 * 1280))

    // Check that auto-generated layer sections exist
    const sections = slide.elements.filter(e => e.type === 'section')
    expect(sections.length).toBeGreaterThanOrEqual(1) // Should have created sections for layers

    // The sections should have background properties and envelope the nodes
    const apiEdgeSection = sections.find(s => (s.content as any).label === 'API Edge')
    expect(apiEdgeSection).toBeDefined()
    expect(apiEdgeSection!.size.width).toBeGreaterThan(0)
    expect(apiEdgeSection!.size.height).toBeGreaterThan(0)

    // Assert that node-db and node-config are present and correctly mapped
    const dbNode = slide.elements.find(e => e.id === 'node-db')
    expect(dbNode).toBeDefined()
    expect(dbNode!.type).toBe('shape')
    expect((dbNode!.content as any).shapeType).toBe('cylinder')
    expect((dbNode!.content as any).label).toBe('User DB')

    const configNode = slide.elements.find(e => e.id === 'node-config')
    expect(configNode).toBeDefined()
    expect(configNode!.type).toBe('code')
    expect((configNode!.content as any).value).toBe('const config = {}')
    expect((configNode!.content as any).language).toBe('javascript')
  })
})
