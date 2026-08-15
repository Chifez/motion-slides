import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../../../store/editor-store'
import { executeAgentTool, agentToolSchemas } from '../tools'

describe('Git Branching & Review Agent Tools', () => {
  beforeEach(() => {
    useEditorStore.setState({
      activeProjectId: 'proj-git',
      activeSlideIndex: 0,
      projects: [
        {
          id: 'proj-git',
          name: 'Git Master Deck',
          description: 'Testing Git Tools',
          activeBranch: 'main',
          branches: {
            main: {
              slides: [
                {
                  id: 'slide-1',
                  name: 'Slide 1: Main Architecture',
                  background: '#0b0c16',
                  elements: [],
                },
              ],
              updatedAt: Date.now(),
            },
          },
          slides: [
            {
              id: 'slide-1',
              name: 'Slide 1: Main Architecture',
              background: '#0b0c16',
              elements: [],
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

  it('should register createExploratoryBranch, switchBranch, listBranches, and agenticMergeReview schemas', () => {
    expect(agentToolSchemas.createExploratoryBranch).toBeDefined()
    expect(agentToolSchemas.switchBranch).toBeDefined()
    expect(agentToolSchemas.listBranches).toBeDefined()
    expect(agentToolSchemas.agenticMergeReview).toBeDefined()
  })

  it('should create an exploratory branch and list active branches', async () => {
    const res = await executeAgentTool('createExploratoryBranch', {
      branchName: 'feature/event-driven',
      commitMessage: 'Initial branch for event-driven architecture exploration',
    })

    expect(res.success).toBe(true)

    const store = useEditorStore.getState()
    const project = store.activeProject() as any
    expect(project.activeBranch).toBe('feature/event-driven')
    expect(project.branches['feature/event-driven']).toBeDefined()

    const listRes = await executeAgentTool('listBranches', {})
    expect(listRes.success).toBe(true)
    const branchList = (listRes.data as any).branches
    expect(branchList.length).toBe(2)
  })

  it('should switch between branches seamlessly', async () => {
    // Create branch first
    await executeAgentTool('createExploratoryBranch', { branchName: 'feature/kafka' })

    // Switch back to main
    const switchRes = await executeAgentTool('switchBranch', { branchName: 'main' })
    expect(switchRes.success).toBe(true)

    const store = useEditorStore.getState()
    const project = store.activeProject() as any
    expect(project.activeBranch).toBe('main')
  })

  it('should generate an agentic merge review markdown summary', async () => {
    // On feature branch, add a new slide
    await executeAgentTool('createExploratoryBranch', { branchName: 'feature/new-slides' })
    await executeAgentTool('addSlide', { targetIndex: 1 })

    const reviewRes = await executeAgentTool('agenticMergeReview', { targetBranch: 'main' })
    expect(reviewRes.success).toBe(true)
    const reviewData = reviewRes.data as any
    expect(reviewData.addedSlides).toBe(1)
    expect(reviewData.reviewMarkdown).toContain('Merge Review')
  })
})
