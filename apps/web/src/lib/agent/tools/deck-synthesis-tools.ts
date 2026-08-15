import { z } from 'zod'
import dagre from 'dagre'
import { v4 as uuid } from 'uuid'
import { useEditorStore } from '@/store/editor-store'
import type { SceneElement, ShapeContent, SectionContent, LineContent, TextContent, Slide } from '@/types/editor'
import { resolveIconPath, resolveIconPathString } from '@/lib/generation/icon-resolver'

export const deckSynthesisToolSchemas = {
  synthesizeDeckFromDocument: {
    description: 'Synthesize a cohesive multi-slide presentation deck from document text or architecture specs, establishing Magic Move cross-slide IDs and compound layouts.',
    inputSchema: z.object({
      documentTitle: z.string().describe('Title of the synthesized deck'),
      theme: z.enum(['midnight-indigo', 'nordic-light', 'obsidian-cyan', 'emerald-tech', 'cyberpunk-neon']).optional().default('midnight-indigo'),
      slides: z.array(
        z.object({
          name: z.string().describe('Name/title of this slide'),
          blueprint: z.enum(['hero-title', 'overview-topology', 'pipeline-flow', 'mesh-architecture', 'database-tier', 'summary']).optional(),
          background: z.string().optional(),
          title: z.string().optional().describe('Slide header title text'),
          subtitle: z.string().optional().describe('Slide subtitle text'),
          nodes: z.array(
            z.object({
              id: z.string().describe('Stable node ID (shared across slides for Magic Move morphing)'),
              shapeType: z.string().describe('e.g. server, database, bucket, queue, cloud, client, user, aws-icon'),
              label: z.string(),
              sublabel: z.string().optional(),
              layer: z.string().optional().describe('Container layer grouping (e.g. Ingestion, Compute, Storage)'),
            })
          ).optional().default([]),
          edges: z.array(
            z.object({
              from: z.string().describe('Source node ID'),
              to: z.string().describe('Target node ID'),
              label: z.string().optional(),
              style: z.enum(['solid', 'dashed', 'dotted']).optional().default('solid'),
            })
          ).optional().default([]),
          sections: z.array(
            z.object({
              label: z.string(),
              layer: z.string(),
            })
          ).optional().default([]),
          speakerNotes: z.string().optional(),
        })
      ),
      setMagicMoveTransitions: z.boolean().optional().default(true),
    }),
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
  'midnight-indigo': { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)', text: '#ffffff', line: '#93c5fd' },
  'nordic-light': { stroke: '#2563eb', fill: 'rgba(37, 99, 235, 0.08)', text: '#0f172a', line: '#3b82f6' },
  'obsidian-cyan': { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)', text: '#ffffff', line: '#67e8f9' },
  'emerald-tech': { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.15)', text: '#ffffff', line: '#6ee7b7' },
  'cyberpunk-neon': { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.15)', text: '#ffffff', line: '#f472b6' },
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

      const input = args as {
        documentTitle: string
        theme?: string
        slides?: Array<{
          name: string
          blueprint?: string
          background?: string
          title?: string
          subtitle?: string
          nodes?: Array<{ id: string; shapeType: string; label: string; sublabel?: string; layer?: string }>
          edges?: Array<{ from: string; to: string; label?: string; style?: 'solid' | 'dashed' | 'dotted' }>
          sections?: Array<{ label: string; layer: string }>
          speakerNotes?: string
        }>
        setMagicMoveTransitions?: boolean
      }

      const rawSlides = Array.isArray(input.slides) ? input.slides : []
      if (rawSlides.length === 0) {
        return { success: false, error: 'No slides provided in deck synthesis payload.' }
      }

      const themeKey = input.theme || 'midnight-indigo'
      const defaultBg = THEME_BACKGROUNDS[themeKey] || '#0b0c16'
      const themeAccent = THEME_ACCENTS[themeKey] || THEME_ACCENTS['midnight-indigo']

      const synthesizedSlides: Slide[] = []
      const slideTransitions: Array<{ fromSlideId: string; toSlideId: string; type: string }> = []

      rawSlides.forEach((s, sIdx) => {
        const slideId = `slide-${uuid().slice(0, 8)}`
        const elements: SceneElement[] = []
        const diagramGroupId = `group-deck-${uuid().slice(0, 8)}`

        // Header Title
        const headerTitle = s.title || s.name
        if (headerTitle) {
          elements.push({
            id: `title-${uuid().slice(0, 8)}`,
            type: 'text',
            position: { x: 80, y: 50 },
            size: { width: 900, height: 46 },
            rotation: 0,
            opacity: 1,
            zIndex: 10,
            animation: 'fade-in',
            animationDelay: 0.1,
            content: {
              text: headerTitle,
              fontSize: 34,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              color: '#ffffff',
              align: 'left',
              verticalAlign: 'top',
              lineHeight: 1.2,
            } as TextContent,
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
              text: s.subtitle,
              fontSize: 18,
              fontFamily: 'Inter',
              fontWeight: 'normal',
              color: 'rgba(255, 255, 255, 0.65)',
              align: 'left',
              verticalAlign: 'top',
              lineHeight: 1.3,
            } as TextContent,
          })
        }

        const nodes = Array.isArray(s.nodes) ? s.nodes : []
        const edges = Array.isArray(s.edges) ? s.edges : []
        const sections = Array.isArray(s.sections) ? s.sections : []

        if (nodes.length > 0) {
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
          const layers = new Set<string>()
          nodes.forEach((n) => {
            if (n.layer) layers.add(n.layer)
          })
          sections.forEach((sec) => {
            if (sec.layer) layers.add(sec.layer)
          })

          layers.forEach((layerName) => {
            g.setNode(layerName, { label: layerName, clusterNode: true })
          })

          // Add nodes
          nodes.forEach((n) => {
            g.setNode(n.id, { width: nodeWidth, height: nodeHeight, label: n.label })
            if (n.layer) {
              g.setParent(n.id, n.layer)
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
          layers.forEach((layerName) => {
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
                label: layerName,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderStyle: 'dashed',
                borderWidth: 1,
                cornerRadius: 12,
                headerPosition: 'top-left',
              } as SectionContent,
            })
          })

          // Create Shape Elements (zIndex: 2)
          nodes.forEach((n, idx) => {
            const t = transformedNodeMap.get(n.id) || { x: 100, y: 100, width: 140, height: 80 }
            const iconPathStr = resolveIconPathString(n.label || n.sublabel || n.shapeType)
            const finalShapeType = (iconPathStr && (n.shapeType === 'rectangle' || n.shapeType === 'aws-icon' || n.shapeType === 'icon')) ? 'aws-icon' : n.shapeType
            const isIcon = finalShapeType === 'aws-icon' || finalShapeType === 'gcp-icon' || finalShapeType === 'icon'

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
                shapeType: finalShapeType as any,
                label: n.label,
                sublabel: n.sublabel,
                iconPath: iconPathStr,
                backgroundColor: isIcon ? 'transparent' : themeAccent.fill,
                borderColor: isIcon ? 'transparent' : themeAccent.stroke,
                borderWidth: 1.5,
                textColor: themeAccent.text,
                cornerRadius: 8,
              } as ShapeContent,
            })
          })

          // Create Line Connectors (zIndex: 3) - Filter out orphaned edges to prevent unanchored diagonal lines
          const slideNodeIds = new Set(nodes.map((n) => n.id))
          const nodeLabelMap = new Map<string, string>()
          nodes.forEach((n) => {
            if (n.label) nodeLabelMap.set(n.label.toLowerCase().trim(), n.id)
            if (n.sublabel) nodeLabelMap.set(n.sublabel.toLowerCase().trim(), n.id)
          })

          edges.forEach((e, idx) => {
            const fromId = slideNodeIds.has(e.from) ? e.from : (nodeLabelMap.get(e.from?.toLowerCase().trim()) || null)
            const toId = slideNodeIds.has(e.to) ? e.to : (nodeLabelMap.get(e.to?.toLowerCase().trim()) || null)

            if (!fromId || !toId) return // Skip unanchored edge

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
                startConnection: { elementId: fromId, handleId: 'right' },
                endConnection: { elementId: toId, handleId: 'left' },
                controlPoints: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
              } as LineContent,
            })
          })
        }

        synthesizedSlides.push({
          id: slideId,
          name: s.name,
          background: s.background || defaultBg,
          elements,
          speakerNotes: s.speakerNotes,
        })

        // Add transition to next slide
        if (input.setMagicMoveTransitions && sIdx < rawSlides.length - 1) {
          const nextSlideId = `slide-placeholder-${sIdx + 1}`
          slideTransitions.push({
            fromSlideId: slideId,
            toSlideId: nextSlideId,
            type: 'magic-move',
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
          }
        }),
        activeSlideIndex: 0,
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
          message: `Successfully synthesized ${synthesizedSlides.length}-slide deck for "${input.documentTitle}" with Magic Move transitions.`,
        },
      }
    }

    default:
      return { success: false, error: `Unknown deck synthesis tool: ${toolName}` }
  }
}
