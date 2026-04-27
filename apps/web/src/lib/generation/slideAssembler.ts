import type { Slide, SceneElement, TextContent, ShapeContent, CodeContent, AnimationType } from '@motionslides/shared'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants/export'
import { uuid } from '../uuid'
import type { GeneratedPresentation, AISlideType, AIElementType } from './slideGenerationSchema'
import { resolveIconPath } from './iconResolver'

const CELL_W = CANVAS_WIDTH / 12
const CELL_H = CANVAS_HEIGHT / 8

/**
 * assembleSlides
 * 
 * Maps the AI-generated presentation structure into our internal Slide[] format.
 * Performs coordinate conversion and basic validation.
 */
export function assembleSlides(generated: GeneratedPresentation): Slide[] {
  const theme = generated.theme

  return generated.slides.map(aiSlide => {
    const slideId = aiSlide.id || uuid()

    const elements: SceneElement[] = aiSlide.elements.map(aiEl => {
      const pos = 'position' in aiEl ? aiEl.position : { col: 0, row: 0, width: 1, height: 1 }
      const col = pos.col
      const row = pos.row
      const clampedWidth = Math.min(pos.width, 12 - col)
      const clampedHeight = Math.min(pos.height, 8 - row)
      
      const x = col * CELL_W
      const y = row * CELL_H
      const width = Math.max(1, clampedWidth) * CELL_W
      const height = Math.max(1, clampedHeight) * CELL_H

      const common = {
        id: aiEl.id || uuid(),
        position: { x, y },
        size: { width, height },
        rotation: 0,
        opacity: 1,
        zIndex: 10,
        animation: (aiEl.animation ?? 'none') as AnimationType,
        animationDelay: ensureMs(aiEl.animationDelay, 0),
      }

      switch (aiEl.type) {
        case 'text':
          return {
            ...common,
            type: 'text',
            content: {
              value: aiEl.content,
              fontSize: mapFontSize(aiEl.style?.fontSize ?? 'md', aiEl.role),
              fontWeight: aiEl.style?.fontWeight ?? (aiEl.role === 'title' ? 'bold' : 'normal'),
              fontFamily: mapFontFamily(generated.theme.fontFamily),
              fontStyle: 'normal',
              color: aiEl.style?.color ?? generated.theme.textColor,
              align: aiEl.style?.align ?? 'left',
            } as TextContent
          }

        case 'shape':
          return {
            ...common,
            type: 'shape',
            content: {
              shapeType: (aiEl.shape || 'rectangle') as any,
              fill: aiEl.style?.backgroundColor ?? generated.theme.primaryColor,
              stroke: aiEl.style?.borderColor ?? generated.theme.accentColor,
              label: aiEl.label ?? undefined,
            } as ShapeContent
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
              } as any
            }
          } else {
            return {
              ...common,
              type: 'shape',
              content: {
                shapeType: resolved.fallback,
                label:     aiEl.label ?? '',
                fill:      theme.primaryColor,
                stroke:    theme.secondaryColor,
                strokeWidth: 2,
                opacity:   1,
              } as ShapeContent
            }
          }
        }

        case 'code':
          return {
            ...common,
            type: 'code',
            content: {
              value: aiEl.code,
              language: aiEl.language || 'javascript',
            } as CodeContent
          }

        case 'line':
          return {
            ...common,
            type: 'line',
            zIndex: 5, // Lines behind shapes
            content: {
              lineType: aiEl.lineType ?? 'curved',
              x1: 0, y1: 0, x2: 1, y2: 1,
              style: aiEl.lineStyle ?? 'solid',
              arrow: aiEl.direction === 'one-way' ? 'end' : aiEl.direction === 'two-way' ? 'both' : 'none',
              color: theme.accentColor,
              strokeWidth: 2,
              label: aiEl.label ?? undefined,
              startConnection: { elementId: aiEl.fromElementId, handleId: aiEl.fromHandle ?? 'center' },
              endConnection: { elementId: aiEl.toElementId, handleId: aiEl.toHandle ?? 'center' },
            } as any
          }

        default:
          return null as any
      }
    }).filter(Boolean)

    const elementsWithFixedAnims = enforceLineAnimationOrder(elements, aiSlide.role)

    const transition = aiSlide.transition ? {
      type: aiSlide.transition.type as any,
      duration: ensureMs(aiSlide.transition.duration, 500),
      easing: aiSlide.transition.easing ?? 'easeInOut',
    } : undefined

    return {
      id: slideId,
      name: aiSlide.title,
      background: aiSlide.background ?? generated.theme.backgroundColor,
      elements: elementsWithFixedAnims,
      transition
    }
  })
}

function enforceLineAnimationOrder(elements: SceneElement[], slideRole: string): SceneElement[] {
  if (slideRole !== 'diagram') return elements

  const shapeDelays = elements
    .filter(el => el.type === 'shape')
    .map(el => el.animationDelay ?? 0)

  if (shapeDelays.length === 0) return elements

  const maxShapeDelay = Math.max(...shapeDelays)
  const lineBaseDelay = maxShapeDelay + 500
  let   lineOffset    = 0

  return elements.map(el => {
    if (el.type !== 'line') return el
    const currentDelay = el.animationDelay ?? 0
    if (currentDelay >= lineBaseDelay) return el
    const corrected = lineBaseDelay + lineOffset
    lineOffset += 150
    return { ...el, animationDelay: corrected }
  })
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
    inter: 'Inter',
    display: 'Outfit',
    mono: 'JetBrains Mono',
    serif: 'Playfair Display'
  }
  return fonts[themeFont] || 'Inter'
}

function ensureMs(val: number | null | undefined, fallback = 0): number {
  if (val === null || val === undefined) return fallback
  if (val > 0 && val < 20) return val * 1000
  return val
}
