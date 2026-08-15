import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../../../store/editor-store'
import { executeAgentTool, agentToolSchemas } from '../tools'

describe('Deck Synthesis Agent Tools', () => {
  beforeEach(() => {
    useEditorStore.setState({
      activeProjectId: 'proj-synthesis',
      activeSlideIndex: 0,
      projects: [
        {
          id: 'proj-synthesis',
          name: 'Untitled Deck',
          description: 'Test Deck',
          slides: [
            {
              id: 'slide-initial',
              name: 'Slide 1',
              elements: [],
              background: '#0b0c16',
            },
          ],
          transitions: [],
          prototypeLayout: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
          synced: true,
          shareKey: 'test-sync',
          visibility: 'private',
        },
      ],
    })
  })

  it('should register synthesizeDeckFromDocument in schema registry', () => {
    expect(agentToolSchemas.synthesizeDeckFromDocument).toBeDefined()
    expect((agentToolSchemas.synthesizeDeckFromDocument as any).inputSchema).toBeDefined()
  })

  it('should synthesize a multi-slide deck with stable entity IDs and Magic Move transitions', async () => {
    const res = await executeAgentTool('synthesizeDeckFromDocument', {
      documentTitle: 'Media Processing Pipeline',
      theme: 'midnight-indigo',
      slides: [
        {
          name: '1. Ingestion Overview',
          title: 'High-Throughput Ingestion',
          subtitle: 'Edge uploads & API Gateway routing',
          nodes: [
            { id: 'client-app', shapeType: 'client', label: 'Web / Mobile Client' },
            { id: 'api-gw', shapeType: 'server', label: 'API Gateway', layer: 'Edge Ingestion' },
            { id: 'upload-bucket', shapeType: 'bucket', label: 'S3 Raw Uploads', layer: 'Storage' },
          ],
          edges: [
            { from: 'client-app', to: 'api-gw', label: 'POST /upload' },
            { from: 'api-gw', to: 'upload-bucket', label: 'Direct S3 Put' },
          ],
        },
        {
          name: '2. Transcoding Workers',
          title: 'Asynchronous Video Transcoding',
          subtitle: 'FFmpeg processing and event triggers',
          nodes: [
            { id: 'upload-bucket', shapeType: 'bucket', label: 'S3 Raw Uploads', layer: 'Storage' },
            { id: 'sqs-queue', shapeType: 'queue', label: 'Job SQS Queue', layer: 'Event Bus' },
            { id: 'transcoder-worker', shapeType: 'server', label: 'Transcoder Lambda', layer: 'Compute' },
            { id: 'processed-bucket', shapeType: 'bucket', label: 'S3 Processed Video', layer: 'Storage' },
          ],
          edges: [
            { from: 'upload-bucket', to: 'sqs-queue', label: 'ObjectCreated Event' },
            { from: 'sqs-queue', to: 'transcoder-worker', label: 'Poll Batch' },
            { from: 'transcoder-worker', to: 'processed-bucket', label: 'Save HLS/MP4' },
          ],
        },
      ],
      setMagicMoveTransitions: true,
    })

    expect(res.success).toBe(true)

    const store = useEditorStore.getState()
    const project = store.activeProject()
    expect(project).toBeDefined()
    expect(project?.name).toBe('Media Processing Pipeline')
    expect(project?.slides.length).toBe(2)

    // Verify Slide 1
    const slide1 = project?.slides[0]
    expect(slide1?.name).toBe('1. Ingestion Overview')
    const slide1Shapes = slide1?.elements.filter(e => e.type === 'shape') ?? []
    expect(slide1Shapes.length).toBe(3)
    const clientNode = slide1Shapes.find(s => s.id === 'client-app')
    expect(clientNode).toBeDefined()

    // Verify Slide 2 reuses the identical ID 'upload-bucket' for Magic Move morphing
    const slide2 = project?.slides[1]
    expect(slide2?.name).toBe('2. Transcoding Workers')
    const slide2Shapes = slide2?.elements.filter(e => e.type === 'shape') ?? []
    expect(slide2Shapes.length).toBe(4)
    const sharedBucketNode = slide2Shapes.find(s => s.id === 'upload-bucket')
    expect(sharedBucketNode).toBeDefined()

    // Verify Magic Move transition was created
    expect(project?.transitions.length).toBe(1)
    expect(project?.transitions[0].type).toBe('magic-move')
    expect(project?.transitions[0].fromSlideId).toBe(slide1?.id)
    expect(project?.transitions[0].toSlideId).toBe(slide2?.id)
  })
})
