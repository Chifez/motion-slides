import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../../../store/editor-store'
import { executeAgentTool, agentToolSchemas } from '../tools'
import type { ChartContent, CodeContent } from '@motionslides/shared'

describe('Element Agent Tools — Chart & Code', () => {
  beforeEach(() => {
    useEditorStore.setState({
      activeProjectId: 'proj-element-test',
      activeSlideIndex: 0,
      projects: [
        {
          id: 'proj-element-test',
          name: 'Element Test Project',
          slides: [
            {
              id: 'slide-1',
              name: 'Slide 1',
              background: '#0b0c16',
              elements: [
                {
                  id: 'chart-1',
                  type: 'chart',
                  position: { x: 80, y: 205 },
                  size: { width: 530, height: 315 },
                  rotation: 0,
                  opacity: 1,
                  zIndex: 11,
                  animation: 'fade-in',
                  animationDelay: 0.2,
                  content: {
                    chartType: 'bar',
                    data: [
                      { label: 'Regular', value: 92 },
                      { label: 'Secure', value: 99.5 },
                    ],
                    colors: ['#38bdf8'],
                    showGrid: true,
                    showLabels: true,
                  } as ChartContent,
                },
                {
                  id: 'data-label-1',
                  type: 'text',
                  position: { x: 80, y: 171 },
                  size: { width: 530, height: 28 },
                  rotation: 0,
                  opacity: 1,
                  zIndex: 12,
                  animation: 'fade-in',
                  animationDelay: 0.1,
                  content: {
                    value: 'Success Rate (%)',
                    fontSize: 16,
                    color: '#ffffff',
                  } as any,
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
        } as any,
      ],
    })
  })

  it('should register chart and code tools in schema registry', () => {
    expect(agentToolSchemas.addChartElement).toBeDefined()
    expect(agentToolSchemas.updateChartElement).toBeDefined()
    expect(agentToolSchemas.addCodeElement).toBeDefined()
    expect(agentToolSchemas.updateCodeElement).toBeDefined()
  })

  it('updates an existing bar chart to a line chart in place', async () => {
    const res = await executeAgentTool('updateChartElement', {
      chartType: 'line',
    })

    expect(res.success).toBe(true)
    const slide = useEditorStore.getState().activeProject()?.slides[0]
    const chart = slide?.elements.find((e) => e.type === 'chart')
    expect(chart).toBeDefined()
    expect((chart?.content as ChartContent).chartType).toBe('line')
    // Data preserved
    expect((chart?.content as ChartContent).data).toHaveLength(2)
    expect((chart?.content as ChartContent).data[0]).toMatchObject({ label: 'Regular', value: 92 })
  })

  it('updates chart title and title label text simultaneously', async () => {
    const res = await executeAgentTool('updateChartElement', {
      title: 'Upload Reliability',
      unit: '%',
    })

    expect(res.success).toBe(true)
    const slide = useEditorStore.getState().activeProject()?.slides[0]
    const titleText = slide?.elements.find((e) => e.id === 'data-label-1')
    expect((titleText?.content as any).value).toBe('Upload Reliability (%)')
  })

  it('adds a new chart element to the slide', async () => {
    const res = await executeAgentTool('addChartElement', {
      title: 'P95 Latency',
      chartType: 'line',
      unit: 'ms',
      data: [
        { label: 'Regular', value: 180 },
        { label: 'Secure', value: 45 },
      ],
    })

    expect(res.success).toBe(true)
    const slide = useEditorStore.getState().activeProject()?.slides[0]
    const charts = slide?.elements.filter((e) => e.type === 'chart')
    expect(charts).toHaveLength(2)
    const newChart = charts?.find((c) => c.id !== 'chart-1')
    expect(newChart).toBeDefined()
    expect((newChart?.content as ChartContent).chartType).toBe('line')
  })

  it('adds and updates a code block element', async () => {
    const addRes = await executeAgentTool('addCodeElement', {
      title: 'upload.ts',
      language: 'typescript',
      code: 'import { PutObjectCommand } from "@aws-sdk/client-s3"\nconst cmd = new PutObjectCommand({ Bucket: "media" })',
    })

    expect(addRes.success).toBe(true)
    const slide = useEditorStore.getState().activeProject()?.slides[0]
    const codeEl = slide?.elements.find((e) => e.type === 'code')
    expect(codeEl).toBeDefined()
    expect((codeEl?.content as CodeContent).language).toBe('typescript')

    const updateRes = await executeAgentTool('updateCodeElement', {
      elementId: codeEl?.id,
      code: '// Updated code\nconsole.log("done")',
    })
    expect(updateRes.success).toBe(true)
    const updatedSlide = useEditorStore.getState().activeProject()?.slides[0]
    const updatedCodeEl = updatedSlide?.elements.find((e) => e.id === codeEl?.id)
    expect((updatedCodeEl?.content as CodeContent).value).toContain('console.log("done")')
  })
})
