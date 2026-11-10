import { z } from 'zod'
import { tool } from 'ai'
import { useEditorStore } from '../../../store/editor-store'
import { uuid } from '../../uuid'
import type { SceneElement, Slide, ChartContent, ChartType, ChartDataPoint, ChartSeries, CodeContent, TextContent } from '@motionslides/shared'

const CHART_COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#f472b6']

function normalizeChartData(args: {
  data?: Array<{ label: string; value: number; color?: string }>
  categories?: string[]
  series?: Array<{ name: string; values: number[]; color?: string }>
}): { data: ChartDataPoint[]; series?: ChartSeries[] } {
  if (Array.isArray(args.categories) && args.categories.length >= 2 && Array.isArray(args.series) && args.series.length >= 1) {
    const series = args.series.map((entry, index) => ({ key: `s${index}`, name: entry.name, color: entry.color }))
    const data = args.categories.map((label, i) => ({
      label,
      value: args.series![0]?.values[i] ?? 0,
      values: Object.fromEntries(series.map((entry, si) => [entry.key, args.series![si]?.values[i] ?? 0])),
    }))
    return { data, series }
  }
  return { data: args.data ?? [] }
}

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
  addChartElement: tool({
    description: 'Add a native chart element (bar, line, pie, or area chart) to a slide. Always use this instead of drawing shapes or boxes for data visualization.',
    inputSchema: z.object({
      slideIndex: z.number().optional().describe('Optional 0-based slide index target. Defaults to current active slide.'),
      title: z.string().optional().describe('Title of the chart (rendered above the chart)'),
      chartType: z.enum(['bar', 'line', 'pie', 'area']).default('bar').describe('The visual chart type: "bar", "line", "pie", or "area"'),
      unit: z.string().optional().describe('Optional unit for values, e.g. "%" or "ms"'),
      data: z.array(z.object({
        label: z.string().trim().min(1),
        value: z.number().finite(),
        color: z.string().optional(),
      })).optional().describe('Single-series data points: [{ label: "Regular", value: 92 }, { label: "Secure", value: 99.5 }]'),
      categories: z.array(z.string().trim().min(1)).optional().describe('Shared x-axis category labels for multi-series charts'),
      series: z.array(z.object({
        name: z.string().trim().min(1),
        values: z.array(z.number().finite()),
        color: z.string().optional(),
      })).optional().describe('Multi-series comparison data across categories'),
      x: z.number().optional().describe('X position (0–1280)'),
      y: z.number().optional().describe('Y position (0–720)'),
      width: z.number().optional().describe('Width in pixels'),
      height: z.number().optional().describe('Height in pixels'),
      showGrid: z.boolean().optional().default(true),
      showLabels: z.boolean().optional().default(true),
      insight: z.string().optional().describe('Short takeaway caption rendered beneath the chart'),
    }),
  }),
  updateChartElement: tool({
    description: 'Update an existing chart on a slide. Use this to switch chartType (e.g. from bar to line, area, or pie), update data points or series, or modify chart titles/units in place without deleting elements.',
    inputSchema: z.object({
      slideIndex: z.number().optional().describe('Optional 0-based slide index target. Defaults to current active slide.'),
      elementId: z.string().optional().describe('ID of the chart element to update. If omitted, targets the chart(s) on the slide.'),
      matchTitle: z.string().optional().describe('If elementId is unknown, match by chart title text.'),
      chartType: z.enum(['bar', 'line', 'pie', 'area']).optional().describe('New chart type to switch to: "line", "bar", "pie", or "area"'),
      title: z.string().optional().describe('New title for the chart'),
      unit: z.string().optional().describe('New unit label, e.g. "%" or "ms"'),
      data: z.array(z.object({
        label: z.string().trim().min(1),
        value: z.number().finite(),
        color: z.string().optional(),
      })).optional().describe('Updated single-series data points'),
      categories: z.array(z.string().trim().min(1)).optional().describe('Updated x-axis category labels'),
      series: z.array(z.object({
        name: z.string().trim().min(1),
        values: z.array(z.number().finite()),
        color: z.string().optional(),
      })).optional().describe('Updated multi-series data'),
      showGrid: z.boolean().optional(),
      showLabels: z.boolean().optional(),
      insight: z.string().optional().describe('Updated insight caption'),
    }),
  }),
  addCodeElement: tool({
    description: 'Add a native syntax-highlighted code block to a slide. Always use this for code snippets, configuration, or API payloads — never use text boxes or shapes to display code.',
    inputSchema: z.object({
      slideIndex: z.number().optional().describe('Optional 0-based slide index target. Defaults to active slide.'),
      code: z.string().describe('The code snippet content'),
      language: z.string().default('typescript').describe('Language for syntax highlighting: typescript, python, json, yaml, bash, sql, etc.'),
      title: z.string().optional().describe('Filename or title shown in the window chrome header, e.g. "presigned-upload.ts"'),
      caption: z.string().optional().describe('Optional short explanation rendered beneath the code block'),
      x: z.number().optional().describe('X position (0–1280)'),
      y: z.number().optional().describe('Y position (0–720)'),
      width: z.number().optional().describe('Width in pixels'),
      height: z.number().optional().describe('Height in pixels'),
    }),
  }),
  updateCodeElement: tool({
    description: 'Update an existing code block on a slide. Use this to update code content, language, title, or caption without deleting the block.',
    inputSchema: z.object({
      slideIndex: z.number().optional().describe('Optional 0-based slide index target. Defaults to active slide.'),
      elementId: z.string().optional().describe('ID of the code block element to update. If omitted, targets the code block on the slide.'),
      code: z.string().optional().describe('The updated code snippet'),
      language: z.string().optional().describe('Updated programming language'),
      title: z.string().optional().describe('Updated filename/title'),
      caption: z.string().optional().describe('Updated caption'),
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

    case 'addChartElement': {
      const {
        title, chartType = 'bar', unit, data, categories, series,
        x, y, width, height, showGrid = true, showLabels = true, insight, slideIndex,
      } = args as any

      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }

      const existingCharts = slide.elements.filter(e => e.type === 'chart')
      const finalWidth = width ?? (existingCharts.length === 0 ? 920 : 530)
      const finalHeight = height ?? (existingCharts.length === 0 ? 380 : 315)
      const finalX = x ?? (existingCharts.length === 0 ? Math.round((1280 - finalWidth) / 2) : 670)
      const finalY = y ?? (existingCharts.length === 0 ? 190 : 205)

      const normalized = normalizeChartData({ data, categories, series })
      const chartId = `chart-${uuid().slice(0, 8)}`
      const newElements: SceneElement[] = []

      // If title provided, add header label text element
      if (title) {
        const labelText = unit ? `${title} (${unit})` : title
        newElements.push({
          id: `data-label-${uuid().slice(0, 8)}`,
          type: 'text',
          position: { x: finalX, y: Math.max(10, finalY - 34) },
          size: { width: finalWidth, height: 28 },
          rotation: 0,
          opacity: 1,
          zIndex: 12,
          animation: 'fade-in',
          animationDelay: 0.2,
          content: {
            value: labelText,
            fontSize: 16,
            fontFamily: 'Inter',
            fontWeight: 'semibold',
            fontStyle: 'normal',
            color: '#ffffff',
            align: 'left',
          } as any,
        })
      }

      newElements.push({
        id: chartId,
        type: 'chart',
        position: { x: finalX, y: finalY },
        size: { width: finalWidth, height: finalHeight },
        rotation: 0,
        opacity: 1,
        zIndex: 11,
        animation: 'fade-in',
        animationDelay: 0.25,
        content: {
          chartType,
          data: normalized.data,
          series: normalized.series,
          colors: CHART_COLORS,
          showGrid,
          showLabels,
          barSize: normalized.series ? 28 : normalized.data.length > 7 ? 20 : 42,
        } satisfies ChartContent,
      })

      // If insight provided, add footer caption text element
      if (insight) {
        newElements.push({
          id: `data-label-${uuid().slice(0, 8)}`,
          type: 'text',
          position: { x: finalX, y: finalY + finalHeight + 12 },
          size: { width: finalWidth, height: 28 },
          rotation: 0,
          opacity: 1,
          zIndex: 12,
          animation: 'fade-in',
          animationDelay: 0.35,
          content: {
            value: insight,
            fontSize: 14,
            fontFamily: 'Inter',
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: 'rgba(255, 255, 255, 0.7)',
            align: 'left',
          } as any,
        })
      }

      const activeProjectId = store.activeProjectId
      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : {
                ...p,
                slides: p.slides.map((sl) =>
                  sl.id !== slide.id ? sl : { ...sl, elements: [...sl.elements, ...newElements] }
                ),
                updatedAt: Date.now(),
              }
        ),
      }))

      return {
        success: true,
        elementId: chartId,
        slideName: slide.name,
        preview: `Added ${chartType} chart "${title || 'Chart'}"`,
      }
    }

    case 'updateChartElement': {
      const {
        elementId, matchTitle, chartType, title, unit, data, categories,
        series, showGrid, showLabels, insight, slideIndex,
      } = args as any

      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }

      const allCharts = slide.elements.filter((e) => e.type === 'chart')
      if (allCharts.length === 0) {
        return { success: false, error: 'No chart found on this slide to update.' }
      }

      // Determine which chart(s) to update
      let targetCharts: SceneElement[] = []
      if (elementId) {
        const found = allCharts.find((e) => e.id === elementId)
        if (!found) return { success: false, error: `Chart element with ID "${elementId}" not found on this slide.` }
        targetCharts = [found]
      } else if (matchTitle) {
        const titleText = slide.elements.find(
          (e) => e.type === 'text' && typeof (e.content as any)?.value === 'string' &&
                 (e.content as any).value.toLowerCase().includes(matchTitle.toLowerCase())
        )
        if (titleText) {
          const nearest = allCharts.reduce((best, curr) => {
            const distCurr = Math.abs(curr.position.x - titleText.position.x) + Math.abs(curr.position.y - titleText.position.y)
            const distBest = Math.abs(best.position.x - titleText.position.x) + Math.abs(best.position.y - titleText.position.y)
            return distCurr < distBest ? curr : best
          }, allCharts[0])
          targetCharts = [nearest]
        } else {
          targetCharts = allCharts
        }
      } else if (allCharts.length === 1 || chartType) {
        targetCharts = allCharts
      } else {
        targetCharts = [allCharts[0]]
      }

      const normalized = (data || (categories && series))
        ? normalizeChartData({ data, categories, series })
        : null

      const activeProjectId = store.activeProjectId
      useEditorStore.setState((s) => {
        const p = s.projects.find((proj) => proj.id === activeProjectId)
        if (!p) return s

        const updatedSlides = p.slides.map((sl) => {
          if (sl.id !== slide.id) return sl

          return {
            ...sl,
            elements: sl.elements.map((el) => {
              if (targetCharts.some((tc) => tc.id === el.id)) {
                const currentContent = el.content as ChartContent
                const updatedContent: ChartContent = {
                  ...currentContent,
                  chartType: chartType || currentContent.chartType,
                  data: normalized ? normalized.data : currentContent.data,
                  series: normalized?.series !== undefined ? normalized.series : currentContent.series,
                  showGrid: showGrid !== undefined ? showGrid : currentContent.showGrid,
                  showLabels: showLabels !== undefined ? showLabels : currentContent.showLabels,
                }
                return { ...el, content: updatedContent }
              }

              if (title) {
                const matchingChart = targetCharts.find(
                  (tc) => Math.abs(tc.position.x - el.position.x) < 40 &&
                          Math.abs(tc.position.y - (el.position.y + 34)) < 30
                )
                if (matchingChart && el.type === 'text') {
                  const labelVal = unit ? `${title} (${unit})` : title
                  return { ...el, content: { ...(el.content as any), value: labelVal } }
                }
              }

              return el
            }),
          }
        })

        return {
          ...s,
          projects: s.projects.map((proj) => (proj.id === activeProjectId ? { ...proj, slides: updatedSlides, updatedAt: Date.now() } : proj)),
        }
      })

      const summaryType = chartType ? ` switched type to "${chartType}"` : ''
      const summaryData = normalized ? ' and updated data' : ''
      return {
        success: true,
        updatedCount: targetCharts.length,
        slideName: slide.name,
        preview: `Updated ${targetCharts.length} chart(s)${summaryType}${summaryData}.`,
      }
    }

    case 'addCodeElement': {
      const {
        code, language = 'typescript', title, caption,
        x, y, width, height, slideIndex,
      } = args as any

      if (!code) {
        return { success: false, error: "Missing required argument 'code'." }
      }

      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }

      const lines = String(code).split('\n')
      const lineCount = lines.length
      const longestLine = Math.max(...lines.map((l: string) => l.length))
      const fontSize = lineCount > 18 ? 11 : lineCount > 12 ? 12 : lineCount > 6 ? 14 : 16
      const lineHeight = 1.45
      const CODE_CHROME_HEIGHT = 56
      const CODE_CHROME_WIDTH = 64
      const CHAR_WIDTH_RATIO = 0.62

      const finalWidth = width ?? Math.round(Math.min(1080, Math.max(420, longestLine * fontSize * CHAR_WIDTH_RATIO + CODE_CHROME_WIDTH)))
      const finalHeight = height ?? Math.round(Math.min(420, Math.max(120, lineCount * fontSize * lineHeight + CODE_CHROME_HEIGHT)))
      const finalX = x ?? Math.round(640 - finalWidth / 2)
      const finalY = y ?? 175

      const codeId = `code-${uuid().slice(0, 8)}`
      const newElements: SceneElement[] = []

      newElements.push({
        id: codeId,
        type: 'code',
        position: { x: finalX, y: finalY },
        size: { width: finalWidth, height: finalHeight },
        rotation: 0,
        opacity: 1,
        zIndex: 11,
        animation: 'fade-in',
        animationDelay: 0.25,
        content: {
          value: code,
          language,
          title: title || 'snippet.ts',
          fontSize,
          lineHeight,
          theme: 'dark',
        } satisfies CodeContent,
      })

      if (caption) {
        newElements.push({
          id: `data-label-${uuid().slice(0, 8)}`,
          type: 'text',
          position: { x: finalX, y: finalY + finalHeight + 12 },
          size: { width: finalWidth, height: 28 },
          rotation: 0,
          opacity: 1,
          zIndex: 12,
          animation: 'fade-in',
          animationDelay: 0.35,
          content: {
            value: caption,
            fontSize: 14,
            fontFamily: 'Inter',
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: 'rgba(255, 255, 255, 0.7)',
            align: 'left',
          } as any,
        })
      }

      const activeProjectId = store.activeProjectId
      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : {
                ...p,
                slides: p.slides.map((sl) =>
                  sl.id !== slide.id ? sl : { ...sl, elements: [...sl.elements, ...newElements] }
                ),
                updatedAt: Date.now(),
              }
        ),
      }))

      return {
        success: true,
        elementId: codeId,
        slideName: slide.name,
        preview: `Added code block "${title || 'snippet'}" (${language})`,
      }
    }

    case 'updateCodeElement': {
      const { elementId, code, language, title, caption, slideIndex } = args as any
      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }

      const allCode = slide.elements.filter((e) => e.type === 'code')
      if (allCode.length === 0) {
        return { success: false, error: 'No code block found on this slide to update.' }
      }

      const target = elementId ? allCode.find((e) => e.id === elementId) : allCode[0]
      if (!target) {
        return { success: false, error: `Code block element with ID "${elementId}" not found.` }
      }

      const activeProjectId = store.activeProjectId
      useEditorStore.setState((s) => {
        const p = s.projects.find((proj) => proj.id === activeProjectId)
        if (!p) return s

        const updatedSlides = p.slides.map((sl) => {
          if (sl.id !== slide.id) return sl

          return {
            ...sl,
            elements: sl.elements.map((el) => {
              if (el.id === target.id) {
                const currentContent = el.content as CodeContent
                const updatedCode = code ?? currentContent.value
                const lines = updatedCode.split('\n')
                const lineCount = lines.length
                const longestLine = Math.max(...lines.map((l: string) => l.length))
                const fontSize = lineCount > 18 ? 11 : lineCount > 12 ? 12 : lineCount > 6 ? 14 : 16
                const lineHeight = 1.45
                const CODE_CHROME_HEIGHT = 56
                const CODE_CHROME_WIDTH = 64
                const CHAR_WIDTH_RATIO = 0.62

                const newWidth = Math.round(Math.min(1080, Math.max(420, longestLine * fontSize * CHAR_WIDTH_RATIO + CODE_CHROME_WIDTH)))
                const newHeight = Math.round(Math.min(420, Math.max(120, lineCount * fontSize * lineHeight + CODE_CHROME_HEIGHT)))

                return {
                  ...el,
                  size: { width: newWidth, height: newHeight },
                  content: {
                    ...currentContent,
                    value: updatedCode,
                    language: language ?? currentContent.language,
                    title: title ?? currentContent.title,
                    fontSize,
                  },
                }
              }

              if (caption && Math.abs(target.position.x - el.position.x) < 40 && el.position.y > target.position.y && el.type === 'text') {
                return { ...el, content: { ...(el.content as any), value: caption } }
              }

              return el
            }),
          }
        })

        return {
          ...s,
          projects: s.projects.map((proj) => (proj.id === activeProjectId ? { ...proj, slides: updatedSlides, updatedAt: Date.now() } : proj)),
        }
      })

      return {
        success: true,
        elementId: target.id,
        slideName: slide.name,
        preview: `Updated code block "${title || (target.content as any)?.title || 'snippet'}".`,
      }
    }

    default:
      return { success: false, error: `Unknown element tool: ${toolName}` }
  }
}
