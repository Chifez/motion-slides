import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../../../store/editor-store'
import { executeAgentTool, agentToolSchemas } from '../tools'

describe('Motion & Transition Agent Tools', () => {
  beforeEach(() => {
    useEditorStore.setState({
      activeProjectId: 'proj-motion',
      activeSlideIndex: 0,
      projects: [
        {
          id: 'proj-motion',
          name: 'Motion Test Project',
          description: 'Testing Motion Tools',
          slides: [
            {
              id: 'slide-1',
              name: 'Slide 1',
              background: '#0b0c16',
              elements: [
                {
                  id: 'node-client',
                  type: 'shape',
                  position: { x: 100, y: 200 },
                  size: { width: 140, height: 80 },
                  rotation: 0,
                  opacity: 1,
                  zIndex: 2,
                  animation: 'none',
                  animationDelay: 0,
                  content: { shapeType: 'client', label: 'Client App' },
                },
                {
                  id: 'node-api',
                  type: 'shape',
                  position: { x: 350, y: 200 },
                  size: { width: 140, height: 80 },
                  rotation: 0,
                  opacity: 1,
                  zIndex: 2,
                  animation: 'none',
                  animationDelay: 0,
                  content: { shapeType: 'server', label: 'API Gateway' },
                },
                {
                  id: 'node-db',
                  type: 'shape',
                  position: { x: 600, y: 200 },
                  size: { width: 140, height: 80 },
                  rotation: 0,
                  opacity: 1,
                  zIndex: 2,
                  animation: 'none',
                  animationDelay: 0,
                  content: { shapeType: 'database', label: 'Primary DB' },
                },
                {
                  id: 'line-client-api',
                  type: 'line',
                  position: { x: 0, y: 0 },
                  size: { width: 100, height: 100 },
                  rotation: 0,
                  opacity: 1,
                  zIndex: 3,
                  animation: 'none',
                  animationDelay: 0,
                  content: {
                    lineType: 'elbow',
                    style: 'solid',
                    startConnection: { elementId: 'node-client', handleId: 'right' },
                    endConnection: { elementId: 'node-api', handleId: 'left' },
                  },
                },
                {
                  id: 'line-api-db',
                  type: 'line',
                  position: { x: 0, y: 0 },
                  size: { width: 100, height: 100 },
                  rotation: 0,
                  opacity: 1,
                  zIndex: 3,
                  animation: 'none',
                  animationDelay: 0,
                  content: {
                    lineType: 'elbow',
                    style: 'solid',
                    startConnection: { elementId: 'node-api', handleId: 'right' },
                    endConnection: { elementId: 'node-db', handleId: 'left' },
                  },
                },
              ],
            },
            {
              id: 'slide-2',
              name: 'Slide 2',
              background: '#0b0c16',
              elements: [
                {
                  id: 'node-api-gen-2',
                  type: 'shape',
                  position: { x: 200, y: 150 },
                  size: { width: 180, height: 100 },
                  rotation: 0,
                  opacity: 1,
                  zIndex: 2,
                  animation: 'none',
                  animationDelay: 0,
                  content: { shapeType: 'server', label: 'API Gateway' },
                },
                {
                  id: 'node-cache',
                  type: 'shape',
                  position: { x: 500, y: 150 },
                  size: { width: 140, height: 80 },
                  rotation: 0,
                  opacity: 1,
                  zIndex: 2,
                  animation: 'none',
                  animationDelay: 0,
                  content: { shapeType: 'database', label: 'Redis Cache' },
                },
              ],
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

  it('should register choreographFlow, optimizeMagicMove, and setSlideTimingAndTransitions schemas', () => {
    expect(agentToolSchemas.choreographFlow).toBeDefined()
    expect(agentToolSchemas.optimizeMagicMove).toBeDefined()
    expect(agentToolSchemas.setSlideTimingAndTransitions).toBeDefined()
  })

  it('should choreograph causal flow sequence with calculated staggered entrance delays', async () => {
    const res = await executeAgentTool('choreographFlow', {
      flowSequence: ['node-client', 'node-api', 'node-db'],
      stepDelay: 0.5,
      nodeAnimation: 'pop',
      lineAnimation: 'draw',
    })

    expect(res.success).toBe(true)

    const store = useEditorStore.getState()
    const slide = store.activeSlide()

    const client = slide?.elements.find((e) => e.id === 'node-client')
    const api = slide?.elements.find((e) => e.id === 'node-api')
    const db = slide?.elements.find((e) => e.id === 'node-db')

    // Nodes should have progressive delays: 0.0s, 0.5s, 1.0s
    expect(client?.animation).toBe('pop')
    expect(client?.animationDelay).toBe(0)

    expect(api?.animation).toBe('pop')
    expect(api?.animationDelay).toBe(0.5)

    expect(db?.animation).toBe('pop')
    expect(db?.animationDelay).toBe(1)

    // Intermediate lines should have half-step delays: 0.25s, 0.75s
    const lineClientApi = slide?.elements.find((e) => e.id === 'line-client-api')
    const lineApiDb = slide?.elements.find((e) => e.id === 'line-api-db')

    expect(lineClientApi?.animation).toBe('draw')
    expect(lineClientApi?.animationDelay).toBe(0.25)

    expect(lineApiDb?.animation).toBe('draw')
    expect(lineApiDb?.animationDelay).toBe(0.75)
  })

  it('should optimize Magic Move transitions and reconcile entity IDs between adjacent slides', async () => {
    const res = await executeAgentTool('optimizeMagicMove', {
      autoReconcileIds: true,
      setTransitions: true,
      duration: 0.8,
    })

    expect(res.success).toBe(true)

    const store = useEditorStore.getState()
    const project = store.activeProject()

    // Slide 2's API Gateway had ID 'node-api-gen-2', which should be reconciled to 'node-api'
    const slide2 = project?.slides[1]
    const reconciledApi = slide2?.elements.find((e) => (e.content as any).label === 'API Gateway')
    expect(reconciledApi?.id).toBe('node-api')

    // Magic Move transition should be created between Slide 1 and Slide 2
    expect(project?.transitions.length).toBe(1)
    expect(project?.transitions[0].animation).toBe('magic-move')
    expect(project?.transitions[0].duration).toBe(0.8)
  })

  it('should set slide timing and transition type across all slides', async () => {
    const res = await executeAgentTool('setSlideTimingAndTransitions', {
      transitionType: 'slide-left',
      duration: 0.5,
      applyTo: 'all-slides',
    })

    expect(res.success).toBe(true)

    const store = useEditorStore.getState()
    const project = store.activeProject()
    expect(project?.transitions[0].animation).toBe('slide-left')
    expect(project?.transitions[0].duration).toBe(0.5)
  })
})
