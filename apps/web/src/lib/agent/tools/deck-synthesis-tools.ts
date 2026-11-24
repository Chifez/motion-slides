import { z } from 'zod'
import dagre from 'dagre'
import { v4 as uuid } from 'uuid'
import { useEditorStore } from '@/store/editor-store'
import type { SceneElement, ShapeContent, SectionContent, LineContent, TextContent, ChartContent, CodeContent, Slide, SlideTransition, ShapeType } from '@motionslides/shared'
import { resolveIconPathString } from '@/lib/generation/icon-resolver'

const ELEMENT_ID_SCHEMA = z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/, 'Use letters, numbers, underscores, or hyphens only.')
const HEX_COLOR_SCHEMA = z.string().regex(/^#[0-9a-f]{6}$/i, 'Use a six-digit hex color.')
const optionalText = (maxLen: number) =>
  z.string().trim().max(maxLen).nullish().transform((v) => (v && v.length > 0 ? v : undefined))

const SHAPE_TYPES = [
  'rectangle', 'rounded-rectangle', 'circle', 'cylinder', 'diamond', 'hexagon',
  'database', 'server', 'cloud', 'client', 'user', 'bucket', 'queue', 'document',
  'aws-icon', 'gcp-icon', 'icon',
] as const satisfies readonly ShapeType[]

const ChartSchema = z.object({
  id: ELEMENT_ID_SCHEMA.optional().describe('Stable chart ID when it should Magic Move across slides.'),
  title: z.string().trim().min(1).max(100).describe('Short, decision-oriented chart title, e.g. "Upload success rate".'),
  chartType: z.enum(['bar', 'line', 'pie', 'area']).default('bar')
    .describe('Chart type: bar, line, pie, or area.'),
  unit: optionalText(20).describe('Optional unit of values in this chart, e.g. "%" or "ms".'),
  data: z.array(z.object({
    label: z.string().trim().min(1).max(50),
    value: z.number().finite(),
    color: HEX_COLOR_SCHEMA.optional(),
  })).min(2).max(12).optional().describe('Data points for single-series chart. E.g. [{ label: "Regular", value: 92 }, { label: "Secure", value: 99.5 }]'),
  categories: z.array(z.string().trim().min(1).max(50)).min(2).max(12).optional()
    .describe('Optional shared x-axis labels for multi-series charts.'),
  series: z.array(z.object({
    name: z.string().trim().min(1).max(50),
    values: z.array(z.number().finite()).min(2).max(12),
    color: HEX_COLOR_SCHEMA.optional(),
  })).min(1).max(4).optional().describe('Optional multi-series data comparing several systems across categories.'),
  insight: optionalText(160).describe('One short conclusion rendered beneath the chart.'),
  showGrid: z.boolean().optional().default(true),
  showLabels: z.boolean().optional().default(true),
}).superRefine((chart, ctx) => {
  if (chart.categories && chart.series) {
    const catLabels = chart.categories.map((c) => c.toLowerCase())
    if (new Set(catLabels).size !== catLabels.length) {
      ctx.addIssue({ code: 'custom', path: ['categories'], message: 'Category labels must be unique.' })
    }
    const seriesNames = chart.series.map((s) => s.name.toLowerCase())
    if (new Set(seriesNames).size !== seriesNames.length) {
      ctx.addIssue({ code: 'custom', path: ['series'], message: 'Series names must be unique.' })
    }
    for (const [si, s] of chart.series.entries()) {
      if (s.values.length !== chart.categories.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['series', si, 'values'],
          message: `Series "${s.name}" has ${s.values.length} values but there are ${chart.categories.length} categories.`,
        })
      }
    }
    return
  }

  if (!chart.data || chart.data.length < 2) {
    ctx.addIssue({
      code: 'custom',
      path: ['data'],
      message: 'Provide either `data` (at least 2 points) or `categories` and `series`.',
    })
    return
  }

  const labels = chart.data.map((point) => point.label.toLowerCase())
  if (new Set(labels).size !== labels.length) {
    ctx.addIssue({ code: 'custom', path: ['data'], message: 'Chart data labels must be unique.' })
  }
  if (chart.chartType === 'pie') {
    if (chart.data.some((point) => point.value < 0)) {
      ctx.addIssue({ code: 'custom', path: ['data'], message: 'Pie chart values cannot be negative.' })
    }
    if (chart.data.every((point) => point.value === 0)) {
      ctx.addIssue({ code: 'custom', path: ['data'], message: 'A pie chart needs at least one positive value.' })
    }
  }
})

const CodeBlockSchema = z.object({
  id: ELEMENT_ID_SCHEMA.optional().describe('Stable code block ID when it should Magic Move across slides.'),
  title: z.string().trim().min(1).max(100).describe('Filename or short label shown in the code window.'),
  language: z.string().trim().min(1).max(40).describe('Syntax language such as typescript, python, json, yaml, bash, or sql.'),
  value: z.string().min(1).max(5000)
    .refine((value) => value.split('\n').length <= 30, 'Keep code blocks to 30 lines or fewer.')
    .describe('A concise snippet of at most 30 lines, focused on the slide takeaway.'),
  caption: optionalText(160).describe('One short explanation rendered beneath the code block.'),
})

const DeckSlideSchema = z.object({
  name: z.string().trim().min(1).max(100).describe('Name/title of this slide'),
  intent: z.enum(['title', 'architecture', 'comparison', 'metrics', 'code', 'summary']).optional().describe('The communication job of this slide. Keep architecture diagrams and metric charts on separate slides unless explicitly requested otherwise.'),
  blueprint: z.enum(['hero-title', 'overview-topology', 'pipeline-flow', 'mesh-architecture', 'database-tier', 'data-comparison', 'code-walkthrough', 'summary']).optional(),
  background: optionalText(240)
    .refine((value) => !value || !/(?:url\s*\(|expression\s*\(|@import)/i.test(value), 'Remote or executable CSS backgrounds are not allowed.'),
  title: optionalText(120).describe('Slide header title text'),
  subtitle: optionalText(200).describe('Slide subtitle text'),
  nodes: z.array(z.object({
    id: ELEMENT_ID_SCHEMA.describe('Stable node ID (shared across slides for Magic Move morphing)'),
    shapeType: z.enum(SHAPE_TYPES).describe('Visual primitive or cloud icon type.'),
    label: z.string().trim().min(1).max(80),
    sublabel: optionalText(100),
    layer: optionalText(80).describe('Container layer grouping (e.g. Ingestion, Compute, Storage)'),
  })).max(40).optional().default([]),
  edges: z.array(z.object({
    from: ELEMENT_ID_SCHEMA.describe('Source node ID'),
    to: ELEMENT_ID_SCHEMA.describe('Target node ID'),
    label: optionalText(80),
    style: z.enum(['solid', 'dashed', 'dotted']).optional().default('solid'),
  })).max(80).optional().default([]),
  sections: z.array(z.object({
    label: z.string().trim().min(1).max(80),
    layer: z.string().trim().min(1).max(80),
  })).max(12).optional().default([]),
  charts: z.array(ChartSchema).max(3).optional().default([]),
  codeBlocks: z.array(CodeBlockSchema).max(2).optional().default([]),
  speakerNotes: optionalText(4000),
})

const DeckSynthesisInputSchema = z.object({
  documentTitle: z.string().trim().min(1).max(160).describe('Title of the synthesized deck'),
  theme: z.enum(['midnight-indigo', 'nordic-light', 'obsidian-cyan', 'emerald-tech', 'cyberpunk-neon']).optional().default('midnight-indigo'),
  slides: z.array(DeckSlideSchema).min(1).max(20),
  setMagicMoveTransitions: z.boolean().optional().default(true),
})

export const deckSynthesisToolSchemas = {
  synthesizeDeckFromDocument: {
    description: 'Synthesize a cohesive multi-slide presentation deck from document text or architecture specs. Use intent="architecture" with nodes/edges for one focused system diagram. Use intent="metrics" or "comparison" with charts for measurable trade-offs. Use intent="code" with codeBlocks for implementation walkthroughs. The executor creates real native chart and code elements with presentation-safe sizing and positions.',
    inputSchema: DeckSynthesisInputSchema,
  },
}

export type DeckSynthesisToolName = keyof typeof deckSynthesisToolSchemas

const THEME_BACKGROUNDS: Record<string, string> = {
  'midnight-indigo': '#0b0c16',
  'nordic-light': '#f8fafc',
  'obsidian-cyan': '#080c14',
  'emerald-tech': '#06120e',
  'cyberpunk-neon': '#0a0614',
}

const THEME_ACCENTS: Record<string, { stroke: string; fill: string; text: string; line: string }> = {
  'midnight-indigo': { stroke: '#60a5fa', fill: 'rgba(59, 130, 246, 0.25)', text: '#ffffff', line: '#93c5fd' },
  'nordic-light': { stroke: '#2563eb', fill: 'rgba(37, 99, 235, 0.12)', text: '#0f172a', line: '#3b82f6' },
  'obsidian-cyan': { stroke: '#22d3ee', fill: 'rgba(6, 182, 212, 0.25)', text: '#ffffff', line: '#67e8f9' },
  'emerald-tech': { stroke: '#34d399', fill: 'rgba(16, 185, 129, 0.25)', text: '#ffffff', line: '#6ee7b7' },
  'cyberpunk-neon': { stroke: '#f472b6', fill: 'rgba(236, 72, 153, 0.25)', text: '#ffffff', line: '#f472b6' },
}

type DeckSynthesisInput = z.infer<typeof DeckSynthesisInputSchema>
type DeckSlide = DeckSynthesisInput['slides'][number]
type DeckChart = DeckSlide['charts'][number]
type DeckCodeBlock = DeckSlide['codeBlocks'][number]

function normalizeChart(chart: DeckChart): Pick<ChartContent, 'data' | 'series'> {
  if (Array.isArray(chart.categories) && chart.categories.length >= 2 && Array.isArray(chart.series) && chart.series.length >= 1) {
    const series = chart.series.map((entry, index) => ({ key: `s${index}`, name: entry.name, color: entry.color }))
    const data = chart.categories.map((label, i) => ({
      label,
      value: chart.series![0]?.values[i] ?? 0,
      values: Object.fromEntries(series.map((entry, si) => [entry.key, chart.series![si]?.values[i] ?? 0])),
    }))
    return { data, series }
  }
  return { data: chart.data ?? [] }
}

const CHART_COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#f472b6']

function addDataElements({
  elements,
  charts,
  codeBlocks,
  intent,
  textColor,
  mutedTextColor,
}: {
  elements: SceneElement[]
  charts: DeckChart[]
  codeBlocks: DeckCodeBlock[]
  intent?: string
  textColor: string
  mutedTextColor: string
}) {
  if (charts.length === 0 && codeBlocks.length === 0) return

  const addLabel = (value: string, x: number, y: number, width: number, size = 16, color = textColor) => {
    elements.push({
      id: `data-label-${uuid().slice(0, 8)}`,
      type: 'text',
      position: { x, y }, size: { width, height: 28 }, rotation: 0, opacity: 1,
      zIndex: 12, animation: 'fade-in', animationDelay: 0.25,
      content: {
        value, fontSize: size, fontFamily: 'Inter', fontWeight: 'semibold',
        fontStyle: 'normal', color, align: 'left',
      },
    })
  }

  const addChart = (chart: DeckChart, x: number, y: number, width: number, height: number, index: number) => {
    const normalized = normalizeChart(chart)
    addLabel(chart.unit ? `${chart.title} (${chart.unit})` : chart.title, x, y - 34, width)
    elements.push({
      id: chart.id || `chart-${uuid().slice(0, 8)}`,
      type: 'chart',
      position: { x, y }, size: { width, height }, rotation: 0, opacity: 1,
      zIndex: 11, animation: 'fade-in', animationDelay: 0.32 + index * 0.08,
      content: {
        chartType: chart.chartType,
        data: normalized.data,
        series: normalized.series,
        colors: CHART_COLORS,
        showGrid: chart.showGrid ?? true,
        showLabels: chart.showLabels ?? true,
        barSize: normalized.series ? 28 : normalized.data.length > 7 ? 20 : 42,
      } satisfies ChartContent,
    })
    if (chart.insight) addLabel(chart.insight, x, y + height + 12, width, 14, mutedTextColor)
  }

  // Fit the code window to its content instead of filling the whole slot, so
  // short snippets don't leave a large empty panel. `maxWidth`/`maxHeight` are
  // the slot bounds; `centerX` is the slot's horizontal center.
  const addCodeBlock = (block: DeckCodeBlock, centerX: number, y: number, maxWidth: number, maxHeight: number, index: number) => {
    const lines = block.value.split('\n')
    const lineCount = lines.length
    const longestLine = Math.max(...lines.map((line) => line.length))
    const fontSize = lineCount > 18 ? 11 : lineCount > 12 ? 12 : lineCount > 6 ? 14 : 16
    const lineHeight = 1.45
    const CODE_CHROME_HEIGHT = 56 // window title bar + vertical padding
    const CODE_CHROME_WIDTH = 64 // horizontal padding
    const CHAR_WIDTH_RATIO = 0.62 // monospace advance width relative to font size

    const width = Math.round(Math.min(maxWidth, Math.max(420, longestLine * fontSize * CHAR_WIDTH_RATIO + CODE_CHROME_WIDTH)))
    const height = Math.round(Math.min(maxHeight, Math.max(120, lineCount * fontSize * lineHeight + CODE_CHROME_HEIGHT)))
    const x = Math.round(centerX - width / 2)

    elements.push({
      id: block.id || `code-${uuid().slice(0, 8)}`,
      type: 'code',
      position: { x, y }, size: { width, height }, rotation: 0, opacity: 1,
      zIndex: 11, animation: 'fade-in', animationDelay: 0.32 + index * 0.08,
      content: {
        value: block.value,
        language: block.language,
        title: block.title,
        fontSize,
        lineHeight,
        theme: 'dark',
      } satisfies CodeContent,
    })
    if (block.caption) addLabel(block.caption, x, y + height + 12, width, 14, mutedTextColor)
  }

  // The mixed view is intentionally a balanced two-column composition. The
  // other layouts reserve most of the canvas for the visual evidence itself.
  if (charts.length > 0 && codeBlocks.length > 0) {
    addChart(charts[0], 80, 205, 520, 310, 0)
    addCodeBlock(codeBlocks[0], 930, 170, 540, 365, 0)
    return
  }

  if (charts.length > 0) {
    if (charts.length === 1) {
      addChart(charts[0], 110, 190, 1060, intent === 'comparison' ? 360 : 400, 0)
    } else if (charts.length === 2) {
      addChart(charts[0], 80, 205, 530, 315, 0)
      addChart(charts[1], 670, 205, 530, 315, 1)
    } else {
      charts.slice(0, 3).forEach((chart, index) => addChart(chart, 70 + index * 405, 205, 370, 275, index))
    }
    return
  }

  if (codeBlocks.length === 1) {
    addCodeBlock(codeBlocks[0], 640, 175, 1080, 420, 0)
  } else {
    addCodeBlock(codeBlocks[0], 350, 170, 540, 390, 0)
    addCodeBlock(codeBlocks[1], 930, 170, 540, 390, 1)
  }
}

function formatSchemaError(error: z.ZodError): string {
  return error.issues
    .slice(0, 4)
    .map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`)
    .join('; ')
}

function validateSlideSemantics(slides: DeckSlide[]): string | null {
  for (const slide of slides) {
    const { nodes, edges, sections, charts, codeBlocks } = slide

    if ((slide.intent === 'metrics' || slide.intent === 'comparison') && charts.length === 0) {
      return `Slide "${slide.name}" is a ${slide.intent} slide but has no native chart. Add at least one charts entry; metric claims must be visual evidence, not text alone.`
    }
    if (slide.intent === 'code' && codeBlocks.length === 0) {
      return `Slide "${slide.name}" is a code slide but has no native code block. Add at least one codeBlocks entry.`
    }
    if (slide.intent === 'architecture' && (nodes.length < 2 || edges.length === 0)) {
      return `Slide "${slide.name}" is an architecture slide but needs at least two nodes and one edge to communicate a system flow.`
    }
    if (nodes.length > 0 && (charts.length > 0 || codeBlocks.length > 0)) {
      return `Slide "${slide.name}" mixes an architecture graph with charts or code. Split these into focused slides so no supplied elements are dropped.`
    }
    if (charts.length > 0 && codeBlocks.length > 0 && (charts.length > 1 || codeBlocks.length > 1)) {
      return `Slide "${slide.name}" can combine at most one chart and one code block. Split additional evidence across slides.`
    }

    const explicitIds = [
      ...nodes.map((node) => node.id),
      ...charts.flatMap((chart) => chart.id ? [chart.id] : []),
      ...codeBlocks.flatMap((block) => block.id ? [block.id] : []),
    ]
    if (new Set(explicitIds).size !== explicitIds.length) {
      return `Slide "${slide.name}" contains duplicate element IDs. Every node, chart, and code block on a slide must have a unique ID.`
    }

    const nodeIds = new Set(nodes.map((node) => node.id))
    const edgeKeys = new Set<string>()
    for (const edge of edges) {
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
        return `Slide "${slide.name}" has an edge ${edge.from} → ${edge.to} that does not reference existing node IDs.`
      }
      if (edge.from === edge.to) {
        return `Slide "${slide.name}" has a self-referencing edge on "${edge.from}". Use two distinct nodes.`
      }
      const edgeKey = `${edge.from}\u0000${edge.to}`
      if (edgeKeys.has(edgeKey)) {
        return `Slide "${slide.name}" contains duplicate edges from "${edge.from}" to "${edge.to}".`
      }
      edgeKeys.add(edgeKey)
    }

    const nodeLayers = new Set(nodes.flatMap((node) => node.layer ? [node.layer] : []))
    const sectionLayers = sections.map((section) => section.layer)
    if (new Set(sectionLayers).size !== sectionLayers.length) {
      return `Slide "${slide.name}" defines the same section layer more than once.`
    }
    const unusedSection = sections.find((section) => !nodeLayers.has(section.layer))
    if (unusedSection) {
      return `Slide "${slide.name}" defines section "${unusedSection.label}" but no node uses layer "${unusedSection.layer}".`
    }
  }

  return null
}

export async function executeDeckSynthesisTool(
  toolName: DeckSynthesisToolName,
  args: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  switch (toolName) {
    case 'synthesizeDeckFromDocument': {
      const store = useEditorStore.getState()
      const { activeProjectId } = store
      if (!activeProjectId) {
        return { success: false, error: 'No active project found to synthesize deck into.' }
      }

      const parsed = DeckSynthesisInputSchema.safeParse(args)
      if (!parsed.success) {
        return { success: false, error: `Invalid deck synthesis payload: ${formatSchemaError(parsed.error)}` }
      }
      const input = parsed.data
      const rawSlides = input.slides
      const semanticError = validateSlideSemantics(rawSlides)
      if (semanticError) return { success: false, error: semanticError }

      const themeKey = input.theme
      const defaultBg = THEME_BACKGROUNDS[themeKey] || '#0b0c16'
      const themeAccent = THEME_ACCENTS[themeKey] || THEME_ACCENTS['midnight-indigo']
      const mutedTextColor = /^#[0-9a-f]{6}$/i.test(themeAccent.text) ? `${themeAccent.text}99` : themeAccent.text

      const synthesizedSlides: Slide[] = []
      const slideTransitions: SlideTransition[] = []

      rawSlides.forEach((s, sIdx) => {
        const slideId = `slide-${uuid().slice(0, 8)}`
        const elements: SceneElement[] = []
        const diagramGroupId = `group-deck-${uuid().slice(0, 8)}`

        // Title slides get a centered hero composition; every other slide uses the
        // compact top-left header so content below has room.
        const isHero = s.intent === 'title' || s.blueprint === 'hero-title'
        const titleBox = isHero
          ? { position: { x: 120, y: 240 }, size: { width: 1040, height: 90 }, fontSize: 60, align: 'center' as const }
          : { position: { x: 80, y: 50 }, size: { width: 900, height: 46 }, fontSize: 34, align: 'left' as const }
        const subtitleBox = isHero
          ? { position: { x: 160, y: 345 }, size: { width: 960, height: 40 }, fontSize: 26, align: 'center' as const }
          : { position: { x: 80, y: 100 }, size: { width: 900, height: 32 }, fontSize: 18, align: 'left' as const }

        // Header Title
        const headerTitle = s.title || s.name
        if (headerTitle) {
          elements.push({
            id: `title-${uuid().slice(0, 8)}`,
            type: 'text',
            position: titleBox.position,
            size: titleBox.size,
            rotation: 0,
            opacity: 1,
            zIndex: 10,
            animation: 'fade-in',
            animationDelay: 0.1,
            content: {
              value: headerTitle,
              fontSize: titleBox.fontSize,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              fontStyle: 'normal',
              color: themeAccent.text,
              align: titleBox.align,
            } satisfies TextContent,
          })
        }

        // Subtitle
        if (s.subtitle) {
          elements.push({
            id: `subtitle-${uuid().slice(0, 8)}`,
            type: 'text',
            position: { x: 80, y: 100 },
            size: { width: 900, height: 32 },
            rotation: 0,
            opacity: 1,
            zIndex: 10,
            animation: 'fade-in',
            animationDelay: 0.2,
            content: {
              value: s.subtitle,
              fontSize: 18,
              fontFamily: 'Inter',
              fontWeight: 'normal',
              fontStyle: 'normal',
              color: mutedTextColor,
              align: 'left',
            } satisfies TextContent,
          })
        }

        const { nodes, edges, sections, charts, codeBlocks } = s

        addDataElements({ elements, charts, codeBlocks, intent: s.intent, textColor: themeAccent.text, mutedTextColor })

        // Charts and code blocks communicate a different idea than topology. Keep
        // the diagram canvas uncluttered unless the caller deliberately supplied
        // an architecture-only slide.
        if (nodes.length > 0 && charts.length === 0 && codeBlocks.length === 0) {
          // Build Dagre layout for slide nodes
          const g = new dagre.graphlib.Graph({ compound: true })
          g.setGraph({
            rankdir: 'LR',
            nodesep: 45,
            ranksep: 75,
            marginx: 20,
            marginy: 20,
          })
          g.setDefaultEdgeLabel(() => ({}))

          const nodeWidth = 140
          const nodeHeight = 80

          // Register layers
          const layerLabels = new Map<string, string>()
          nodes.forEach((n) => {
            if (n.layer) layerLabels.set(n.layer, n.layer)
          })
          sections.forEach((sec) => {
            layerLabels.set(sec.layer, sec.label)
          })

          const layerGraphIds = new Map<string, string>()
          layerLabels.forEach((label, layerName) => {
            const graphId = `__layer__${layerName}`
            layerGraphIds.set(layerName, graphId)
            g.setNode(graphId, { label, clusterNode: true })
          })

          // Add nodes
          nodes.forEach((n) => {
            g.setNode(n.id, { width: nodeWidth, height: nodeHeight, label: n.label })
            if (n.layer) {
              g.setParent(n.id, layerGraphIds.get(n.layer)!)
            }
          })

          // Add edges
          edges.forEach((e) => {
            if (g.hasNode(e.from) && g.hasNode(e.to)) {
              g.setEdge(e.from, e.to)
            }
          })

          dagre.layout(g)

          // Calculate bounding box
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
          const nodePositions = new Map<string, { x: number; y: number }>()

          nodes.forEach((n) => {
            const layoutNode = g.node(n.id)
            if (layoutNode && layoutNode.x !== undefined && layoutNode.y !== undefined) {
              const nx = layoutNode.x - nodeWidth / 2
              const ny = layoutNode.y - nodeHeight / 2
              nodePositions.set(n.id, { x: nx, y: ny })
              minX = Math.min(minX, nx)
              minY = Math.min(minY, ny)
              maxX = Math.max(maxX, nx + nodeWidth)
              maxY = Math.max(maxY, ny + nodeHeight)
            }
          })

          // Fit into 1280x720 canvas (offset Y for title at top)
          const canvasW = 1280
          const canvasH = 720
          const paddingX = 80
          const paddingYTop = 150
          const paddingYBottom = 60
          const targetW = canvasW - paddingX * 2
          const targetH = canvasH - paddingYTop - paddingYBottom
          const graphW = Math.max(1, maxX - minX)
          const graphH = Math.max(1, maxY - minY)

          const scale = Math.min(1, Math.min(targetW / graphW, targetH / graphH))
          const finalGraphW = graphW * scale
          const finalGraphH = graphH * scale
          const offsetX = paddingX + (targetW - finalGraphW) / 2 - minX * scale
          const offsetY = paddingYTop + (targetH - finalGraphH) / 2 - minY * scale

          const transformedNodeMap = new Map<string, { x: number; y: number; width: number; height: number }>()
          nodes.forEach((n) => {
            const rawPos = nodePositions.get(n.id) || { x: 100, y: 100 }
            transformedNodeMap.set(n.id, {
              x: Math.round(rawPos.x * scale + offsetX),
              y: Math.round(rawPos.y * scale + offsetY),
              width: Math.round(nodeWidth * scale),
              height: Math.round(nodeHeight * scale),
            })
          })

          // Create Container Section Cards (zIndex: 1)
          layerLabels.forEach((layerLabel, layerName) => {
            const childNodes = nodes.filter((n) => n.layer === layerName)
            if (childNodes.length === 0) return

            let layerMinX = Infinity, layerMinY = Infinity, layerMaxX = -Infinity, layerMaxY = -Infinity
            childNodes.forEach((cn) => {
              const t = transformedNodeMap.get(cn.id)
              if (t) {
                layerMinX = Math.min(layerMinX, t.x)
                layerMinY = Math.min(layerMinY, t.y)
                layerMaxX = Math.max(layerMaxX, t.x + t.width)
                layerMaxY = Math.max(layerMaxY, t.y + t.height)
              }
            })

            const pad = 24
            elements.push({
              id: `section-${uuid().slice(0, 8)}`,
              type: 'section',
              diagramGroupId,
              position: {
                x: Math.max(20, Math.round(layerMinX - pad)),
                y: Math.max(20, Math.round(layerMinY - pad - 16)),
              },
              size: {
                width: Math.round(layerMaxX - layerMinX + pad * 2),
                height: Math.round(layerMaxY - layerMinY + pad * 2 + 16),
              },
              rotation: 0,
              opacity: 1,
              zIndex: 1,
              animation: 'fade-in',
              animationDelay: 0.1,
              content: {
                label: layerLabel,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderStyle: 'dashed',
                borderWidth: 1,
                cornerRadius: 12,
              } satisfies SectionContent,
            })
          })

          // Create Shape Elements (zIndex: 2)
          nodes.forEach((n, idx) => {
            const t = transformedNodeMap.get(n.id) || { x: 100, y: 100, width: 140, height: 80 }
            const iconPathStr = resolveIconPathString(n.label || n.sublabel || n.shapeType)
            const finalShapeType: ShapeType = (iconPathStr && (n.shapeType === 'rectangle' || n.shapeType === 'aws-icon' || n.shapeType === 'icon')) ? 'aws-icon' : n.shapeType
            const isIcon = finalShapeType === 'aws-icon' || finalShapeType === 'gcp-icon' || finalShapeType === 'icon'

            const shapeFill = isIcon ? 'transparent' : (themeAccent.fill || 'rgba(59, 130, 246, 0.25)')
            const shapeStroke = isIcon ? 'transparent' : (themeAccent.stroke || '#60a5fa')

            elements.push({
              id: n.id,
              type: 'shape',
              diagramGroupId,
              position: { x: t.x, y: t.y },
              size: { width: t.width, height: t.height },
              rotation: 0,
              opacity: 1,
              zIndex: 2,
              animation: 'fade-in',
              animationDelay: 0.15 + idx * 0.08,
              content: {
                shapeType: finalShapeType,
                label: n.label,
                sublabel: n.sublabel,
                iconPath: iconPathStr,
                fill: shapeFill,
                stroke: shapeStroke,
                textColor: themeAccent.text,
                strokeWidth: 1.5,
              } satisfies ShapeContent,
            })
          })

          // Semantic validation guarantees every edge points at an existing node.
          edges.forEach((e, idx) => {
            const lineId = `line-${uuid().slice(0, 8)}`
            elements.push({
              id: lineId,
              type: 'line',
              diagramGroupId,
              position: { x: 0, y: 0 },
              size: { width: 100, height: 100 },
              rotation: 0,
              opacity: 1,
              zIndex: 3,
              animation: 'draw',
              animationDelay: 0.3 + idx * 0.1,
              content: {
                lineType: 'elbow',
                style: e.style || 'solid',
                arrow: 'end',
                color: themeAccent.line || '#93c5fd',
                strokeWidth: 1.5,
                label: e.label,
                x1: 0,
                y1: 0,
                x2: 1,
                y2: 1,
                startConnection: { elementId: e.from, handleId: 'right' },
                endConnection: { elementId: e.to, handleId: 'left' },
              } satisfies LineContent,
            })
          })
        }

        synthesizedSlides.push({
          id: slideId,
          name: s.name,
          background: s.background || defaultBg,
          elements,
          script: s.speakerNotes || null,
        })

        // Add transition to next slide
        if (input.setMagicMoveTransitions && sIdx < rawSlides.length - 1) {
          const nextSlideId = `slide-placeholder-${sIdx + 1}`
          slideTransitions.push({
            id: `transition-${uuid().slice(0, 8)}`,
            fromSlideId: slideId,
            toSlideId: nextSlideId,
            animation: 'magic-move',
            duration: 650,
            ease: { x1: 0.22, y1: 1, x2: 0.36, y2: 1 },
            trigger: 'click',
          })
        }
      })

      // Fix nextSlideId references
      slideTransitions.forEach((t, i) => {
        if (synthesizedSlides[i + 1]) {
          t.toSlideId = synthesizedSlides[i + 1].id
        }
      })

      // Update editor store state
      useEditorStore.setState((state) => ({
        projects: state.projects.map((p) => {
          if (p.id !== activeProjectId) return p
          return {
            ...p,
            name: input.documentTitle || p.name,
            slides: synthesizedSlides,
            transitions: slideTransitions,
            updatedAt: Date.now(),
            synced: false,
          }
        }),
        activeSlideIndex: 0,
        selectedElementIds: [],
        selectedTransitionId: null,
        isEditingId: null,
      }))

      // Recalculate line coordinates across all synthesized slides
      synthesizedSlides.forEach((_, idx) => {
        useEditorStore.getState().recalculateLines(idx)
      })

      return {
        success: true,
        data: {
          slideCount: synthesizedSlides.length,
          title: input.documentTitle,
          theme: themeKey,
          message: `Successfully synthesized ${synthesizedSlides.length}-slide deck for "${input.documentTitle}"${input.setMagicMoveTransitions ? ' with Magic Move transitions' : ''}.`,
        },
      }
    }

    default:
      return { success: false, error: `Unknown deck synthesis tool: ${toolName}` }
  }
}
