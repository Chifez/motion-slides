import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../../../store/editor-store'
import { executeAgentTool, agentToolSchemas } from '../tools'

describe('Agent Diagram & Layout Tools', () => {
  beforeEach(() => {
    // Reset editor store state with a clean active project and slide
    useEditorStore.setState({
      activeProjectId: 'proj-1',
      activeSlideIndex: 0,
      projects: [
        {
          id: 'proj-1',
          name: 'Test Project',
          description: 'Test',
          slides: [
            {
              id: 'slide-1',
              name: 'Slide 1',
              elements: [],
              background: '#0d0d14',
            },
          ],
          transitions: [],
          prototypeLayout: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
          synced: true,
          shareKey: 'test',
          visibility: 'private',
        },
      ],
    })
  })

  it('should register all diagram and slide tool schemas with inputSchema', () => {
    expect(agentToolSchemas.addShapeElement).toBeDefined()
    expect(agentToolSchemas.addSectionElement).toBeDefined()
    expect(agentToolSchemas.addLineElement).toBeDefined()
    expect(agentToolSchemas.generateDiagram).toBeDefined()
    expect((agentToolSchemas.generateDiagram as any).inputSchema).toBeDefined()
    expect((agentToolSchemas.addSlide as any).inputSchema).toBeDefined()
    expect((agentToolSchemas.addTextElement as any).inputSchema).toBeDefined()
  })

  it('should execute generateDiagram with auto-scaling and centered coordinates', async () => {
    const res = await executeAgentTool('generateDiagram', {
      nodes: [
        { id: 'client', shapeType: 'client', label: 'Client App', sublabel: 'React / Next.js' },
        { id: 'api', shapeType: 'server', label: 'API Gateway', sublabel: 'REST API' },
        { id: 'transcoder', shapeType: 'server', label: 'Transcoder Service', sublabel: 'FFmpeg Worker' },
        { id: 'bucket', shapeType: 'bucket', label: 'S3 Media Storage', sublabel: 'Raw & Processed' },
        { id: 'db', shapeType: 'database', label: 'PostgreSQL DB', sublabel: 'Metadata Store' },
      ],
      edges: [
        { from: 'client', to: 'api', label: 'POST /upload' },
        { from: 'api', to: 'transcoder', label: 'Queue Job' },
        { from: 'transcoder', to: 'bucket', label: 'Store Video' },
        { from: 'transcoder', to: 'db', label: 'Save Metadata' },
      ],
      direction: 'LR',
    })

    expect(res.success).toBe(true)
    const store = useEditorStore.getState()
    const activeSlide = store.activeSlide()
    expect(activeSlide).toBeDefined()

    // 5 shapes + 4 connecting lines = 9 elements
    expect(activeSlide?.elements.length).toBe(9)

    const shapes = activeSlide?.elements.filter(e => e.type === 'shape') ?? []
    expect(shapes.length).toBe(5)

    const lines = activeSlide?.elements.filter(e => e.type === 'line') ?? []
    expect(lines.length).toBe(4)

    // Verify all shapes are placed cleanly within the 1280x720 canvas
    shapes.forEach(shape => {
      expect(shape.position.x).toBeGreaterThanOrEqual(20)
      expect(shape.position.x + shape.size.width).toBeLessThanOrEqual(1260)
      expect(shape.position.y).toBeGreaterThanOrEqual(20)
      expect(shape.position.y + shape.size.height).toBeLessThanOrEqual(700)
    })

    // Verify line connections have proper ports mapped
    const clientToApiLine = lines.find(l => (l.content as any).startConnection?.elementId === 'client')
    expect(clientToApiLine).toBeDefined()
    expect((clientToApiLine?.content as any).startConnection?.handleId).toBe('right')
    expect((clientToApiLine?.content as any).endConnection?.handleId).toBe('left')
  })

  it('should execute generateDiagram with compound container sections', async () => {
    const res = await executeAgentTool('generateDiagram', {
      nodes: [
        { id: 'client', shapeType: 'client', label: 'Client App', layer: 'Edge Tier' },
        { id: 'api', shapeType: 'server', label: 'API Gateway', layer: 'Compute Layer' },
        { id: 'worker', shapeType: 'server', label: 'Processing Worker', layer: 'Compute Layer' },
        { id: 'db', shapeType: 'database', label: 'Database', layer: 'Storage Layer' },
      ],
      edges: [
        { from: 'client', to: 'api' },
        { from: 'api', to: 'worker' },
        { from: 'worker', to: 'db' },
      ],
      sections: [
        { label: 'Edge Tier', layer: 'Edge Tier' },
        { label: 'Compute VPC', layer: 'Compute Layer' },
        { label: 'Data Store VPC', layer: 'Storage Layer' },
      ],
    })

    expect(res.success).toBe(true)
    const store = useEditorStore.getState()
    const activeSlide = store.activeSlide()

    const sections = activeSlide?.elements.filter(e => e.type === 'section') ?? []
    expect(sections.length).toBe(3)

    // Sections should be at bottom zIndex
    sections.forEach(sec => {
      expect(sec.zIndex).toBe(1)
      expect(sec.position.x).toBeGreaterThanOrEqual(20)
      expect(sec.position.y).toBeGreaterThanOrEqual(20)
    })
  })

  it('should auto-position shapes without overlapping when coordinates are omitted', async () => {
    const res1 = await executeAgentTool('addShapeElement', {
      shapeType: 'client',
      label: 'Client 1',
    })
    const res2 = await executeAgentTool('addShapeElement', {
      shapeType: 'server',
      label: 'Server 1',
    })

    expect(res1.success).toBe(true)
    expect(res2.success).toBe(true)

    const store = useEditorStore.getState()
    const activeSlide = store.activeSlide()
    expect(activeSlide?.elements.length).toBe(2)

    const shape1 = activeSlide?.elements[0]
    const shape2 = activeSlide?.elements[1]

    // Shapes should not have identical coordinates
    expect(shape1?.position.x).not.toBe(shape2?.position.x)
  })

  it('should execute addSectionElement to add boundary containers', async () => {
    const res = await executeAgentTool('addSectionElement', {
      label: 'AWS VPC Core',
      x: 240,
      y: 80,
      width: 700,
      height: 420,
    })

    expect(res.success).toBe(true)
    const store = useEditorStore.getState()
    const activeSlide = store.activeSlide()
    expect(activeSlide?.elements.length).toBe(1)

    const secEl = activeSlide?.elements[0]
    expect(secEl?.type).toBe('section')
    expect(secEl?.position).toEqual({ x: 240, y: 80 })
    expect(secEl?.zIndex).toBe(1)
    expect((secEl?.content as any).label).toBe('AWS VPC Core')
  })

  it('should execute addLineElement to connect nodes', async () => {
    await executeAgentTool('addShapeElement', { id: 'node-1', shapeType: 'client', label: 'Client', x: 100, y: 200 })
    await executeAgentTool('addShapeElement', { id: 'node-2', shapeType: 'server', label: 'Server', x: 400, y: 200 })

    const lineRes = await executeAgentTool('addLineElement', {
      fromElementId: 'node-1',
      toElementId: 'node-2',
      fromPort: 'right',
      toPort: 'left',
      lineType: 'elbow',
      style: 'dashed',
      label: 'request',
    })

    expect(lineRes.success).toBe(true)
    const store = useEditorStore.getState()
    const activeSlide = store.activeSlide()
    expect(activeSlide?.elements.length).toBe(3)

    const lineEl = activeSlide?.elements.find((e) => e.type === 'line')
    expect(lineEl).toBeDefined()
    expect((lineEl?.content as any).lineType).toBe('elbow')
    expect((lineEl?.content as any).label).toBe('request')
  })

  it('should execute deleteElement to remove an element by ID', async () => {
    const addRes = await executeAgentTool('addShapeElement', { id: 'node-to-delete', shapeType: 'database', label: 'DB' })
    expect(addRes.success).toBe(true)

    const delRes = await executeAgentTool('deleteElement', { elementId: 'node-to-delete' })
    expect(delRes.success).toBe(true)

    const store = useEditorStore.getState()
    const activeSlide = store.activeSlide()
    expect(activeSlide?.elements.length).toBe(0)
  })
})
