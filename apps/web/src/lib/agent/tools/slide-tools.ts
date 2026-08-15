import { z } from 'zod'
import { tool } from 'ai'
import { useEditorStore } from '../../../store/editor-store'
import { uuid } from '../../uuid'
import type { SceneElement, Slide } from '@motionslides/shared'

export const slideToolSchemas = {
  addSlide: tool({
    description: 'Add a new blank slide to the presentation. Supports optional targetIndex for non-sequential additions.',
    inputSchema: z.object({
      name: z.string().optional().describe('A short descriptive name for the new slide'),
      background: z.string().optional().describe("Hex background color for the slide. Omit to inherit the presentation's existing dark theme."),
      targetIndex: z.number().optional().describe('Optional 0-based index target (e.g. 7 for Slide 8). Automatically creates intermediate slides if higher than current deck length.'),
    }),
  }),
  deleteSlide: tool({
    description: 'Delete a target slide or active slide.',
    inputSchema: z.object({
      confirm: z.boolean().describe('Must be true to confirm deletion'),
      slideIndex: z.number().optional().describe('Optional 0-based slide index target.'),
    }),
  }),
  goToSlide: tool({
    description: 'Switch the editor canvas to a specific slide.',
    inputSchema: z.object({
      slideIndex: z.number().describe('0-based index'),
    }),
  }),
  setSlideBackground: tool({
    description: 'Change the background color or gradient of a target slide or active slide.',
    inputSchema: z.object({
      background: z.string().describe('CSS color or gradient'),
      slideIndex: z.number().optional().describe('Optional 0-based slide index target.'),
    }),
  }),
  getProjectContext: tool({
    description: 'Get a lightweight summary of the whole deck: slide count, and per-slide a short title/summary + element count. Does NOT include full element detail — call getSlideContext(slideIndex) for a specific slide before editing it.',
    inputSchema: z.object({}),
  }),
  getSlideContext: tool({
    description: 'Get full detail (all elements, positions, styles) for one specific slide. Omit slideIndex to target the currently active slide in the editor.',
    inputSchema: z.object({
      slideIndex: z.number().optional().describe('Optional 0-based slide index target. Omit to inspect active slide.'),
    }),
  }),
}

function getStore() {
  return useEditorStore.getState()
}

function getTargetSlide(store: ReturnType<typeof getStore>, slideIndex?: number) {
  const project = store.activeProject()
  if (!project) return null
  if (slideIndex !== undefined) {
    return project.slides[slideIndex] ?? null
  }
  return store.activeSlide()
}

export type ToolResult = { success: boolean; [key: string]: unknown }

export async function executeSlideTool(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
  const store = getStore()

  switch (toolName) {
    case 'addSlide': {
      const { name, background, targetIndex } = args as { name?: string; background?: string; targetIndex?: number }
      const { activeProjectId } = store
      if (!activeProjectId) return { success: false, error: 'No active project.' }

      let createdCount = 0
      let newActiveIndex = 0
      let targetSlideId = ''
      let targetSlideName = ''
      let limitExceeded = false

      useEditorStore.setState((s) => {
        const p = s.projects.find(proj => proj.id === activeProjectId)
        if (!p) return s
        const currentCount = p.slides.length
        const requiredIndex = targetIndex !== undefined && targetIndex >= currentCount ? targetIndex : currentCount

        if (requiredIndex - currentCount + 1 > 10) {
          limitExceeded = true
          return s
        }

        const defaultBg = p.slides[0]?.background ?? '#0d0d14'
        const bg = background ?? defaultBg
        const createdSlides: Slide[] = []

        for (let i = currentCount; i <= requiredIndex; i++) {
          const isTarget = i === requiredIndex
          const slideNum = i + 1
          const slideName = isTarget ? (name || `Slide ${slideNum}`) : `Slide ${slideNum}`
          createdSlides.push({
            id: uuid(),
            name: slideName,
            elements: [] as SceneElement[],
            background: bg,
          })
        }

        createdCount = createdSlides.length
        newActiveIndex = requiredIndex
        targetSlideId = createdSlides[createdSlides.length - 1].id
        targetSlideName = createdSlides[createdSlides.length - 1].name

        return {
          projects: s.projects.map((proj) =>
            proj.id !== activeProjectId
              ? proj
              : { ...proj, slides: [...proj.slides, ...createdSlides], updatedAt: Date.now(), synced: false },
          ),
          activeSlideIndex: newActiveIndex,
        }
      })

      if (limitExceeded) {
        return { success: false, error: 'Cannot create more than 10 slides at once. Please specify a lower targetIndex.' }
      }

      return {
        success: true,
        createdCount,
        slideId: targetSlideId,
        slideName: targetSlideName,
        activeSlideIndex: newActiveIndex,
      }
    }

    case 'deleteSlide': {
      const { confirm, slideIndex } = args as { confirm: boolean; slideIndex?: number }
      if (!confirm) return { success: false, error: 'Deletion not confirmed.' }

      const targetIdx = slideIndex !== undefined ? slideIndex : store.activeSlideIndex
      store.deleteSlide(targetIdx)
      return { success: true, preview: `Slide ${targetIdx + 1} deleted.` }
    }

    case 'goToSlide': {
      const { slideIndex } = args as { slideIndex: number }
      const project = store.activeProject()
      if (!project) return { success: false, error: 'No active project.' }
      
      // Prevent undefined or NaN from bypassing bounds check and corrupting state
      if (typeof slideIndex !== 'number' || isNaN(slideIndex) || slideIndex < 0 || slideIndex >= project.slides.length)
        return { success: false, error: `Slide index ${slideIndex} out of range.` }
        
      store.setActiveSlide(slideIndex)
      return { success: true, slideIndex, slideName: project.slides[slideIndex].name }
    }

    case 'setSlideBackground': {
      const { background, slideIndex } = args as { background: string; slideIndex?: number }
      const activeProjectId = store.activeProjectId
      
      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }

      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : {
                ...p,
                slides: p.slides.map((sl) => (sl.id !== slide.id ? sl : { ...sl, background })),
                updatedAt: Date.now(),
              }
        ),
      }))

      return { success: true, background, slideName: slide.name }
    }

    case 'getProjectContext': {
      const project = store.activeProject()
      if (!project) return { success: false, error: 'No active project.' }

      return {
        success: true,
        projectName: project.name,
        slideCount: project.slides.length,
        activeSlideIndex: store.activeSlideIndex,
        slides: project.slides.map((s, i) => {
          const firstText = s.elements.find(el => el.type === 'text')
          const snippet = firstText ? String((firstText.content as any).value ?? '').slice(0, 50) : null
          return {
            index: i,
            id: s.id,
            name: s.name,
            elementCount: s.elements.length,
            firstTextSnippet: snippet
          }
        }),
        transitions: project.transitions.map((t) => {
          const from = project.slides.find((s) => s.id === t.fromSlideId)
          const to = project.slides.find((s) => s.id === t.toSlideId)
          return { id: t.id, from: from?.name, to: to?.name, animation: t.animation, trigger: t.trigger }
        }),
      }
    }

    case 'getSlideContext': {
      const { slideIndex } = args as { slideIndex?: number }
      const project = store.activeProject()
      if (!project) return { success: false, error: 'No active project.' }

      let targetIndex = slideIndex
      if (targetIndex === undefined) {
        targetIndex = store.activeSlideIndex
      }

      let slide = project.slides[targetIndex]
      if (!slide && targetIndex !== undefined && targetIndex > 0) {
        // Fallback check for 1-based indexing if 0-based index was out of range
        slide = project.slides[targetIndex - 1]
        if (slide) targetIndex = targetIndex - 1
      }

      if (!slide) {
        return {
          success: false,
          error: `Slide index ${slideIndex} out of range. The project currently has ${project.slides.length} slides (valid 0-based indices 0 to ${project.slides.length - 1}). Use addSlide if you need to create slide ${slideIndex}.`,
        }
      }

      return {
        success: true,
        slideIndex: targetIndex,
        slideName: slide.name,
        background: slide.background,
        elements: slide.elements.map((el) => ({
          id: el.id, type: el.type, animation: el.animation,
          diagramGroupId: el.diagramGroupId,
          content: el.content, position: el.position, size: el.size,
        })),
      }
    }

    default:
      return { success: false, error: `Unknown slide tool: ${toolName}` }
  }
}
