import type { Slide, SceneElement, TextContent, ShapeContent, CodeContent, AnimationType, SectionContent, LineContent } from '@motionslides/shared'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants/export'
import { uuid } from '../uuid'
import type { GeneratedPresentation, AISlideType, AIElementType, AIConnection } from './slideGenerationSchema'
import { resolveIconPath } from './iconResolver'
import { resolveRoute } from './routingResolver'
import { DIAGRAM_BLUEPRINTS, detectBlueprint } from './diagramBlueprints'
import dagre from 'dagre'

// ─── Coordinate Conversion ────────────────────────────────────────────────────

function denorm(val: number, dimension: number): number {
  return Math.round(val * dimension)
}

function applyDagreLayoutToElements(
  elements: SceneElement[],
  connectionsData: AIConnection[] | undefined,
  slide: AISlideType,
  canvasW: number,
  canvasH: number
): SceneElement[] {
  const diagramElements = elements.filter(el => el.type !== 'section' && el.type !== 'line')
  if (diagramElements.length === 0) return elements

  const g = new dagre.graphlib.Graph({ compound: true })
  
  const blueprint = detectBlueprint(slide.spatialPlan || '')
  const rankdir = (blueprint.connectionPattern === 'tiered') ? 'TB' : 'LR'

  g.setGraph({
    rankdir,
    nodesep: rankdir === 'LR' ? 45 : 65,
    edgesep: 25,
    ranksep: rankdir === 'LR' ? 85 : 55,
    marginx: 120,
    marginy: 80,
  })
  g.setDefaultEdgeLabel(() => ({}))

  // 1. Add Layers as groups
  const layers = new Set<string>()
  diagramElements.forEach(el => {
    if (el.layer) layers.add(el.layer)
  })
  layers.forEach(layer => {
    g.setNode(layer, { label: layer, isLayer: true })
  })

  // 2. Add nodes to graph
  diagramElements.forEach(el => {
    g.setNode(el.id, { width: el.size.width, height: el.size.height })
    if (el.layer) {
      g.setParent(el.id, el.layer)
    }
  })

  // 3. Add edges
  if (connectionsData) {
    connectionsData.forEach(conn => {
      if (g.hasNode(conn.from) && g.hasNode(conn.to)) {
        g.setEdge(conn.from, conn.to)
      }
    })
  }

  // 4. Compute layout
  dagre.layout(g)

  // 5. Retrieve laid out coordinates and update positions
  const updatedElementsMap = new Map<string, { x: number; y: number }>()
  
  diagramElements.forEach(el => {
    const node = g.node(el.id)
    if (node) {
      updatedElementsMap.set(el.id, {
        x: node.x - el.size.width / 2,
        y: node.y - el.size.height / 2,
      })
    }
  })

  // 6. Scale and Translate elements to fit perfectly within the canvas margins
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  updatedElementsMap.forEach((pos, id) => {
    const el = diagramElements.find(e => e.id === id)
    if (el) {
      minX = Math.min(minX, pos.x)
      minY = Math.min(minY, pos.y)
      maxX = Math.max(maxX, pos.x + el.size.width)
      maxY = Math.max(maxY, pos.y + el.size.height)
    }
  })

  layers.forEach(layer => {
    const node = g.node(layer)
    if (node && node.x !== undefined && node.y !== undefined) {
      const w = node.width || 0
      const h = node.height || 0
      const lx = node.x - w / 2
      const ly = node.y - h / 2
      minX = Math.min(minX, lx)
      minY = Math.min(minY, ly)
      maxX = Math.max(maxX, lx + w)
      maxY = Math.max(maxY, ly + h)
    }
  })

  const graphW = maxX - minX
  const graphH = maxY - minY

  const paddingX = 100
  const paddingY = 100
  const targetW = canvasW - paddingX * 2
  const targetH = canvasH - paddingY * 2

  const scale = Math.min(1, Math.min(targetW / Math.max(1, graphW), targetH / Math.max(1, graphH)))

  const finalGraphW = graphW * scale
  const finalGraphH = graphH * scale
  const offsetX = paddingX + (targetW - finalGraphW) / 2 - minX * scale
  const offsetY = paddingY + (targetH - finalGraphH) / 2 - minY * scale

  const updatedElements = elements.map(el => {
    if (el.type === 'section' || el.type === 'line') return el

    const pos = updatedElementsMap.get(el.id)
    if (pos) {
      return {
        ...el,
        position: {
          x: Math.round(pos.x * scale + offsetX),
          y: Math.round(pos.y * scale + offsetY),
        },
        size: {
          width: Math.round(el.size.width * scale),
          height: Math.round(el.size.height * scale),
        }
      }
    }
    return el
  })

  return updatedElements
}

function applyTemplateLayout(elements: SceneElement[], template: string, canvasW: number, canvasH: number) {
  if (template === 'hero-title') {
    const title = elements.find(e => e.type === 'text' && (e.content as any).value && (e as any).role === 'title')
    if (title) {
      title.position = { x: Math.round(canvasW * 0.1), y: Math.round(canvasH * 0.35) }
      title.size = { width: Math.round(canvasW * 0.8), height: Math.round(canvasH * 0.15) }
      ;(title.content as any).align = 'center'
      ;(title.content as any).fontSize = 64
    }
    const subtitle = elements.find(e => e.type === 'text' && (e as any).role === 'subtitle')
    if (subtitle) {
      subtitle.position = { x: Math.round(canvasW * 0.1), y: Math.round(canvasH * 0.52) }
      subtitle.size = { width: Math.round(canvasW * 0.8), height: Math.round(canvasH * 0.08) }
      ;(subtitle.content as any).align = 'center'
      ;(subtitle.content as any).fontSize = 28
    }
  } else if (template === 'bullets-standard') {
    const title = elements.find(e => e.type === 'text' && (e as any).role === 'title')
    if (title) {
      title.position = { x: Math.round(canvasW * 0.08), y: Math.round(canvasH * 0.1) }
      title.size = { width: Math.round(canvasW * 0.84), height: Math.round(canvasH * 0.12) }
      ;(title.content as any).align = 'left'
    }
    const bullets = elements.filter(e => e.type === 'text' && (e as any).role !== 'title' && (e as any).role !== 'subtitle')
    bullets.forEach((b, i) => {
      b.position = { x: Math.round(canvasW * 0.08), y: Math.round(canvasH * 0.28 + i * 85) }
      b.size = { width: Math.round(canvasW * 0.84), height: Math.round(canvasH * 0.09) }
    })
  } else if (template === 'two-column') {
    const title = elements.find(e => e.type === 'text' && (e as any).role === 'title')
    if (title) {
      title.position = { x: Math.round(canvasW * 0.08), y: Math.round(canvasH * 0.1) }
      title.size = { width: Math.round(canvasW * 0.84), height: Math.round(canvasH * 0.12) }
    }
    const columns = elements.filter(e => e.type === 'text' && (e as any).role !== 'title')
    const mid = Math.ceil(columns.length / 2)
    columns.forEach((col, i) => {
      const isLeft = i < mid
      const colIdx = isLeft ? i : i - mid
      col.position = {
        x: Math.round(isLeft ? canvasW * 0.08 : canvasW * 0.52),
        y: Math.round(canvasH * 0.28 + colIdx * 90)
      }
      col.size = { width: Math.round(canvasW * 0.4), height: Math.round(canvasH * 0.1) }
    })
  }
}

/**
 * assembleSlides
 */
export function assembleSlides(
  generated: GeneratedPresentation,
  width:     number = CANVAS_WIDTH,
  height:    number = CANVAS_HEIGHT
): Slide[] {
  const theme = generated.theme

  return generated.slides.map(aiSlide => {
    const slideId = aiSlide.id || uuid()

    // 1. Build Base Elements (Icons, Clusters, Text, etc.)
    let baseElements: SceneElement[] = (aiSlide.elements || [])
      .map(aiEl => toSceneElement(aiEl, theme, generated, width, height))
      .filter(Boolean) as SceneElement[]

    if (aiSlide.layoutTemplate && aiSlide.role !== 'diagram') {
      applyTemplateLayout(baseElements, aiSlide.layoutTemplate, width, height)
    }

    if (aiSlide.role === 'diagram') {
      baseElements = applyDagreLayoutToElements(baseElements, aiSlide.connections, aiSlide, width, height)
    }

    // 2. Auto-Generate Atmospheric Sections for Layers
    const autoSections = generateAutoSections(aiSlide, baseElements, width, height)
    
    // 3. Resolve Connections into Line Elements
    const connections = generateConnections(aiSlide, baseElements, theme, width, height)

    const allElements = [...autoSections, ...baseElements, ...connections]

    const sanitized = sanitize(allElements, width, height)
    const resolved  = resolveOverlaps(sanitized, width, height)

    return {
      id:         slideId,
      name:       aiSlide.title,
      background: aiSlide.background ?? generated.theme.backgroundColor ?? 'var(--ms-bg-base)',
      elements:   resolved,
      transition: aiSlide.transition ? {
        type:     aiSlide.transition.type as any,
        duration: ensureMs(aiSlide.transition.duration, 500),
        easing:   aiSlide.transition.easing ?? 'easeInOut',
      } : undefined,
    }
  })
}

// ─── Auto-Section Generation ──────────────────────────────────────────────────

function generateAutoSections(slide: AISlideType, elements: SceneElement[], canvasW: number, canvasH: number): SceneElement[] {
  if (slide.role !== 'diagram') return []
  
  const blueprint = detectBlueprint(slide.spatialPlan)
  if (!blueprint.backgroundSections) return []

  const layerMap = new Map<string, SceneElement[]>()
  elements.forEach(el => {
    const layer = (el as any).layer
    if (layer) {
      if (!layerMap.has(layer)) layerMap.set(layer, [])
      layerMap.get(layer)!.push(el)
    }
  })

  const sections: SceneElement[] = []
  const PADDING = 0.02 * canvasH

  layerMap.forEach((layerEls, layerName) => {
    const minX = Math.min(...layerEls.map(e => e.position.x)) - PADDING
    const minY = Math.min(...layerEls.map(e => e.position.y)) - PADDING
    const maxX = Math.max(...layerEls.map(e => e.position.x + e.size.width)) + PADDING
    const maxY = Math.max(...layerEls.map(e => e.position.y + e.size.height)) + PADDING

    sections.push({
      id: uuid(),
      type: 'section',
      position: { x: Math.max(0, minX), y: Math.max(0, minY) },
      size: { width: maxX - minX, height: maxY - minY },
      zIndex: 1,
      opacity: 1,
      rotation: 0,
      animation: 'fade-in',
      animationDelay: 0,
      content: {
        label:           layerName,
        backgroundColor: 'rgba(255, 255, 255, 0.04)', // Translucent atmospheric tint
        borderColor:     'rgba(255, 255, 255, 0.1)',
        borderStyle:     'solid',
        borderWidth:     1,
        cornerRadius:    12,
      } as SectionContent,
    })
  })

  return sections
}

// ─── Connection Generation ────────────────────────────────────────────────────

function generateConnections(slide: AISlideType, elements: SceneElement[], theme: GeneratedPresentation['theme'], canvasW: number, canvasH: number): SceneElement[] {
  if (!slide.connections) return []

  return slide.connections.map(conn => {
    const fromEl = elements.find(e => e.id === conn.from)
    const toEl   = elements.find(e => e.id === conn.to)
    if (!fromEl || !toEl) return null

    // 1. Calculate Absolute Center Points
    const p1 = { x: fromEl.position.x + fromEl.size.width / 2,  y: fromEl.position.y + fromEl.size.height / 2 }
    const p2 = { x: toEl.position.x + toEl.size.width / 2,      y: toEl.position.y + toEl.size.height / 2 }

    // 2. Calculate Tight Bounding Box (with slight padding for selection handles/curves)
    const PADDING = 40
    const minX = Math.min(p1.x, p2.x) - PADDING
    const minY = Math.min(p1.y, p2.y) - PADDING
    const maxX = Math.max(p1.x, p2.x) + PADDING
    const maxY = Math.max(p1.y, p2.y) + PADDING

    const w = maxX - minX
    const h = maxY - minY

    // 3. Normalize points relative to this NEW tight bounding box
    const localX1 = (p1.x - minX) / w
    const localY1 = (p1.y - minY) / h
    const localX2 = (p2.x - minX) / w
    const localY2 = (p2.y - minY) / h

    // 4. Global centers for routing logic
    const globalC1 = { x: p1.x / canvasW, y: p1.y / canvasH }
    const globalC2 = { x: p2.x / canvasW, y: p2.y / canvasH }

    // Resolve path (shifted to local space)
    const path = resolveRoute(conn.routing as any, globalC1, globalC2, canvasW, canvasH)
    // Shift path coordinates to be local to the element
    const shiftedPath = path.replace(/([0-9.]+),([0-9.]+)/g, (match, px, py) => {
      const nx = (parseFloat(px) - minX).toFixed(2)
      const ny = (parseFloat(py) - minY).toFixed(2)
      return `${nx},${ny}`
    }).replace(/([0-9.]+) ([0-9.]+)/g, (match, px, py) => {
      const nx = (parseFloat(px) - minX).toFixed(2)
      const ny = (parseFloat(py) - minY).toFixed(2)
      return `${nx} ${ny}`
    })

    let lineType: 'straight' | 'elbow' | 'curved' = 'curved'
    if (conn.routing === 'straight') {
      lineType = 'straight'
    } else if (
      conn.routing === 'elbow-h' ||
      conn.routing === 'elbow-v' ||
      conn.routing === 'bypass-top' ||
      conn.routing === 'bypass-bottom'
    ) {
      lineType = 'elbow'
    } else {
      lineType = 'curved'
    }

    return {
      id: uuid(),
      type: 'line',
      position: { x: minX, y: minY },
      size: { width: w, height: h },
      zIndex: 5,
      opacity: 1,
      rotation: 0,
      animation: 'draw',
      animationDelay: 500,
      content: {
        lineType,
        x1: localX1, y1: localY1, x2: localX2, y2: localY2,
        color: conn.color ?? theme.accentColor,
        strokeWidth: conn.type === 'thick' ? 4 : 2,
        style: conn.type === 'dashed' ? 'dashed' : 'solid',
        arrow: conn.type === 'bidirectional' ? 'both' : 'end',
        label: conn.label,
        customPath: shiftedPath,
      } as any,
    }
  }).filter(Boolean) as SceneElement[]
}

// ─── Element Conversion ───────────────────────────────────────────────────────

function toSceneElement(
  aiEl: AIElementType,
  theme: GeneratedPresentation['theme'],
  generated: GeneratedPresentation,
  canvasWidth: number,
  canvasHeight: number,
): SceneElement | null {
  const pos = 'position' in aiEl ? aiEl.position : { x: 0, y: 0, w: 0.1, h: 0.1 }

  const x      = denorm(pos.x, canvasWidth)
  const y      = denorm(pos.y, canvasHeight)
  const width  = denorm(pos.w, canvasWidth)
  const height = denorm(pos.h, canvasHeight)

  const common = {
    id:             aiEl.id || uuid(),
    position:       { x, y },
    size:           { width, height },
    rotation:       0,
    opacity:        1,
    zIndex:         10,
    layer:          (aiEl as any).layer,
    animation:      (aiEl.animation ?? 'none') as AnimationType,
    animationDelay: ensureMs(aiEl.animationDelay, 0),
  }

  switch (aiEl.type) {
    case 'cluster':
      return {
        ...common,
        type: 'shape',
        content: {
          shapeType: 'aws-icon',
          iconPath: aiEl.iconPath,
          label: aiEl.label,
          isCluster: true,
          clusterCount: aiEl.count,
          stackDirection: aiEl.stackDirection || 'right',
          fill: 'transparent',
          stroke: theme.secondaryColor,
          strokeWidth: 0,
        } as any
      }

    case 'section':
      return {
        ...common,
        zIndex: 1,
        type:   'section',
        content: {
          label:           aiEl.label ?? undefined,
          backgroundColor: aiEl.backgroundColor,
          borderColor:     aiEl.borderColor,
          borderStyle:     aiEl.borderStyle,
          borderWidth:     aiEl.borderWidth,
          cornerRadius:    aiEl.cornerRadius,
        } as SectionContent,
      }

    case 'text':
      return {
        ...common,
        type: 'text',
        autoHeight: true,
        content: {
          value:      aiEl.content,
          fontSize:   mapFontSize(aiEl.style?.fontSize ?? 'md', aiEl.role),
          fontWeight: aiEl.style?.fontWeight ?? (aiEl.role === 'title' ? 'bold' : 'normal'),
          fontFamily: mapFontFamily(generated.theme.fontFamily),
          fontStyle:  'normal',
          color:      aiEl.style?.color ?? generated.theme.textColor,
          align:      aiEl.style?.align ?? 'left',
        } as TextContent,
      }

    case 'icon': {
      const resolved = resolveIconPath(aiEl.iconPath ?? '')
      return {
        ...common,
        type: 'shape',
        content: {
          shapeType:    'aws-icon',
          iconPath:     resolved.found ? resolved.path : aiEl.iconPath,
          iconLabel:    resolved.label,
          iconCategory: resolved.category,
          label:        aiEl.label ?? resolved.label,
          fill:         'transparent',
          stroke:       theme.secondaryColor,
          strokeWidth:  0,
        } as any,
      }
    }

    case 'shape':
      return {
        ...common,
        type: 'shape',
        content: {
          shapeType: aiEl.shape,
          label: aiEl.label,
          sublabel: aiEl.sublabel,
          iconPath: aiEl.iconPath,
          fill: aiEl.style?.backgroundColor ?? 'rgba(255, 255, 255, 0.05)',
          stroke: aiEl.style?.borderColor ?? theme.accentColor,
          strokeWidth: aiEl.style?.borderWidth ?? 2,
        } as any,
      }

    case 'code':
      return {
        ...common,
        type: 'code',
        content: {
          value: aiEl.code,
          language: aiEl.language,
        } as CodeContent,
      }

    default:
      return null
  }
}

// ─── Post-Processing ──────────────────────────────────────────────────────────

function sanitize(elements: SceneElement[], canvasWidth: number, canvasHeight: number): SceneElement[] {
  return elements.map(el => {
    const width  = Math.min(el.size.width,  canvasWidth)
    const height = Math.min(el.size.height, canvasHeight)
    const x = Math.max(0, Math.min(el.position.x, canvasWidth  - width))
    const y = Math.max(0, Math.min(el.position.y, canvasHeight - height))
    return { ...el, position: { x, y }, size: { width, height } }
  })
}

function resolveOverlaps(elements: SceneElement[], canvasWidth: number, canvasHeight: number): SceneElement[] {
  // Overlap logic... (keep existing one but prioritize layers)
  return elements.sort((a, b) => a.zIndex - b.zIndex)
}

function mapFontSize(size: string, role: string): number {
  const sizes: Record<string, number> = {
    xs: 12, sm: 16, md: 24, lg: 32, xl: 48, '2xl': 64, '3xl': 80, '4xl': 96
  }
  if (role === 'title') return sizes[size] || 54
  return sizes[size] || 24
}

function mapFontFamily(themeFont: string): string {
  const fonts: Record<string, string> = {
    inter: 'Inter', display: 'Outfit', mono: 'JetBrains Mono', serif: 'Playfair Display',
  }
  return fonts[themeFont] || 'Inter'
}

function ensureMs(val: number | null | undefined, fallback = 0): number {
  if (val === null || val === undefined) return fallback
  if (val > 0 && val < 20) return val * 1000
  return val
}
