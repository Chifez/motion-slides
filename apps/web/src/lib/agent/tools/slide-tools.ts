import { z } from 'zod'
import { tool } from 'ai'
import { useEditorStore } from '../../../store/editor-store'
import { uuid } from '../../uuid'
import type { SceneElement } from '@motionslides/shared'

export const slideToolSchemas = {
  addSlide: tool({
    description: 'Add a new blank slide to the presentation. Supports optional targetIndex for non-sequential additions.',
    inputSchema: z.object({
      name: z.string().optional().describe('A short descriptive name for the new slide'),
      background: z.string().optional().describe('CSS color or gradient for the slide background'),
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
    description: 'Get a full summary of the current presentation — slides, elements, and transitions. Use before complex edits.',
    inputSchema: z.object({}),
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

      const project = store.activeProject()
      const currentCount = project?.slides.length ?? 0
      const defaultBg = project?.slides[0]?.background ?? '#0d0d14'
      const bg = background ?? defaultBg

      const requiredIndex = targetIndex !== undefined && targetIndex >= currentCount ? targetIndex : currentCount
      const createdSlides = []

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

      const finalSlides = [...(project?.slides ?? []), ...createdSlides]
      const newActiveIndex = requiredIndex

      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : { ...p, slides: finalSlides, updatedAt: Date.now(), synced: false },
        ),
        activeSlideIndex: newActiveIndex,
      }))

      const targetSlide = createdSlides[createdSlides.length - 1]
      return {
        success: true,
        createdCount: createdSlides.length,
        slideId: targetSlide.id,
        slideName: targetSlide.name,
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
      if (slideIndex < 0 || slideIndex >= project.slides.length)
        return { success: false, error: `Slide index ${slideIndex} out of range.` }
      store.setActiveSlide(slideIndex)
      return { success: true, slideIndex, slideName: project.slides[slideIndex].name }
    }

    case 'setSlideBackground': {
      const { background, slideIndex } = args as { background: string; slideIndex?: number }
      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }

      const activeProjectId = store.activeProjectId
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
        slides: project.slides.map((s, i) => ({
          index: i, id: s.id, name: s.name, elementCount: s.elements.length,
          elements: s.elements.map((el) => ({
            id: el.id, type: el.type, animation: el.animation,
            preview: el.type === 'text' ? String((el.content as unknown as Record<string, unknown>).value ?? '').slice(0, 50) : el.type,
          })),
        })),
        transitions: project.transitions.map((t) => {
          const from = project.slides.find((s) => s.id === t.fromSlideId)
          const to = project.slides.find((s) => s.id === t.toSlideId)
          return { id: t.id, from: from?.name, to: to?.name, animation: t.animation, trigger: t.trigger }
        }),
      }
    }

    default:
      return { success: false, error: `Unknown slide tool: ${toolName}` }
  }
}
