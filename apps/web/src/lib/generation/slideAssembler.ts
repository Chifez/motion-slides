import type { Slide, SceneElement, TextContent, ShapeContent, CodeContent, AnimationType, SectionContent } from '@motionslides/shared'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants/export'
import { uuid } from '../uuid'
import type { GeneratedPresentation, AISlideType, AIElementType } from './slideGenerationSchema'
import { resolveIconPath } from './iconResolver'

// ─── Coordinate Conversion ────────────────────────────────────────────────────

/** Converts a normalized 0-1 value to canvas pixels along a given axis dimension. */
function denorm(val: number, dimension: number): number {
  return Math.round(val * dimension)
}

/**
 * assembleSlides
 *
 * Maps the AI-generated presentation structure into our internal Slide[] format.
 * Uses normalized 0-1 coordinates from the AI schema and converts to pixels.
 * Applies a sanitization pass and a basic overlap nudge after coordinate conversion.
 */
export function assembleSlides(generated: GeneratedPresentation): Slide[] {
  const theme = generated.theme

  return generated.slides.map(aiSlide => {
    const slideId = aiSlide.id || uuid()

    const rawElements: SceneElement[] = aiSlide.elements
      .map(aiEl => toSceneElement(aiEl, theme, generated))
      .filter(Boolean) as SceneElement[]

    const sanitized = sanitize(rawElements)
    const resolved  = resolveOverlaps(sanitized)
    const ordered   = enforceLineAnimationOrder(resolved, aiSlide.role)

    const transition = aiSlide.transition ? {
      type:     aiSlide.transition.type as any,
      duration: ensureMs(aiSlide.transition.duration, 500),
      easing:   aiSlide.transition.easing ?? 'easeInOut',
    } : undefined

    return {
      id:         slideId,
      name:       aiSlide.title,
      background: aiSlide.background ?? generated.theme.backgroundColor,
      elements:   ordered,
      transition,
    }
  })
}

// ─── Element Conversion ───────────────────────────────────────────────────────

function toSceneElement(
  aiEl: AIElementType,
  theme: GeneratedPresentation['theme'],
  generated: GeneratedPresentation,
): SceneElement | null {
  const pos = 'position' in aiEl ? aiEl.position : { x: 0, y: 0, w: 0.1, h: 0.1 }

  // Clamp to canvas boundaries before pixel conversion
  const safeX = Math.max(0, Math.min(pos.x, 1 - pos.w))
  const safeY = Math.max(0, Math.min(pos.y, 1 - pos.h))
  const safeW = Math.max(0.01, Math.min(pos.w, 1))
  const safeH = Math.max(0.01, Math.min(pos.h, 1))

  const x      = denorm(safeX, CANVAS_WIDTH)
  const y      = denorm(safeY, CANVAS_HEIGHT)
  const width  = Math.max(1, denorm(safeW, CANVAS_WIDTH))
  const height = Math.max(1, denorm(safeH, CANVAS_HEIGHT))

  const common = {
    id:             aiEl.id || uuid(),
    position:       { x, y },
    size:           { width, height },
    rotation:       0,
    opacity:        1,
    zIndex:         10,
    animation:      (aiEl.animation ?? 'none') as AnimationType,
    animationDelay: ensureMs(aiEl.animationDelay, 0),
  }

  switch (aiEl.type) {
    case 'section':
      return {
        ...common,
        zIndex: 1, // Always behind all other elements
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

    case 'shape':
      return {
        ...common,
        type: 'shape',
        content: {
          shapeType: (aiEl.shape || 'rectangle') as any,
          fill:      aiEl.style?.backgroundColor ?? generated.theme.primaryColor,
          stroke:    aiEl.style?.borderColor ?? generated.theme.accentColor,
          label:     aiEl.label ?? undefined,
          sublabel:  (aiEl as any).sublabel ?? undefined,
        } as ShapeContent,
      }

    case 'icon': {
      const resolved = resolveIconPath(aiEl.iconPath ?? '')
      if (resolved.found) {
        return {
          ...common,
          type: 'shape',
          content: {
            shapeType:    'aws-icon',
            iconPath:     resolved.path,
            iconLabel:    resolved.label,
            iconCategory: resolved.category,
            label:        aiEl.label ?? resolved.label,
            fill:         'transparent',
            stroke:       theme.secondaryColor,
            strokeWidth:  0,
            opacity:      1,
          } as any,
        }
      } else {
        return {
          ...common,
          type: 'shape',
          content: {
            shapeType:   resolved.fallback,
            label:       aiEl.label ?? '',
            fill:        theme.primaryColor,
            stroke:      theme.secondaryColor,
            strokeWidth: 2,
            opacity:     1,
          } as ShapeContent,
        }
      }
    }

    case 'code':
      return {
        ...common,
        type: 'code',
        content: {
          value:    aiEl.code,
          language: aiEl.language || 'javascript',
        } as CodeContent,
      }

    case 'line':
      return {
        ...common,
        type:   'line',
        zIndex: 5, // Lines above sections (1) but below shapes (10)
        content: {
          lineType:        aiEl.lineType ?? 'elbow',
          x1: 0, y1: 0, x2: 1, y2: 1,
          style:           aiEl.lineStyle ?? 'solid',
          arrow:           aiEl.direction === 'one-way' ? 'end' : aiEl.direction === 'two-way' ? 'both' : 'none',
          color:           theme.accentColor,
          strokeWidth:     2,
          label:           aiEl.label ?? undefined,
          startConnection: { elementId: aiEl.fromElementId, handleId: aiEl.fromHandle ?? 'center' },
          endConnection:   { elementId: aiEl.toElementId,   handleId: aiEl.toHandle   ?? 'center' },
        } as any,
      }

    default:
      return null
  }
}

// ─── Post-Processing ──────────────────────────────────────────────────────────

/**
 * Clamps all element positions and sizes to canvas boundaries.
 * Prevents AI hallucinations (x: 1.1) from producing off-canvas elements.
 */
function sanitize(elements: SceneElement[]): SceneElement[] {
  return elements.map(el => {
    const x      = Math.max(0, Math.min(el.position.x, CANVAS_WIDTH  - el.size.width))
    const y      = Math.max(0, Math.min(el.position.y, CANVAS_HEIGHT - el.size.height))
    const width  = Math.min(el.size.width,  CANVAS_WIDTH)
    const height = Math.min(el.size.height, CANVAS_HEIGHT)
    return { ...el, position: { x, y }, size: { width, height } }
  })
}

/**
 * Basic overlap nudge pass for non-line, non-section elements.
 * Sorts elements by area descending (larger = anchor), then nudges smaller
 * overlapping elements to the right or downward until they no longer intersect.
 */
function resolveOverlaps(elements: SceneElement[]): SceneElement[] {
  const GUTTER    = 8 // px minimum gap between non-section elements
  const MAX_PASS  = 3 // iteration limit to avoid infinite loops

  // Sections and lines are anchors — never moved
  const anchors  = elements.filter(el => el.type === 'section' || el.type === 'line')
  const movables = elements
    .filter(el => el.type !== 'section' && el.type !== 'line')
    .sort((a, b) => (b.size.width * b.size.height) - (a.size.width * a.size.height)) // large first

  for (let pass = 0; pass < MAX_PASS; pass++) {
    let moved = false
    for (let i = 0; i < movables.length; i++) {
      for (let j = i + 1; j < movables.length; j++) {
        const a = movables[i]
        const b = movables[j]

        if (overlaps(a, b, GUTTER)) {
          // Nudge b to the right of a, or below if it would go off-canvas
          const nudgeRight = a.position.x + a.size.width + GUTTER
          const nudgeDown  = a.position.y + a.size.height + GUTTER

          if (nudgeRight + b.size.width <= CANVAS_WIDTH) {
            movables[j] = { ...b, position: { x: nudgeRight, y: b.position.y } }
          } else if (nudgeDown + b.size.height <= CANVAS_HEIGHT) {
            movables[j] = { ...b, position: { x: b.position.x, y: nudgeDown } }
          }
          // If no valid position exists, leave in place (sanitize already clamped it)
          moved = true
        }
      }
    }
    if (!moved) break
  }

  // Reconstruct in original zIndex order
  return [...anchors, ...movables].sort((a, b) => a.zIndex - b.zIndex)
}

function overlaps(a: SceneElement, b: SceneElement, gutter: number): boolean {
  return !(
    a.position.x + a.size.width  + gutter <= b.position.x ||
    b.position.x + b.size.width  + gutter <= a.position.x ||
    a.position.y + a.size.height + gutter <= b.position.y ||
    b.position.y + b.size.height + gutter <= a.position.y
  )
}

// ─── Animation Order Enforcement ─────────────────────────────────────────────

function enforceLineAnimationOrder(elements: SceneElement[], slideRole: string): SceneElement[] {
  if (slideRole !== 'diagram') return elements

  const sectionDelays = elements
    .filter(el => el.type === 'section')
    .map(el => el.animationDelay ?? 0)

  const shapeDelays = elements
    .filter(el => el.type === 'shape')
    .map(el => el.animationDelay ?? 0)

  const maxSectionDelay = sectionDelays.length > 0 ? Math.max(...sectionDelays) : 0
  const maxShapeDelay   = shapeDelays.length   > 0 ? Math.max(...shapeDelays)   : 0
  const lineBaseDelay   = Math.max(maxSectionDelay, maxShapeDelay) + 500
  let   lineOffset      = 0

  return elements.map(el => {
    if (el.type !== 'line') return el
    const currentDelay = el.animationDelay ?? 0
    if (currentDelay >= lineBaseDelay) return el
    const corrected = lineBaseDelay + lineOffset
    lineOffset += 150
    return { ...el, animationDelay: corrected }
  })
}

// ─── Utility Helpers ─────────────────────────────────────────────────────────

function mapFontSize(size: string, role: string): number {
  const sizes: Record<string, number> = {
    xs: 12, sm: 16, md: 24, lg: 32, xl: 48, '2xl': 64, '3xl': 80, '4xl': 96
  }
  if (role === 'title') return sizes[size] || 54
  return sizes[size] || 24
}

function mapFontFamily(themeFont: string): string {
  const fonts: Record<string, string> = {
    inter:   'Inter',
    display: 'Outfit',
    mono:    'JetBrains Mono',
    serif:   'Playfair Display',
  }
  return fonts[themeFont] || 'Inter'
}

function ensureMs(val: number | null | undefined, fallback = 0): number {
  if (val === null || val === undefined) return fallback
  if (val > 0 && val < 20) return val * 1000
  return val
}
