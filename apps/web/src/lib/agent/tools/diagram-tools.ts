import { z } from 'zod'
import { tool } from 'ai'
import dagre from 'dagre'
import { useEditorStore } from '../../../store/editor-store'
import { uuid } from '../../uuid'
import { resolveIconPath, resolveIconPathString } from '../../generation/icon-resolver'
import type { SceneElement, ShapeType, LineType, SectionContent, LineContent, ShapeContent, Slide } from '@motionslides/shared'

// ─────────────────────────────────────────────────────────────────
// Helper: Smart Fallback Placement (prevents stacked elements)
// ─────────────────────────────────────────────────────────────────

function nextAvailableShapePosition(slide: Slide, width: number, height: number): { x: number; y: number } {
  const shapes = slide.elements.filter(e => e.type === 'shape' || e.type === 'section')
  if (shapes.length === 0) {
    return {
      x: Math.round(1280 / 2 - width / 2),
      y: Math.round(720 / 2 - height / 2),
    }
  }

  const last = shapes[shapes.length - 1]
  const gapX = 60
  const gapY = 60

  // Try placing to the right of the last shape
  const candX = last.position.x + last.size.width + gapX
  if (candX + width <= 1180) {
    return { x: candX, y: last.position.y }
  }

  // Wrap to a new row below
  const candY = last.position.y + last.size.height + gapY
  if (candY + height <= 640) {
    return { x: 120, y: candY }
  }

  // Cascade if slide is dense
  const offset = (shapes.length * 35) % 220
  return { x: 120 + offset, y: 120 + offset }
}

export const diagramToolSchemas = {
  addShapeElement: tool({
    description: 'Add a diagram shape or architecture node element (e.g. server, database, client, AWS/GCP icon) to a slide.',
    inputSchema: z.object({
      shapeType: z.enum([
        'rectangle', 'rounded-rectangle', 'circle', 'cylinder', 'diamond',
        'hexagon', 'database', 'server', 'cloud', 'client', 'user',
        'bucket', 'queue', 'document', 'aws-icon', 'gcp-icon', 'icon',
      ]).describe('The visual shape or icon type'),
      label: z.string().optional().describe('Primary text label for the node'),
      sublabel: z.string().optional().describe('Secondary text sublabel'),
      iconPath: z.string().optional().describe('Path to icon asset for aws-icon / gcp-icon / icon types'),
      x: z.number().optional().describe('X position on 1280px canvas'),
      y: z.number().optional().describe('Y position on 720px canvas'),
      width: z.number().optional().describe('Width in pixels (default: 110)'),
      height: z.number().optional().describe('Height in pixels (default: 80)'),
      fill: z.string().optional().describe('Fill color or transparent'),
      stroke: z.string().optional().describe('Border/stroke color'),
      slideIndex: z.number().optional().describe('Optional 0-based slide index target.'),
      id: z.string().optional().describe('Optional explicit element ID for Magic-Move matching across slides.'),
    }),
  }),

  addSectionElement: tool({
    description: 'Add a visual container section boundary (e.g., VPC, Subnet, Microservices boundary) to group diagram nodes.',
    inputSchema: z.object({
      label: z.string().optional().describe('Header label for the boundary layer'),
      x: z.number().describe('X position (0–1280)'),
      y: z.number().describe('Y position (0–720)'),
      width: z.number().describe('Width in pixels'),
      height: z.number().describe('Height in pixels'),
      backgroundColor: z.string().optional().describe('Translucent fill color (e.g. rgba(255,255,255,0.04))'),
      borderColor: z.string().optional().describe('Border stroke color'),
      borderStyle: z.enum(['solid', 'dashed', 'dotted', 'none']).optional(),
      cornerRadius: z.number().optional().describe('Corner radius in pixels (default: 12)'),
      slideIndex: z.number().optional().describe('Optional 0-based slide index target.'),
      id: z.string().optional().describe('Optional explicit element ID.'),
    }),
  }),

  addLineElement: tool({
    description: 'Add a connector line between diagram elements or explicit canvas points.',
    inputSchema: z.object({
      fromElementId: z.string().optional().describe('ID of source element'),
      toElementId: z.string().optional().describe('ID of destination element'),
      fromPort: z.enum(['top', 'right', 'bottom', 'left']).optional().describe('Exit port on source element'),
      toPort: z.enum(['top', 'right', 'bottom', 'left']).optional().describe('Entry port on destination element'),
      x1: z.number().optional().describe('Source X if not connecting by element ID'),
      y1: z.number().optional().describe('Source Y if not connecting by element ID'),
      x2: z.number().optional().describe('Target X if not connecting by element ID'),
      y2: z.number().optional().describe('Target Y if not connecting by element ID'),
      lineType: z.enum(['straight', 'elbow', 'curved']).optional().describe('Routing style (default: elbow)'),
      style: z.enum(['solid', 'dashed', 'dotted']).optional().describe('Line stroke style (default: solid)'),
      arrow: z.enum(['none', 'end', 'both']).optional().describe('Arrowhead style (default: end)'),
      color: z.string().optional().describe('Line stroke color'),
      label: z.string().optional().describe('Flow label on the connection'),
      slideIndex: z.number().optional().describe('Optional 0-based slide index target.'),
    }),
  }),

  generateDiagram: tool({
    description: 'Generate a complete architectural diagram or flowchart with automated Dagre layout, container groups, cloud icons, and smart connector lines.',
    inputSchema: z.object({
      nodes: z.array(z.object({
        id: z.string().describe('Unique ID for the node (e.g. "auth-service", "media-bucket")'),
        shapeType: z.enum([
          'rectangle', 'rounded-rectangle', 'circle', 'cylinder', 'diamond',
          'hexagon', 'database', 'server', 'cloud', 'client', 'user',
          'bucket', 'queue', 'document', 'aws-icon', 'gcp-icon', 'icon',
        ]).describe('The visual shape or icon type'),
        label: z.string().optional().describe('Primary label for the node (e.g. "API Gateway")'),
        sublabel: z.string().optional().describe('Secondary sublabel (e.g. "Express.js / REST")'),
        iconPath: z.string().optional().describe('Optional explicit SVG icon path. If omitted, will be auto-resolved from label/type.'),
        layer: z.string().optional().describe('Optional container group / tier name (e.g. "Ingestion", "Processing", "Data Tier") to group nodes inside a visual boundary'),
        fill: z.string().optional().describe('Card background fill color'),
        stroke: z.string().optional().describe('Card border stroke color'),
      })).describe('List of diagram nodes to generate'),
      edges: z.array(z.object({
        from: z.string().describe('Source node ID'),
        to: z.string().describe('Target node ID'),
        label: z.string().optional().describe('Flow label on the connection (e.g. "POST /upload", "Read/Write")'),
        style: z.enum(['solid', 'dashed', 'dotted']).optional().describe('Line stroke style (default: solid)'),
      })).describe('List of edges connecting the nodes'),
      sections: z.array(z.object({
        id: z.string().optional().describe('Optional container ID'),
        label: z.string().describe('Header label for the container boundary (e.g. "AWS VPC Core", "Public Subnet")'),
        layer: z.string().optional().describe('Matching layer name from nodes to automatically wrap around'),
        backgroundColor: z.string().optional().describe('Container fill color (default: rgba(255,255,255,0.03))'),
        borderColor: z.string().optional().describe('Container border color (default: rgba(255,255,255,0.12))'),
      })).optional().describe('Optional explicit visual container boundaries / VPC groupings'),
      direction: z.enum(['LR', 'TB', 'RL', 'BT']).optional().describe('Layout direction: LR (Left-to-Right) or TB (Top-to-Bottom). Defaults to LR.'),
      slideIndex: z.number().nonnegative().optional().describe('Optional 0-based slide index target'),
      replaceGroupId: z.string().optional().describe('If iterating on an existing diagram, pass its diagramGroupId to replace it'),
    }),
  }),

  patchDiagram: tool({
    description: 'Incrementally update an existing diagram on the active slide (adding nodes, removing nodes, rewiring edges) without wiping out manual positions or breaking cross-slide Magic Move IDs.',
    inputSchema: z.object({
      diagramGroupId: z.string().optional().describe('Optional target diagramGroupId. If omitted, targets the existing diagram on the active slide.'),
      slideIndex: z.number().nonnegative().optional(),
      addNodes: z.array(z.object({
        id: z.string().describe('Unique ID for the node'),
        shapeType: z.enum([
          'rectangle', 'rounded-rectangle', 'circle', 'cylinder', 'diamond',
          'hexagon', 'database', 'server', 'cloud', 'client', 'user',
          'bucket', 'queue', 'document', 'aws-icon', 'gcp-icon', 'icon',
        ]).describe('Shape type'),
        label: z.string().optional(),
        sublabel: z.string().optional(),
        iconPath: z.string().optional(),
        layer: z.string().optional(),
        fill: z.string().optional(),
        stroke: z.string().optional(),
      })).optional().default([]).describe('New nodes to add into the diagram'),
      removeNodeIds: z.array(z.string()).optional().default([]).describe('List of node IDs to remove from the diagram'),
      addEdges: z.array(z.object({
        from: z.string().describe('Source node ID'),
        to: z.string().describe('Target node ID'),
        label: z.string().optional(),
        style: z.enum(['solid', 'dashed', 'dotted']).optional().default('solid'),
      })).optional().default([]).describe('New connections to add'),
      removeEdges: z.array(z.object({
        from: z.string(),
        to: z.string(),
      })).optional().default([]).describe('Connections to remove'),
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

export async function executeDiagramTool(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
  const store = getStore()

  switch (toolName) {
    case 'addShapeElement': {
      const {
        shapeType, label, sublabel, iconPath,
        x, y, width = 110, height = 80,
        fill = 'transparent', stroke = '#3b82f6', slideIndex, id,
      } = args as {
        shapeType: ShapeType; label?: string; sublabel?: string; iconPath?: string;
        x?: number; y?: number; width?: number; height?: number;
        fill?: string; stroke?: string; slideIndex?: number; id?: string
      }

      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }

      // Smart placement if coordinates are omitted
      const pos = (x !== undefined && y !== undefined)
        ? { x, y }
        : nextAvailableShapePosition(slide, width, height)

      // Auto-resolve icon if not provided
      const resolvedIcon = resolveIconPathString(iconPath || label || sublabel || shapeType)
      const finalShapeType = (resolvedIcon && (shapeType === 'rectangle' || shapeType === 'aws-icon' || shapeType === 'icon')) ? 'aws-icon' : shapeType

      const derivedSlug = label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : ''
      const elementId = id || (derivedSlug ? `node-${derivedSlug}` : uuid())
      const newElement: SceneElement = {
        id: elementId,
        type: 'shape',
        position: { x: pos.x, y: pos.y },
        size: { width, height },
        rotation: 0,
        opacity: 1,
        zIndex: 10,
        animation: 'fade-in',
        animationDelay: 0,
        content: {
          shapeType: finalShapeType,
          label,
          sublabel,
          iconPath: resolvedIcon,
          fill,
          stroke,
          strokeWidth: 1.5,
        } as ShapeContent,
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

      useEditorStore.getState().recalculateLines()

      return { success: true, elementId, slideName: slide.name, preview: `Added shape "${label || shapeType}" at (${pos.x}, ${pos.y})` }
    }

    case 'addSectionElement': {
      const {
        label, x, y, width, height,
        backgroundColor = 'rgba(255, 255, 255, 0.04)',
        borderColor = 'rgba(255, 255, 255, 0.1)',
        borderStyle = 'solid', cornerRadius = 12, slideIndex, id,
      } = args as {
        label?: string; x: number; y: number; width: number; height: number;
        backgroundColor?: string; borderColor?: string; borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
        cornerRadius?: number; slideIndex?: number; id?: string
      }

      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }

      const elementId = id || uuid()
      const newElement: SceneElement = {
        id: elementId,
        type: 'section',
        position: { x, y },
        size: { width, height },
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        animation: 'fade-in',
        animationDelay: 0,
        content: {
          label,
          backgroundColor,
          borderColor,
          borderStyle,
          borderWidth: 1,
          cornerRadius,
        } as SectionContent,
      }

      const activeProjectId = store.activeProjectId
      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : {
                ...p,
                slides: p.slides.map((sl) =>
                  sl.id !== slide.id ? sl : { ...sl, elements: [newElement, ...sl.elements] }
                ),
                updatedAt: Date.now(),
              }
        ),
      }))

      return { success: true, elementId, slideName: slide.name, preview: `Added boundary section "${label || 'Layer'}"` }
    }

    case 'addLineElement': {
      const {
        fromElementId, toElementId, fromPort, toPort,
        x1, y1, x2, y2,
        lineType = 'elbow', style = 'solid', arrow = 'end',
        color = '#3b82f6', label, slideIndex,
      } = args as {
        fromElementId?: string; toElementId?: string;
        fromPort?: 'top' | 'right' | 'bottom' | 'left'; toPort?: 'top' | 'right' | 'bottom' | 'left';
        x1?: number; y1?: number; x2?: number; y2?: number;
        lineType?: LineType; style?: 'solid' | 'dashed' | 'dotted';
        arrow?: 'none' | 'end' | 'both'; color?: string; label?: string; slideIndex?: number
      }

      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }

      const findMatchingElement = (targetId?: string) => {
        if (!targetId) return null
        const cleanTarget = targetId.trim().toLowerCase()
        return slide.elements.find((e) => {
          if (e.id === targetId || e.id === `node-${cleanTarget}`) return true
          const elLabel = (e.content as any)?.label?.toString().toLowerCase()
          if (elLabel && (elLabel === cleanTarget || elLabel.includes(cleanTarget) || cleanTarget.includes(elLabel))) return true
          return false
        }) || null
      }

      const fromEl = findMatchingElement(fromElementId)
      const toEl = findMatchingElement(toElementId)

      let lineX = x1 ?? 200
      let lineY = y1 ?? 360
      let lineW = (x2 !== undefined && x1 !== undefined) ? Math.abs(x2 - x1) : 160
      let lineH = (y2 !== undefined && y1 !== undefined) ? Math.abs(y2 - y1) : 80

      if (fromEl && toEl) {
        const minX = Math.min(fromEl.position.x, toEl.position.x) - 20
        const minY = Math.min(fromEl.position.y, toEl.position.y) - 20
        const maxX = Math.max(fromEl.position.x + fromEl.size.width, toEl.position.x + toEl.size.width) + 20
        const maxY = Math.max(fromEl.position.y + fromEl.size.height, toEl.position.y + toEl.size.height) + 20
        lineX = minX
        lineY = minY
        lineW = maxX - minX
        lineH = maxY - minY
      }

      const elementId = uuid()
      const newElement: SceneElement = {
        id: elementId,
        type: 'line',
        position: { x: lineX, y: lineY },
        size: { width: lineW, height: lineH },
        rotation: 0,
        opacity: 1,
        zIndex: 5,
        animation: 'draw',
        animationDelay: 0,
        content: {
          lineType,
          x1: 0, y1: 0, x2: 1, y2: 1,
          style,
          arrow,
          color,
          strokeWidth: 1.5,
          label,
          ...(fromEl ? { startConnection: { elementId: fromEl.id, handleId: fromPort || 'right' } } : {}),
          ...(toEl ? { endConnection: { elementId: toEl.id, handleId: toPort || 'left' } } : {}),
        } as LineContent,
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

      useEditorStore.getState().recalculateLines()

      return { success: true, elementId, slideName: slide.name, preview: `Added line connection "${label || 'connector'}"` }
    }

    case 'generateDiagram': {
      const rawNodes = Array.isArray(args.nodes) ? (args.nodes as Array<{
        id: string;
        shapeType: ShapeType;
        label?: string;
        sublabel?: string;
        iconPath?: string;
        layer?: string;
        fill?: string;
        stroke?: string;
      }>) : []

      const rawEdges = Array.isArray(args.edges) ? (args.edges as Array<{
        from: string;
        to: string;
        label?: string;
        style?: 'solid' | 'dashed' | 'dotted';
      }>) : []

      const rawSections = Array.isArray(args.sections) ? (args.sections as Array<{
        id?: string;
        label: string;
        layer?: string;
        backgroundColor?: string;
        borderColor?: string;
      }>) : []

      const { slideIndex, replaceGroupId, direction } = args as {
        slideIndex?: number;
        replaceGroupId?: string;
        direction?: 'LR' | 'TB' | 'RL' | 'BT';
      }

      if (rawNodes.length === 0) {
        return { success: false, error: 'No nodes provided for generateDiagram.' }
      }

      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found. Please use addSlide first if you need a new slide.` }

      // Safely initialize compound Dagre graph
      const dagreLib = (dagre as any)?.default || dagre
      const GraphConstructor = dagreLib?.graphlib?.Graph || dagre?.graphlib?.Graph
      if (!GraphConstructor) {
        return { success: false, error: 'Graph layout engine initialization failed.' }
      }

      const g = new GraphConstructor({ compound: true })

      const rankdir: 'LR' | 'TB' | 'RL' | 'BT' = direction || (rawNodes.length > 6 && rawEdges.length > 5 ? 'TB' : 'LR')
      g.setGraph({
        rankdir,
        marginx: 40,
        marginy: 40,
        nodesep: rankdir === 'LR' ? 45 : 60,
        edgesep: 25,
        ranksep: rankdir === 'LR' ? 85 : 60,
      })
      g.setDefaultEdgeLabel(() => ({}))

      const nodeWidth = 140
      const nodeHeight = 80
      const nodeIds = new Set(rawNodes.map(n => n.id))

      // 1. Identify distinct container layers
      const layers = new Set<string>()
      rawNodes.forEach(n => {
        if (n.layer) layers.add(n.layer)
      })
      rawSections.forEach(s => {
        if (s.layer) layers.add(s.layer)
        else if (s.label) layers.add(s.label)
      })

      layers.forEach(layer => {
        g.setNode(layer, { label: layer, isLayer: true })
      })

      // 2. Register nodes in graph
      rawNodes.forEach(n => {
        g.setNode(n.id, { width: nodeWidth, height: nodeHeight })
        if (n.layer) {
          g.setParent(n.id, n.layer)
        }
      })

      // 3. Register edges with safety filter
      rawEdges.forEach(e => {
        if (nodeIds.has(e.from) && nodeIds.has(e.to)) {
          g.setEdge(e.from, e.to)
        }
      })

      // 4. Compute Dagre layout
      const layoutFn = dagreLib?.layout || dagre?.layout
      if (typeof layoutFn === 'function') {
        layoutFn(g)
      }

      // 5. Calculate bounding box of all laid out nodes and layers
      const nodePositions = new Map<string, { x: number; y: number }>()
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity

      rawNodes.forEach(n => {
        const layoutNode = g.node(n.id)
        if (layoutNode && layoutNode.x !== undefined && layoutNode.y !== undefined) {
          const nx = layoutNode.x - nodeWidth / 2
          const ny = layoutNode.y - nodeHeight / 2
          nodePositions.set(n.id, { x: nx, y: ny })
          minX = Math.min(minX, nx)
          minY = Math.min(minY, ny)
          maxX = Math.max(maxX, nx + nodeWidth)
          maxY = Math.max(maxY, ny + nodeHeight)
        } else {
          nodePositions.set(n.id, { x: 100, y: 100 })
        }
      })

      layers.forEach(layer => {
        const layerNode = g.node(layer)
        if (layerNode && layerNode.x !== undefined && layerNode.y !== undefined) {
          const w = layerNode.width || 0
          const h = layerNode.height || 0
          const lx = layerNode.x - w / 2
          const ly = layerNode.y - h / 2
          minX = Math.min(minX, lx)
          minY = Math.min(minY, ly)
          maxX = Math.max(maxX, lx + w)
          maxY = Math.max(maxY, ly + h)
        }
      })

      if (!isFinite(minX)) minX = 40
      if (!isFinite(minY)) minY = 40
      if (!isFinite(maxX)) maxX = 1200
      if (!isFinite(maxY)) maxY = 640

      // 6. Scale and Center Diagram onto 1280x720 canvas
      const canvasW = 1280
      const canvasH = 720
      const paddingX = 80
      const paddingY = 80
      const targetW = canvasW - paddingX * 2
      const targetH = canvasH - paddingY * 2
      const graphW = Math.max(1, maxX - minX)
      const graphH = Math.max(1, maxY - minY)

      const scale = Math.min(1, Math.min(targetW / graphW, targetH / graphH))
      const finalGraphW = graphW * scale
      const finalGraphH = graphH * scale
      const offsetX = paddingX + (targetW - finalGraphW) / 2 - minX * scale
      const offsetY = paddingY + (targetH - finalGraphH) / 2 - minY * scale

      const diagramGroupId = uuid()
      const finalElements: SceneElement[] = []

      // 7. Create container / section boundary cards for layers
      const transformedNodeMap = new Map<string, { x: number; y: number; width: number; height: number }>()

      rawNodes.forEach(n => {
        const rawPos = nodePositions.get(n.id) || { x: 100, y: 100 }
        transformedNodeMap.set(n.id, {
          x: Math.round(rawPos.x * scale + offsetX),
          y: Math.round(rawPos.y * scale + offsetY),
          width: Math.round(nodeWidth * scale),
          height: Math.round(nodeHeight * scale),
        })
      })

      layers.forEach(layerName => {
        const childNodes = rawNodes.filter(n => n.layer === layerName)
        if (childNodes.length === 0) return

        let layerMinX = Infinity
        let layerMinY = Infinity
        let layerMaxX = -Infinity
        let layerMaxY = -Infinity

        childNodes.forEach(cn => {
          const t = transformedNodeMap.get(cn.id)
          if (t) {
            layerMinX = Math.min(layerMinX, t.x)
            layerMinY = Math.min(layerMinY, t.y)
            layerMaxX = Math.max(layerMaxX, t.x + t.width)
            layerMaxY = Math.max(layerMaxY, t.y + t.height)
          }
        })

        if (!isFinite(layerMinX)) return

        const pad = 24
        const matchingSec = rawSections.find(s => s.layer === layerName || s.label === layerName)
        const secElementId = matchingSec?.id || `section-${uuid().slice(0, 8)}`

        finalElements.push({
          id: secElementId,
          type: 'section',
          diagramGroupId,
          position: {
            x: Math.max(20, Math.round(layerMinX - pad)),
            y: Math.max(20, Math.round(layerMinY - pad - 16)), // extra header room
          },
          size: {
            width: Math.round(layerMaxX - layerMinX + pad * 2),
            height: Math.round(layerMaxY - layerMinY + pad * 2 + 16),
          },
          rotation: 0,
          opacity: 1,
          zIndex: 1,
          animation: 'fade-in',
          animationDelay: 0,
          content: {
            label: matchingSec?.label || layerName,
            backgroundColor: matchingSec?.backgroundColor || 'rgba(255, 255, 255, 0.03)',
            borderColor: matchingSec?.borderColor || 'rgba(255, 255, 255, 0.1)',
            borderStyle: 'dashed',
            borderWidth: 1,
            cornerRadius: 12,
          } as SectionContent,
        })
      })

      // 8. Create shape elements with auto-resolved iconography
      rawNodes.forEach(n => {
        const transformed = transformedNodeMap.get(n.id) || {
          x: 100, y: 100, width: Math.round(nodeWidth * scale), height: Math.round(nodeHeight * scale)
        }

        const resolvedIcon = resolveIconPathString(n.iconPath || n.label || n.sublabel || n.shapeType)
        const finalShapeType = (resolvedIcon && (n.shapeType === 'rectangle' || n.shapeType === 'aws-icon' || n.shapeType === 'icon')) ? 'aws-icon' : n.shapeType

        finalElements.push({
          id: n.id,
          type: 'shape',
          diagramGroupId,
          position: { x: transformed.x, y: transformed.y },
          size: { width: transformed.width, height: transformed.height },
          rotation: 0,
          opacity: 1,
          zIndex: 10,
          animation: 'fade-in',
          animationDelay: 0,
          content: {
            shapeType: finalShapeType,
            label: n.label,
            sublabel: n.sublabel,
            iconPath: resolvedIcon,
            fill: n.fill || 'transparent',
            stroke: n.stroke || '#3b82f6',
            strokeWidth: 1.5,
          } as ShapeContent,
        })
      })

      // 9. Create connector lines with dynamic direction-aware ports
      const startPort = rankdir === 'TB' ? 'bottom' : 'right'
      const endPort = rankdir === 'TB' ? 'top' : 'left'

      rawEdges.forEach(e => {
        if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) return

        finalElements.push({
          id: uuid(),
          type: 'line',
          diagramGroupId,
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          rotation: 0,
          opacity: 1,
          zIndex: 5,
          animation: 'draw',
          animationDelay: 0,
          content: {
            lineType: 'elbow',
            style: e.style || 'solid',
            arrow: 'end',
            color: '#3b82f6',
            strokeWidth: 1.5,
            label: e.label,
            startConnection: { elementId: e.from, handleId: startPort },
            endConnection: { elementId: e.to, handleId: endPort },
          } as LineContent,
        })
      })

      const activeProjectId = store.activeProjectId
      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : {
                ...p,
                slides: p.slides.map((sl) => {
                  if (sl.id !== slide.id) return sl
                  // Remove old diagram elements if iterating on existing group
                  const filteredElements = replaceGroupId 
                    ? sl.elements.filter(el => el.diagramGroupId !== replaceGroupId)
                    : sl.elements
                  return { ...sl, elements: [...filteredElements, ...finalElements] }
                }),
                updatedAt: Date.now(),
              }
        ),
      }))

      useEditorStore.getState().recalculateLines()

      return { 
        success: true, 
        diagramGroupId, 
        slideName: slide.name, 
        preview: `Generated diagram with ${rawNodes.length} nodes, ${layers.size} containers, and ${rawEdges.length} connections.` 
      }
    }

    case 'patchDiagram': {
      const {
        diagramGroupId: targetGroupId,
        slideIndex,
        addNodes = [],
        removeNodeIds = [],
        addEdges = [],
        removeEdges = [],
      } = args as {
        diagramGroupId?: string
        slideIndex?: number
        addNodes?: Array<{ id: string; shapeType: ShapeType; label?: string; sublabel?: string; iconPath?: string; layer?: string; fill?: string; stroke?: string }>
        removeNodeIds?: string[]
        addEdges?: Array<{ from: string; to: string; label?: string; style?: 'solid' | 'dashed' | 'dotted' }>
        removeEdges?: Array<{ from: string; to: string }>
      }

      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }

      const removeNodeSet = new Set(removeNodeIds)
      const diagramGroupId = targetGroupId || slide.elements.find(e => e.diagramGroupId)?.diagramGroupId || `group-patch-${uuid().slice(0, 8)}`

      // 1. Filter existing elements
      const existingRemainingElements = slide.elements.filter((el) => {
        if (el.type === 'shape' && removeNodeSet.has(el.id)) return false
        if (el.type === 'line') {
          const lc = el.content as LineContent
          const startId = lc.startConnection?.elementId
          const endId = lc.endConnection?.elementId
          if (startId && removeNodeSet.has(startId)) return false
          if (endId && removeNodeSet.has(endId)) return false
          // Check removeEdges
          const matchesRemoveEdge = removeEdges.some(re => re.from === startId && re.to === endId)
          if (matchesRemoveEdge) return false
        }
        return true
      })

      // 2. Collect all active shape nodes
      const allActiveNodes: Array<{ id: string; shapeType: string; label?: string; sublabel?: string; iconPath?: string; layer?: string; fill?: string; stroke?: string }> = []
      
      existingRemainingElements.forEach((el) => {
        if (el.type === 'shape') {
          const sc = el.content as ShapeContent
          allActiveNodes.push({
            id: el.id,
            shapeType: sc.shapeType,
            label: sc.label,
            sublabel: sc.sublabel,
            iconPath: sc.iconPath,
            fill: sc.backgroundColor || (sc as any).fill,
            stroke: sc.borderColor || (sc as any).stroke,
          })
        }
      })

      // Append new nodes (prevent duplicates)
      const existingIdSet = new Set(allActiveNodes.map(n => n.id))
      addNodes.forEach(an => {
        if (!existingIdSet.has(an.id)) {
          allActiveNodes.push(an)
          existingIdSet.add(an.id)
        }
      })

      if (allActiveNodes.length === 0) {
        return { success: false, error: 'No active nodes remaining in patched diagram.' }
      }

      // 3. Build compound Dagre graph for clean layout
      const g = new dagre.graphlib.Graph({ compound: true })
      g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 80, marginx: 20, marginy: 20 })
      g.setDefaultEdgeLabel(() => ({}))

      const nodeWidth = 140
      const nodeHeight = 80

      const layers = new Set<string>()
      allActiveNodes.forEach((n) => {
        if (n.layer) layers.add(n.layer)
      })
      layers.forEach((layerName) => {
        g.setNode(layerName, { label: layerName, clusterNode: true })
      })

      allActiveNodes.forEach((n) => {
        g.setNode(n.id, { width: nodeWidth, height: nodeHeight, label: n.label || n.id })
        if (n.layer) g.setParent(n.id, n.layer)
      })

      // Collect existing edges + new edges
      const activeEdges: Array<{ from: string; to: string; label?: string; style?: 'solid' | 'dashed' | 'dotted' }> = []
      
      existingRemainingElements.forEach((el) => {
        if (el.type === 'line') {
          const lc = el.content as LineContent
          const from = lc.startConnection?.elementId
          const to = lc.endConnection?.elementId
          if (from && to && existingIdSet.has(from) && existingIdSet.has(to)) {
            activeEdges.push({ from, to, label: lc.label, style: lc.style as any })
          }
        }
      })

      addEdges.forEach(ae => {
        if (existingIdSet.has(ae.from) && existingIdSet.has(ae.to)) {
          activeEdges.push(ae)
        }
      })

      activeEdges.forEach((e) => {
        if (g.hasNode(e.from) && g.hasNode(e.to)) {
          g.setEdge(e.from, e.to)
        }
      })

      dagre.layout(g)

      // 4. Calculate bounding box & normalize
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      const nodePositions = new Map<string, { x: number; y: number }>()

      allActiveNodes.forEach((n) => {
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

      const canvasW = 1280
      const canvasH = 720
      const paddingX = 80
      const paddingY = 80
      const targetW = canvasW - paddingX * 2
      const targetH = canvasH - paddingY * 2
      const graphW = Math.max(1, maxX - minX)
      const graphH = Math.max(1, maxY - minY)

      const scale = Math.min(1, Math.min(targetW / graphW, targetH / graphH))
      const finalGraphW = graphW * scale
      const finalGraphH = graphH * scale
      const offsetX = paddingX + (targetW - finalGraphW) / 2 - minX * scale
      const offsetY = paddingY + (targetH - finalGraphH) / 2 - minY * scale

      const transformedNodeMap = new Map<string, { x: number; y: number; width: number; height: number }>()
      allActiveNodes.forEach((n) => {
        const rawPos = nodePositions.get(n.id) || { x: 100, y: 100 }
        transformedNodeMap.set(n.id, {
          x: Math.round(rawPos.x * scale + offsetX),
          y: Math.round(rawPos.y * scale + offsetY),
          width: Math.round(nodeWidth * scale),
          height: Math.round(nodeHeight * scale),
        })
      })

      // 5. Construct rebuilt elements
      const finalElements: SceneElement[] = []

      // Non-diagram elements (e.g. titles) are kept untouched
      slide.elements.forEach(el => {
        if (el.type !== 'shape' && el.type !== 'line' && el.type !== 'section') {
          finalElements.push(el)
        }
      })

      // Container Sections (zIndex: 1)
      layers.forEach((layerName) => {
        const childNodes = allActiveNodes.filter((n) => n.layer === layerName)
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
        finalElements.push({
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
            label: layerName,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderStyle: 'dashed',
            borderWidth: 1,
            cornerRadius: 12,
          } as SectionContent,
        })
      })

      // Shapes (zIndex: 2)
      allActiveNodes.forEach((n, idx) => {
        const t = transformedNodeMap.get(n.id) || { x: 100, y: 100, width: 140, height: 80 }
        const resolvedIcon = resolveIconPathString(n.iconPath || n.label || n.sublabel || n.shapeType)
        const finalShapeType = (resolvedIcon && (n.shapeType === 'rectangle' || n.shapeType === 'aws-icon' || n.shapeType === 'icon')) ? 'aws-icon' : n.shapeType

        finalElements.push({
          id: n.id,
          type: 'shape',
          diagramGroupId,
          position: { x: t.x, y: t.y },
          size: { width: t.width, height: t.height },
          rotation: 0,
          opacity: 1,
          zIndex: 2,
          animation: 'fade-in',
          animationDelay: 0.1 + idx * 0.05,
          content: {
            shapeType: finalShapeType as any,
            label: n.label,
            sublabel: n.sublabel,
            iconPath: resolvedIcon,
            backgroundColor: n.fill || 'transparent',
            borderColor: n.stroke || '#3b82f6',
            borderWidth: 1.5,
            cornerRadius: 8,
          } as ShapeContent,
        })
      })

      // Connector Lines (zIndex: 3)
      activeEdges.forEach((e, idx) => {
        finalElements.push({
          id: `line-${uuid().slice(0, 8)}`,
          type: 'line',
          diagramGroupId,
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          rotation: 0,
          opacity: 1,
          zIndex: 3,
          animation: 'draw',
          animationDelay: 0.2 + idx * 0.08,
          content: {
            lineType: 'elbow',
            style: e.style || 'solid',
            arrow: 'end',
            color: '#3b82f6',
            strokeWidth: 1.5,
            label: e.label,
            startConnection: { elementId: e.from, handleId: 'right' },
            endConnection: { elementId: e.to, handleId: 'left' },
          } as LineContent,
        })
      })

      const activeProjectId = store.activeProjectId
      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : {
                ...p,
                slides: p.slides.map((sl) => {
                  if (sl.id !== slide.id) return sl
                  return { ...sl, elements: finalElements }
                }),
                updatedAt: Date.now(),
              }
        ),
      }))

      useEditorStore.getState().recalculateLines()

      return {
        success: true,
        diagramGroupId,
        slideName: slide.name,
        message: `Patched diagram on ${slide.name}: ${addNodes.length} nodes added, ${removeNodeIds.length} nodes removed, total ${allActiveNodes.length} nodes active.`,
      }
    }

    default:
      return { success: false, error: `Unknown diagram tool: ${toolName}` }
  }
}
