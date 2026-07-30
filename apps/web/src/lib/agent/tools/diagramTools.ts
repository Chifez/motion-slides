import { z } from 'zod'
import { tool } from 'ai'
import { useEditorStore } from '../../../store/editorStore'
import { uuid } from '../../uuid'
import type { SceneElement, ShapeType, LineType, SectionContent, LineContent, ShapeContent } from '@motionslides/shared'

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
      width: z.number().optional().describe('Width in pixels (default: 90)'),
      height: z.number().optional().describe('Height in pixels (default: 90)'),
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
        x = 300, y = 200, width = 90, height = 90,
        fill = 'transparent', stroke = '#3b82f6', slideIndex, id,
      } = args as {
        shapeType: ShapeType; label?: string; sublabel?: string; iconPath?: string;
        x?: number; y?: number; width?: number; height?: number;
        fill?: string; stroke?: string; slideIndex?: number; id?: string
      }

      const slide = getTargetSlide(store, slideIndex)
      if (!slide) return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }

      const elementId = id || uuid()
      const newElement: SceneElement = {
        id: elementId,
        type: 'shape',
        position: { x, y },
        size: { width, height },
        rotation: 0,
        opacity: 1,
        zIndex: 10,
        animation: 'fade-in',
        animationDelay: 0,
        content: {
          shapeType,
          label,
          sublabel,
          iconPath,
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

      return { success: true, elementId, slideName: slide.name, preview: `Added shape "${label || shapeType}"` }
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
        x1 = 0, y1 = 0, x2 = 100, y2 = 100,
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

      const fromEl = fromElementId ? slide.elements.find((e) => e.id === fromElementId) : null
      const toEl = toElementId ? slide.elements.find((e) => e.id === toElementId) : null

      let lineX = Math.min(x1, x2)
      let lineY = Math.min(y1, y2)
      let lineW = Math.abs(x2 - x1) || 100
      let lineH = Math.abs(y2 - y1) || 100

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

      return { success: true, elementId, slideName: slide.name, preview: `Added line connection "${label || 'connector'}"` }
    }

    default:
      return { success: false, error: `Unknown diagram tool: ${toolName}` }
  }
}
