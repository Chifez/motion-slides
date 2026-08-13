import { z } from 'zod'
import { tool } from 'ai'
import { useEditorStore } from '../../../store/editor-store'
import { uuid } from '../../uuid'
import type { SceneElement, Slide } from '@motionslides/shared'

function resolveElementId(
  slide: Slide,
  { elementId, targetText }: { elementId?: string; targetText?: string }
): { id: string } | { error: string } {
  if (elementId) {
    const exists = slide.elements.some(el => el.id === elementId)
    return exists ? { id: elementId } : { error: `No element with id ${elementId} on this slide` }
  }
  if (targetText) {
    const exact = slide.elements.filter(el => {
      const val = (el.content as any)?.value
      return typeof val === 'string' && val === targetText
    })
    if (exact.length === 1) return { id: exact[0].id }
    
    const partial = slide.elements.filter(el => {
      const val = (el.content as any)?.value
      return typeof val === 'string' && val.includes(targetText)
    })
    if (partial.length === 1) return { id: partial[0].id }
    if (partial.length > 1) {
      return { error: `Multiple elements match "${targetText}" — ask the user which one, or use elementId.` }
    }
    return { error: `No element matching "${targetText}" found on this slide` }
  }
  return { error: 'Must provide either elementId or matchText' }
}

function nextAvailablePosition(slide: Slide, width: number, height: number) {
  const last = slide.elements[slide.elements.length - 1]
  if (!last) return { x: 80, y: 120 }
  const offset = 48
  const y = last.position.y + last.size.height + offset
  // wrap back to top if we've run off the bottom of a standard 720px slide
  return y + height > 700 ? { x: last.position.x + offset, y: 120 } : { x: last.position.x, y }
}

const NAMED_COLORS: Record<string, string> = {
  black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000',
  blue: '#0000ff', gray: '#808080', grey: '#808080', yellow: '#ffff00',
}

function normalizeToHex(input: string): string | null {
  const s = input.trim().toLowerCase()
  if (NAMED_COLORS[s]) return NAMED_COLORS[s]

  const rgb = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgb) {
    const [r, g, b] = rgb.slice(1, 4).map(n => parseInt(n, 10))
    return `#${[r, g, b].map(n => Math.min(255, n).toString(16).padStart(2, '0')).join('')}`
  }

  let hex = s.replace('#', '')
  if (/^[0-9a-f]{3}$/.test(hex)) hex = hex.split('').map(c => c + c).join('')
  return /^[0-9a-f]{6}$/.test(hex) ? `#${hex}` : null
}

function getLuminance(hex: string): number {
  const rgb = hex.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16) / 255) || [0,0,0]
  const [r, g, b] = rgb.map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1)
  const l2 = getLuminance(hex2)
  const lightest = Math.max(l1, l2)
  const darkest = Math.min(l1, l2)
  return (lightest + 0.05) / (darkest + 0.05)
}

function ensureReadable(color: string | undefined, background: string): string {
  const normalizedBg = normalizeToHex(background) || '#0d0d14'
  const normalizedColor = color ? normalizeToHex(color) : null
  
  // Treat unparseable colors exactly like omitted colors (fall through to luma check)
  if (!normalizedColor) {
    return contrastRatio('#ffffff', normalizedBg) > contrastRatio('#000000', normalizedBg)
      ? '#ffffff' : '#000000'
  }
  
  if (contrastRatio(normalizedColor, normalizedBg) >= 2.5) return normalizedColor
  
  return contrastRatio('#ffffff', normalizedBg) > contrastRatio('#000000', normalizedBg)
    ? '#ffffff' : '#000000'
}

export const elementToolSchemas = {
  addTextElement: tool({
    description: 'Add a text element (heading, subtitle, body) to a target slide or the active slide.',
    inputSchema: z.object({
      text: z.string().describe('The text content to display'),
      slideIndex: z.number().optional().describe('Optional 0-based slide index target. Defaults to current active slide.'),
      fontSize: z.number().min(8).max(200).optional().describe('Font size in pixels'),
      fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).optional(),
      color: z.string().optional().describe('Hex color for the text. Omit this field entirely to use the default readable color — only set it if explicitly asked.'),
      align: z.enum(['left', 'center', 'right']).optional(),
      x: z.number().optional().describe('X position (0–1280). Omit for auto-placement.'),
      y: z.number().optional().describe('Y position (0–720). Omit for auto-placement.'),
      width: z.number().optional().describe('Width in pixels'),
    }),
  }),
  updateElementText: tool({
    description: 'Update the text content of an existing text element. Prefer this over addTextElement whenever editing existing text — never create a duplicate element for an edit.',
    inputSchema: z.object({
      slideIndex: z.number().optional().describe('Optional 0-based slide index target.'),
      elementId: z.string().optional().describe('ID of the element, if already known.'),
      matchText: z.string().optional().describe('If elementId is unknown, the current (old) text to search for on the slide. Provide either elementId or matchText.'),
      newText: z.string().describe('The new text content'),
    }),
  }),
  deleteElement: tool({
    description: 'Delete a specific element from a slide.',
    inputSchema: z.object({
      slideIndex: z.number().optional().describe('Optional 0-based slide index target.'),
      elementId: z.string().optional().describe('The ID of the element to delete, if known.'),
      matchText: z.string().optional().describe('If elementId is unknown, the text of the element to delete. Provide either elementId or matchText.'),
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
        text, fontSize = 32, fontWeight = 'bold', color,
        align = 'center', x, y, width = 1120, slideIndex,
      } = args as {
        text: string; fontSize?: number; fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
        color?: string; align?: 'left' | 'center' | 'right'; x?: number; y?: number; width?: number; slideIndex?: number
      }

      if (text === undefined || text === null || text === '') {
        return { success: false, error: "Missing required argument: 'text'. Please provide the text to display." }
      }

      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }

      const pos = nextAvailablePosition(slide, width, 80)
      const finalX = x ?? pos.x
      const finalY = y ?? pos.y
      const finalColor = ensureReadable(color, slide.background)

      const newElement: SceneElement = {
        id: uuid(), type: 'text',
        position: { x: finalX, y: finalY },
        size: { width, height: 80 },
        rotation: 0, opacity: 1,
        zIndex: (slide.elements.length + 1) * 10,
        animation: 'fade-in', animationDelay: 0,
        content: {
          value: text, fontSize, fontWeight,
          fontFamily: 'Outfit', fontStyle: 'normal', color: finalColor, align,
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
      const { elementId, matchText, newText, slideIndex } = args as { elementId?: string; matchText?: string; newText: string; slideIndex?: number }
      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }
      
      const res = resolveElementId(slide, { elementId, targetText: matchText })
      if ('error' in res) return { success: false, error: res.error }
      const targetElementId = res.id

      const activeProjectId = store.activeProjectId
      useEditorStore.setState((s) => {
        const p = s.projects.find(p => p.id === activeProjectId)
        const sl = p?.slides.find(sl => sl.id === slide.id)
        const el = sl?.elements.find(e => e.id === targetElementId)
        if (!el) return s
        const updatedContent = { ...(el.content as any), value: newText } as any
        return {
          projects: s.projects.map((proj) =>
            proj.id !== activeProjectId
              ? proj
              : {
                  ...proj,
                  slides: proj.slides.map((sld) =>
                    sld.id !== slide.id
                      ? sld
                      : {
                          ...sld,
                          elements: sld.elements.map((e) => (e.id !== targetElementId ? e : { ...e, content: updatedContent })),
                        }
                  ),
                  updatedAt: Date.now(),
                }
          ),
        }
      })

      return { success: true, elementId: targetElementId, slideName: slide.name, preview: `Updated text to "${newText}"` }
    }

    case 'deleteElement': {
      const { elementId, matchText, slideIndex } = args as { elementId?: string; matchText?: string; slideIndex?: number }
      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }
      
      const res = resolveElementId(slide, { elementId, targetText: matchText })
      if ('error' in res) return { success: false, error: res.error }
      const targetElementId = res.id

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
                        elements: sl.elements.filter((e) => e.id !== targetElementId),
                      }
                ),
                updatedAt: Date.now(),
              }
        ),
      }))

      return { success: true, elementId: targetElementId, slideName: slide.name, preview: `Deleted element ${targetElementId}` }
    }

    default:
      return { success: false, error: `Unknown element tool: ${toolName}` }
  }
}
