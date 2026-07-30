import { z } from 'zod'
import { tool } from 'ai'
import { useEditorStore } from '../../../store/editor-store'
import { uuid } from '../../uuid'
import type { SceneElement } from '@motionslides/shared'

export const elementToolSchemas = {
  addTextElement: tool({
    description: 'Add a text element (heading, subtitle, body) to a target slide or the active slide.',
    inputSchema: z.object({
      text: z.string().describe('The text content to display'),
      slideIndex: z.number().optional().describe('Optional 0-based slide index target. Defaults to current active slide.'),
      fontSize: z.number().min(8).max(200).optional().describe('Font size in pixels'),
      fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).optional(),
      color: z.string().optional().describe('CSS color string'),
      align: z.enum(['left', 'center', 'right']).optional(),
      x: z.number().optional().describe('X position (0–1280)'),
      y: z.number().optional().describe('Y position (0–720)'),
      width: z.number().optional().describe('Width in pixels'),
    }),
  }),
  updateElementText: tool({
    description: 'Update the text content of an existing text element on a slide.',
    inputSchema: z.object({
      elementId: z.string().describe('The ID of the text element to update'),
      newText: z.string().describe('The new text content'),
      slideIndex: z.number().optional().describe('Optional 0-based slide index target.'),
    }),
  }),
  deleteElement: tool({
    description: 'Delete a specific element (text, shape, section, line) from a slide by its ID.',
    inputSchema: z.object({
      elementId: z.string().describe('The ID of the element to delete'),
      slideIndex: z.number().optional().describe('Optional 0-based slide index target.'),
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

export async function executeElementTool(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
  const store = getStore()

  switch (toolName) {
    case 'addTextElement': {
      const {
        text, fontSize = 32, fontWeight = 'bold', color = '#ffffff',
        align = 'center', x = 80, y = 300, width = 1120, slideIndex,
      } = args as {
        text: string; fontSize?: number; fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
        color?: string; align?: 'left' | 'center' | 'right'; x?: number; y?: number; width?: number; slideIndex?: number
      }
      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }

      const newElement: SceneElement = {
        id: uuid(), type: 'text',
        position: { x, y },
        size: { width, height: 80 },
        rotation: 0, opacity: 1,
        zIndex: (slide.elements.length + 1) * 10,
        animation: 'fade-in', animationDelay: 0,
        content: {
          value: text, fontSize, fontWeight,
          fontFamily: 'Outfit', fontStyle: 'normal', color, align,
        } as unknown as SceneElement['content'],
      }

      const activeProjectId = store.activeProjectId
      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : {
                ...p,
                slides: p.slides.map((sl) =>
                  sl.id !== slide.id ? sl : { ...sl, elements: [...sl.elements, newElement] }
                ),
                updatedAt: Date.now(),
              }
        ),
      }))

      return { success: true, elementId: newElement.id, slideName: slide.name, preview: `Added "${text}"` }
    }

    case 'updateElementText': {
      const { elementId, newText, slideIndex } = args as { elementId: string; newText: string; slideIndex?: number }
      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }
      const el = slide.elements.find((e) => e.id === elementId)
      if (!el) return { success: false, error: `Element ${elementId} not found.` }

      const activeProjectId = store.activeProjectId
      const updatedContent = { ...(el.content as unknown as Record<string, unknown>), value: newText } as unknown as SceneElement['content']

      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : {
                ...p,
                slides: p.slides.map((sl) =>
                  sl.id !== slide.id
                    ? sl
                    : {
                        ...sl,
                        elements: sl.elements.map((e) => (e.id !== elementId ? e : { ...e, content: updatedContent })),
                      }
                ),
                updatedAt: Date.now(),
              }
        ),
      }))

      return { success: true, elementId, slideName: slide.name, preview: `Updated text to "${newText}"` }
    }

    case 'deleteElement': {
      const { elementId, slideIndex } = args as { elementId: string; slideIndex?: number }
      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }
      if (!slide.elements.some((e) => e.id === elementId))
        return { success: false, error: `Element ${elementId} not found on target slide.` }

      const activeProjectId = store.activeProjectId
      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : {
                ...p,
                slides: p.slides.map((sl) =>
                  sl.id !== slide.id
                    ? sl
                    : {
                        ...sl,
                        elements: sl.elements.filter((e) => e.id !== elementId),
                      }
                ),
                updatedAt: Date.now(),
              }
        ),
      }))

      return { success: true, elementId, slideName: slide.name, preview: `Deleted element ${elementId}` }
    }

    default:
      return { success: false, error: `Unknown element tool: ${toolName}` }
  }
}
