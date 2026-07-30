import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../../../store/editor-store'
import { executeAgentTool, agentToolSchemas } from '../tools'

describe('Agent Granular Diagram Tools', () => {
  beforeEach(() => {
    // Reset editor store state with a dummy active project and slide
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

  it('should register all diagram and slide tool schemas', () => {
    expect(agentToolSchemas.addShapeElement).toBeDefined()
    expect(agentToolSchemas.addSectionElement).toBeDefined()
    expect(agentToolSchemas.addLineElement).toBeDefined()
    expect(agentToolSchemas.deleteElement).toBeDefined()
    expect(agentToolSchemas.addSlide).toBeDefined()
    expect(agentToolSchemas.addTextElement).toBeDefined()
  })

  it('should execute addShapeElement to add server/database shapes', async () => {
    const res = await executeAgentTool('addShapeElement', {
      shapeType: 'server',
      label: 'App Server',
      x: 300,
      y: 200,
      width: 90,
      height: 90,
      stroke: '#3b82f6',
    })

    expect(res.success).toBe(true)
    const store = useEditorStore.getState()
    const activeSlide = store.activeSlide()
    expect(activeSlide?.elements.length).toBe(1)

    const shapeEl = activeSlide?.elements[0]
    expect(shapeEl?.type).toBe('shape')
    expect(shapeEl?.position).toEqual({ x: 300, y: 200 })
    expect((shapeEl?.content as any).shapeType).toBe('server')
    expect((shapeEl?.content as any).label).toBe('App Server')
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
    // Add two nodes first
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
