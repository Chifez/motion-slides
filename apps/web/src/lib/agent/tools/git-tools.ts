import { z } from 'zod'
import { tool } from 'ai'
import { useEditorStore } from '../../../store/editor-store'
import type { Slide, SceneElement, TextContent } from '@motionslides/shared'

export const gitToolSchemas = {
  createExploratoryBranch: tool({
    description: 'Create a new Git branch on the active presentation project to explore alternative architectures or design variations risk-free.',
    inputSchema: z.object({
      branchName: z.string().describe('Name of the new branch (e.g. "feature/event-driven", "experiment/dark-mode")'),
      commitMessage: z.optional(z.string()).describe('Optional initial commit message for the branch'),
    }),
  }),

  agenticMergeReview: tool({
    description: 'Perform an intelligent visual and structural diff comparison between the current branch and a target branch (e.g. main), generating a comprehensive markdown review.',
    inputSchema: z.object({
      targetBranch: z.string().optional().default('main').describe('Target branch to compare against (default: "main")'),
    }),
  }),

  switchBranch: tool({
    description: 'Switch the active presentation project to an existing branch.',
    inputSchema: z.object({
      branchName: z.string().describe('Target branch name to switch to'),
    }),
  }),

  listBranches: tool({
    description: 'List all active Git branches and their commit metadata for the current presentation project.',
    inputSchema: z.object({}),
  }),
}

export type GitToolName = keyof typeof gitToolSchemas

export async function executeGitTool(
  toolName: GitToolName,
  args: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const store = useEditorStore.getState()
  const activeProjectId = store.activeProjectId
  const project = store.activeProject()

  if (!activeProjectId || !project) {
    return { success: false, error: 'No active project found for Git operation.' }
  }

  // Ensure project has branches tracking
  const currentBranch = (project as any).activeBranch || 'main'
  const branches: Record<string, { slides: Slide[]; updatedAt: number }> = (project as any).branches || {
    [currentBranch]: { slides: project.slides, updatedAt: project.updatedAt },
  }

  switch (toolName) {
    case 'createExploratoryBranch': {
      const { branchName, commitMessage } = args as { branchName: string; commitMessage?: string }
      const cleanBranch = branchName.trim().replace(/\s+/g, '-').toLowerCase()

      if (!cleanBranch) {
        return { success: false, error: 'Invalid branch name.' }
      }

      // Clone current slides for the new branch
      const clonedSlides = JSON.parse(JSON.stringify(project.slides)) as Slide[]
      const updatedBranches = {
        ...branches,
        [cleanBranch]: {
          slides: clonedSlides,
          updatedAt: Date.now(),
        },
      }

      // If store has commitLocally, invoke it
      if (typeof store.commitLocally === 'function') {
        store.commitLocally(commitMessage || `Branch created: ${cleanBranch}`)
      }

      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : {
                ...p,
                activeBranch: cleanBranch,
                branches: updatedBranches,
                updatedAt: Date.now(),
              } as any
        ),
      }))

      return {
        success: true,
        data: {
          branchName: cleanBranch,
          slideCount: clonedSlides.length,
          message: `Created and checked out exploratory branch "${cleanBranch}". You can now make changes freely without affecting main.`,
        },
      }
    }

    case 'switchBranch': {
      const { branchName } = args as { branchName: string }
      const targetBranch = branchName.trim()

      if (!branches[targetBranch]) {
        return {
          success: false,
          error: `Branch "${targetBranch}" does not exist. Available branches: ${Object.keys(branches).join(', ')}`,
        }
      }

      // Save current branch state before switching
      branches[currentBranch] = {
        slides: project.slides,
        updatedAt: Date.now(),
      }

      const destinationSlides = branches[targetBranch].slides

      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : {
                ...p,
                slides: destinationSlides,
                activeBranch: targetBranch,
                branches,
                updatedAt: Date.now(),
              } as any
        ),
        activeSlideIndex: 0,
      }))

      return {
        success: true,
        data: {
          activeBranch: targetBranch,
          slideCount: destinationSlides.length,
          message: `Switched to branch "${targetBranch}" (${destinationSlides.length} slides).`,
        },
      }
    }

    case 'listBranches': {
      const branchList = Object.entries(branches).map(([name, info]) => ({
        name,
        isActive: name === currentBranch,
        slideCount: info.slides.length,
        updatedAt: new Date(info.updatedAt).toLocaleTimeString(),
      }))

      return {
        success: true,
        data: {
          activeBranch: currentBranch,
          branches: branchList,
          message: `Project has ${branchList.length} active branch(es). Currently on "${currentBranch}".`,
        },
      }
    }

    case 'agenticMergeReview': {
      const { targetBranch = 'main' } = args as { targetBranch?: string }

      if (currentBranch === targetBranch) {
        return {
          success: true,
          data: {
            isIdentical: true,
            summary: `Current branch is already "${targetBranch}". No merge diff needed.`,
          },
        }
      }

      const targetBranchInfo = branches[targetBranch]
      if (!targetBranchInfo) {
        return {
          success: false,
          error: `Target branch "${targetBranch}" not found for merge comparison.`,
        }
      }

      const baseSlides = targetBranchInfo.slides
      const currentSlides = project.slides

      let addedSlides = 0
      let removedSlides = 0
      let modifiedSlides = 0
      const slideChanges: string[] = []

      // Compare slide lists
      const baseMap = new Map<string, Slide>(baseSlides.map((s) => [s.id, s]))
      const currentMap = new Map<string, Slide>(currentSlides.map((s) => [s.id, s]))

      currentSlides.forEach((s, idx) => {
        if (!baseMap.has(s.id)) {
          addedSlides++
          slideChanges.push(`- **Added Slide ${idx + 1}**: "${s.name}" (${s.elements.length} elements)`)
        } else {
          const baseSlide = baseMap.get(s.id)!
          if (baseSlide.elements.length !== s.elements.length || baseSlide.name !== s.name) {
            modifiedSlides++
            slideChanges.push(
              `- **Modified Slide ${idx + 1}**: "${s.name}" (${baseSlide.elements.length} → ${s.elements.length} elements)`
            )
          }
        }
      })

      baseSlides.forEach((s) => {
        if (!currentMap.has(s.id)) {
          removedSlides++
          slideChanges.push(`- **Removed Slide**: "${s.name}"`)
        }
      })

      const reviewMarkdown = `### 🔀 Merge Review: \`${currentBranch}\` ➔ \`${targetBranch}\`
**Summary of Changes:**
- **Slides Added**: ${addedSlides}
- **Slides Modified**: ${modifiedSlides}
- **Slides Removed**: ${removedSlides}

**Detailed Slide Breakdown:**
${slideChanges.length > 0 ? slideChanges.join('\n') : '- No structural differences detected.'}
`

      return {
        success: true,
        data: {
          sourceBranch: currentBranch,
          targetBranch,
          addedSlides,
          modifiedSlides,
          removedSlides,
          reviewMarkdown,
          message: `Generated merge review comparing "${currentBranch}" to "${targetBranch}".`,
        },
      }
    }

    default:
      return { success: false, error: `Unknown git tool: ${toolName}` }
  }
}
