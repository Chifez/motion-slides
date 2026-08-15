import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../../../store/editor-store'
import { executeAgentTool, agentToolSchemas } from '../tools'

describe('Theme & Styling Agent Tools', () => {
  beforeEach(() => {
    useEditorStore.setState({
      activeProjectId: 'proj-theme',
      activeSlideIndex: 0,
      projects: [
        {
          id: 'proj-theme',
          name: 'Theme Test Project',
          description: 'Testing Theme Tools',
          slides: [
            {
              id: 'slide-1',
              name: 'Slide 1',
              background: '#000000',
              elements: [
                {
                  id: 'title-1',
                  type: 'text',
                  position: { x: 80, y: 50 },
                  size: { width: 500, height: 50 },
                  rotation: 0,
                  opacity: 1,
                  zIndex: 10,
                  animation: 'fade-in',
                  animationDelay: 0,
                  content: {
                    text: 'System Architecture',
                    fontSize: 36,
                    fontFamily: 'Arial',
                    color: '#ffffff',
                  },
                },
                {
                  id: 'node-1',
                  type: 'shape',
                  position: { x: 100, y: 200 },
                  size: { width: 140, height: 80 },
                  rotation: 0,
                  opacity: 1,
                  zIndex: 2,
                  animation: 'fade-in',
                  animationDelay: 0,
                  content: {
                    shapeType: 'server',
                    label: 'API Server',
                    backgroundColor: '#111111',
                    borderColor: '#ffffff',
                    textColor: '#ffffff',
                  },
                },
                {
                  id: 'line-1',
                  type: 'line',
                  position: { x: 0, y: 0 },
                  size: { width: 100, height: 100 },
                  rotation: 0,
                  opacity: 1,
                  zIndex: 3,
                  animation: 'draw',
                  animationDelay: 0,
                  content: {
                    lineType: 'elbow',
                    style: 'solid',
                    color: '#ffffff',
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

  it('should register applyDeckTheme and harmonizeSlideStyles schemas', () => {
    expect(agentToolSchemas.applyDeckTheme).toBeDefined()
    expect(agentToolSchemas.harmonizeSlideStyles).toBeDefined()
  })

  it('should apply obsidian-cyan theme across the deck', async () => {
    const res = await executeAgentTool('applyDeckTheme', {
      theme: 'obsidian-cyan',
      typography: 'Outfit',
    })

    expect(res.success).toBe(true)

    const store = useEditorStore.getState()
    const slide = store.activeSlide()
    expect(slide?.background).toBe('#080c14')

    const title = slide?.elements.find((e) => e.id === 'title-1')
    expect((title?.content as any).fontFamily).toBe('Outfit')

    const shape = slide?.elements.find((e) => e.id === 'node-1')
    expect((shape?.content as any).borderColor).toBe('#06b6d4')

    const line = slide?.elements.find((e) => e.id === 'line-1')
    expect((line?.content as any).color).toBe('#06b6d4')
  })

  it('should harmonize font sizes across slides', async () => {
    const res = await executeAgentTool('harmonizeSlideStyles', {
      titleFontSize: 42,
      subtitleFontSize: 20,
      bodyFontSize: 14,
    })

    expect(res.success).toBe(true)

    const store = useEditorStore.getState()
    const slide = store.activeSlide()
    const title = slide?.elements.find((e) => e.id === 'title-1')
    expect((title?.content as any).fontSize).toBe(42)
  })
})
