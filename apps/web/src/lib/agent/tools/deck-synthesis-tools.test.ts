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
    expect(project?.transitions[0].animation).toBe('magic-move')
    expect(project?.transitions[0].fromSlideId).toBe(slide1?.id)
    expect(project?.transitions[0].toSlideId).toBe(slide2?.id)
  })

  it('creates real chart and code elements with a presentation-safe data layout', async () => {
    const res = await executeAgentTool('synthesizeDeckFromDocument', {
      documentTitle: 'Secure Media Upload Comparison',
      slides: [
        {
          name: 'Performance Metrics',
          intent: 'metrics',
          title: 'Security improves upload reliability',
          charts: [
            {
              id: 'success-rate',
              title: 'Upload success rate',
              chartType: 'line',
              unit: '%',
              categories: ['100 rps', '500 rps', '1k rps'],
              series: [
                { name: 'Regular', values: [97, 93, 91], color: '#fb7185' },
                { name: 'Secure', values: [99.9, 99.8, 99.7], color: '#34d399' },
              ],
              insight: 'Signed uploads eliminate expired-session retries.',
            },
            {
              id: 'p95-latency',
              title: 'P95 upload latency',
              chartType: 'line',
              unit: 's',
              categories: ['100 rps', '500 rps', '1k rps'],
              series: [
                { name: 'Regular', values: [2.1, 3.6, 4.8] },
                { name: 'Secure', values: [1.8, 2.3, 2.9] },
              ],
            },
          ],
        },
        {
          name: 'Implementation',
          intent: 'code',
          title: 'Issue short-lived upload URLs',
          codeBlocks: [
            {
              id: 'presign-handler',
              title: 'presign-upload.ts',
              language: 'typescript',
              value: 'const url = await createPresignedUpload({ expiresIn: 60 })\nreturn { url }',
              caption: 'The client uploads directly without receiving storage credentials.',
            },
          ],
        },
      ],
    })

    expect(res.success).toBe(true)
    const slides = useEditorStore.getState().activeProject()?.slides ?? []

    const metricSlide = slides[0]
    const charts = metricSlide.elements.filter(element => element.type === 'chart')
    expect(charts).toHaveLength(2)
    expect(charts.map(chart => chart.id)).toEqual(['success-rate', 'p95-latency'])
    expect(charts.every(chart => chart.size.width >= 500 && chart.size.height >= 300)).toBe(true)
    expect(charts.every(chart => chart.position.y >= 150)).toBe(true)
    expect((charts[0].content as any).series).toHaveLength(2)
    expect((charts[0].content as any).data[1]).toMatchObject({ label: '500 rps', values: { s1: 99.8 } })

    const codeSlide = slides[1]
    const code = codeSlide.elements.find(element => element.type === 'code')
    expect(code).toBeDefined()
    expect(code?.id).toBe('presign-handler')
    // Short snippets get a content-fitted window, centered, never the full slot.
    expect(code!.size.height).toBeLessThan(220)
    expect(Math.abs(code!.position.x + code!.size.width / 2 - 640)).toBeLessThanOrEqual(1)
    expect(code?.content).toMatchObject({ language: 'typescript', title: 'presign-upload.ts' })
  })

  it('rejects metric and code intents that omit their native visual element', async () => {
    const metricsResult = await executeAgentTool('synthesizeDeckFromDocument', {
      documentTitle: 'Invalid Metrics Deck',
      slides: [{ name: 'Metrics', intent: 'metrics', title: 'Text is not a chart' }],
    })
    const codeResult = await executeAgentTool('synthesizeDeckFromDocument', {
      documentTitle: 'Invalid Code Deck',
      slides: [{ name: 'Implementation', intent: 'code', title: 'Text is not code' }],
    })

    const validTwoPointChart = await executeAgentTool('synthesizeDeckFromDocument', {
      documentTitle: 'Two Point Metrics Deck',
      slides: [{
        name: 'Metrics',
        intent: 'metrics',
        charts: [{ title: 'Latency', data: [{ label: 'Regular', value: 100 }, { label: 'Secure', value: 50 }] }],
      }],
    })
    expect(validTwoPointChart.success).toBe(true)
    expect(metricsResult).toMatchObject({ success: false, error: expect.stringContaining('no native chart') })
    expect(codeResult).toMatchObject({ success: false, error: expect.stringContaining('no native code block') })
  })

  it('rejects malformed topology and mixed slides without replacing the existing deck', async () => {
    const malformedEdge = await executeAgentTool('synthesizeDeckFromDocument', {
      documentTitle: 'Malformed Architecture',
      slides: [{
        name: 'Architecture',
        intent: 'architecture',
        nodes: [
          { id: 'client', shapeType: 'client', label: 'Client' },
          { id: 'api', shapeType: 'server', label: 'API' },
        ],
        edges: [{ from: 'client', to: 'missing', label: 'Request' }],
      }],
    })
    const mixedSlide = await executeAgentTool('synthesizeDeckFromDocument', {
      documentTitle: 'Overloaded Slide',
      slides: [{
        name: 'Everything at once',
        nodes: [{ id: 'api', shapeType: 'server', label: 'API' }],
        charts: [{ title: 'Latency', chartType: 'bar', data: [{ label: 'A', value: 1 }, { label: 'B', value: 2 }] }],
      }],
    })

    expect(malformedEdge).toMatchObject({ success: false, error: expect.stringContaining('does not reference existing node IDs') })
    expect(mixedSlide).toMatchObject({ success: false, error: expect.stringContaining('mixes an architecture graph') })
    expect(useEditorStore.getState().activeProject()?.slides.map((slide) => slide.id)).toEqual(['slide-initial'])
  })

  it('validates IDs, chart data, code length, and shape types at the execution boundary', async () => {
    const result = await executeAgentTool('synthesizeDeckFromDocument', {
      documentTitle: 'Invalid Payload',
      slides: [{
        name: 'Invalid',
        nodes: [{ id: 'bad id', shapeType: 'unsupported-shape', label: 'Bad node' }],
        charts: [{ title: 'Duplicate labels', chartType: 'pie', data: [{ label: 'A', value: -1 }, { label: 'A', value: 2 }] }],
        codeBlocks: [{ title: 'too-long.ts', language: 'typescript', value: Array.from({ length: 31 }, () => 'line').join('\n') }],
      }],
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid deck synthesis payload')
    expect(useEditorStore.getState().activeProject()?.name).toBe('Untitled Deck')
  })
})
