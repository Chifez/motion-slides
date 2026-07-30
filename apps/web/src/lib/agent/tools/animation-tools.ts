import { z } from 'zod'
import { tool } from 'ai'
import { useEditorStore } from '../../../store/editor-store'
import type { AnimationType, TransitionAnimation } from '@motionslides/shared'

export const animationToolSchemas = {
  applyAnimation: tool({
    description: 'Apply an entrance animation to a specific element. Options: fade-in, slide-up, slide-left, zoom-in, pop, draw, none.',
    inputSchema: z.object({
      elementId: z.string().describe('Target element ID'),
      animation: z.enum(['fade-in', 'slide-up', 'slide-left', 'zoom-in', 'pop', 'draw', 'none']),
      delay: z.number().min(0).max(5).optional().describe('Delay in seconds'),
      slideIndex: z.number().optional().describe('Optional 0-based slide index target.'),
    }),
  }),
  applyAnimationToAll: tool({
    description: 'Apply an entrance animation to ALL elements on a slide with a staggered delay.',
    inputSchema: z.object({
      animation: z.enum(['fade-in', 'slide-up', 'slide-left', 'zoom-in', 'pop', 'draw', 'none']),
      stagger: z.number().min(0).max(1).optional().describe('Per-element delay in seconds'),
      slideIndex: z.number().optional().describe('Optional 0-based slide index target.'),
    }),
  }),
  setTransition: tool({
    description: 'Add or update a slide transition. Animations: slide-left, slide-right, slide-up, slide-down, fade, zoom, flip, magic-move.',
    inputSchema: z.object({
      fromSlideIndex: z.number().describe('0-based index of the source slide'),
      toSlideIndex: z.number().describe('0-based index of the destination slide'),
      animation: z.enum(['slide-left', 'slide-right', 'slide-up', 'slide-down', 'fade', 'zoom', 'flip', 'magic-move']),
      duration: z.number().min(0.1).max(5).optional(),
      trigger: z.enum(['click', 'auto']).optional(),
      autoDelay: z.number().optional(),
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

export async function executeAnimationTool(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
  const store = getStore()

  switch (toolName) {
    case 'applyAnimation': {
      const { elementId, animation, delay = 0, slideIndex } = args as { elementId: string; animation: AnimationType; delay?: number; slideIndex?: number }
      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }
      if (!slide.elements.find((e) => e.id === elementId)) return { success: false, error: `Element ${elementId} not found.` }

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
                        elements: sl.elements.map((e) =>
                          e.id !== elementId ? e : { ...e, animation, animationDelay: delay }
                        ),
                      }
                ),
                updatedAt: Date.now(),
              }
        ),
      }))

      return { success: true, elementId, animation, delay }
    }

    case 'applyAnimationToAll': {
      const { animation, stagger = 0.1, slideIndex } = args as { animation: AnimationType; stagger?: number; slideIndex?: number }
      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }

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
                        elements: sl.elements.map((e, i) => ({
                          ...e,
                          animation,
                          animationDelay: i * stagger,
                        })),
                      }
                ),
                updatedAt: Date.now(),
              }
        ),
      }))

      return { success: true, count: slide.elements.length, animation, stagger }
    }

    case 'setTransition': {
      const { fromSlideIndex, toSlideIndex, animation, duration = 0.5, trigger = 'click', autoDelay } = args as {
        fromSlideIndex: number; toSlideIndex: number; animation: TransitionAnimation;
        duration?: number; trigger?: 'click' | 'auto'; autoDelay?: number
      }
      const project = store.activeProject()
      if (!project) return { success: false, error: 'No active project.' }
      const fromSlide = project.slides[fromSlideIndex]
      const toSlide = project.slides[toSlideIndex]
      if (!fromSlide) return { success: false, error: `Slide ${fromSlideIndex} not found.` }
      if (!toSlide) return { success: false, error: `Slide ${toSlideIndex} not found.` }

      const existing = project.transitions.find(
        (t) => t.fromSlideId === fromSlide.id && t.toSlideId === toSlide.id
      )

      if (existing) {
        store.updateTransition(existing.id, { animation, duration, trigger, autoDelay })
        return { success: true, action: 'updated', animation }
      } else {
        store.addTransition({
          fromSlideId: fromSlide.id, toSlideId: toSlide.id, animation, duration,
          ease: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 }, trigger, autoDelay,
        })
        return { success: true, action: 'created', animation, from: fromSlide.name, to: toSlide.name }
      }
    }

    default:
      return { success: false, error: `Unknown animation tool: ${toolName}` }
  }
}
