import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../../../store/editor-store'
import { executeAgentTool, agentToolSchemas } from '../tools'

describe('Presenter Mode & Export Agent Tools', () => {
  beforeEach(() => {
    useEditorStore.setState({
      activeProjectId: 'proj-presenter',
      activeSlideIndex: 0,
      isPresenting: false,
      projects: [
        {
          id: 'proj-presenter',
          name: 'Presenter Test Project',
          description: 'Testing Presenter Tools',
          slides: [
            {
              id: 'slide-1',
              name: 'Slide 1: Cloud Topology',
              background: '#0b0c16',
              speakerNotes: '',
              elements: [
                {
                  id: 'title-1',
                  type: 'text',
                  position: { x: 80, y: 50 },
                  size: { width: 500, height: 50 },
                  rotation: 0,
                  opacity: 1,
                  zIndex: 10,
                  animation: 'none',
                  animationDelay: 0,
                  content: {
                    text: 'Cloud Architecture Overview',
                    fontSize: 32,
                  },
                },
                {
                  id: 'node-api',
                  type: 'shape',
                  position: { x: 100, y: 200 },
                  size: { width: 140, height: 80 },
                  rotation: 0,
                  opacity: 1,
                  zIndex: 2,
                  animation: 'none',
                  animationDelay: 0,
                  content: { shapeType: 'server', label: 'API Gateway' },
                },
                {
                  id: 'line-1',
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
                    label: 'HTTPS Request',
                  },
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

  it('should register generateSpeakerNotes, startPresentationMode, and exportPresentation schemas', () => {
    expect(agentToolSchemas.generateSpeakerNotes).toBeDefined()
    expect(agentToolSchemas.startPresentationMode).toBeDefined()
    expect(agentToolSchemas.exportPresentation).toBeDefined()
  })

  it('should generate structured technical speaker notes and save them to the slide', async () => {
    const res = await executeAgentTool('generateSpeakerNotes', { style: 'technical' })

    expect(res.success).toBe(true)

    const store = useEditorStore.getState()
    const slide = store.activeSlide()
    expect(slide?.speakerNotes).toBeDefined()
    expect(slide?.speakerNotes).toContain('Technical Notes')
    expect(slide?.speakerNotes).toContain('API Gateway')
  })

  it('should generate executive speaker notes', async () => {
    const res = await executeAgentTool('generateSpeakerNotes', { style: 'executive' })

    expect(res.success).toBe(true)

    const store = useEditorStore.getState()
    const slide = store.activeSlide()
    expect(slide?.speakerNotes).toContain('Executive Briefing')
  })

  it('should trigger startPresentationMode', async () => {
    const res = await executeAgentTool('startPresentationMode', { autoplay: true })

    expect(res.success).toBe(true)

    const store = useEditorStore.getState()
    expect(store.isPresenting).toBe(true)
  })

  it('should prepare exportPresentation payload', async () => {
    const res = await executeAgentTool('exportPresentation', {
      format: 'video',
      aspectRatio: '16:9',
    })

    expect(res.success).toBe(true)
    const exportData = res.data as any
    expect(exportData.format).toBe('video')
    expect(exportData.aspectRatio).toBe('16:9')
  })
})
