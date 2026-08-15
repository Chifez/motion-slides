import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../../../store/editor-store'
import { executeAgentTool, agentToolSchemas } from '../tools'

describe('Presentation Quality Audit Agent Tools', () => {
  beforeEach(() => {
    useEditorStore.setState({
      activeProjectId: 'proj-audit',
      activeSlideIndex: 0,
      projects: [
        {
          id: 'proj-audit',
          name: 'Audit Test Project',
          description: 'Testing Audit Tools',
          slides: [
            {
              id: 'slide-1',
              name: 'Slide 1',
              background: '#0b0c16', // Dark background
              elements: [
                {
                  id: 'text-low-contrast',
                  type: 'text',
                  position: { x: 80, y: 50 },
                  size: { width: 500, height: 50 },
                  rotation: 0,
                  opacity: 1,
                  zIndex: 10,
                  animation: 'none',
                  animationDelay: 0,
                  content: {
                    text: 'Very Dark Unreadable Text',
                    fontSize: 24,
                    color: '#1a1a2e', // Very low contrast against #0b0c16
                  },
                },
                {
                  id: 'line-orphaned',
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
                    startConnection: { elementId: 'non-existent-node-1', handleId: 'right' },
                    endConnection: { elementId: 'non-existent-node-2', handleId: 'left' },
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

  it('should register auditPresentationQuality schema in registry', () => {
    expect(agentToolSchemas.auditPresentationQuality).toBeDefined()
    expect((agentToolSchemas.auditPresentationQuality as any).inputSchema).toBeDefined()
  })

  it('should audit presentation quality and report contrast and orphaned line issues', async () => {
    const res = await executeAgentTool('auditPresentationQuality', { autoFix: false })

    expect(res.success).toBe(true)
    const auditData = res.data as any
    expect(auditData.contrastViolations).toBeGreaterThan(0)
    expect(auditData.orphanedLines).toBeGreaterThan(0)
    expect(auditData.reportMarkdown).toContain('Quality Score')
  })

  it('should auto-fix contrast violations and remove orphaned connector lines when autoFix is true', async () => {
    const res = await executeAgentTool('auditPresentationQuality', { autoFix: true })

    expect(res.success).toBe(true)
    const auditData = res.data as any
    expect(auditData.autoFixedCount).toBeGreaterThan(0)

    const store = useEditorStore.getState()
    const slide = store.activeSlide()

    // Orphaned line should be removed
    const orphanedLine = slide?.elements.find((e) => e.id === 'line-orphaned')
    expect(orphanedLine).toBeUndefined()

    // Text color should be corrected to white
    const textEl = slide?.elements.find((e) => e.id === 'text-low-contrast')
    expect((textEl?.content as any).color).toBe('#ffffff')
  })
})
