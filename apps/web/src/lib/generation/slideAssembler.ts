import type { Slide, SceneElement, TextContent, ShapeContent, CodeContent, AnimationType } from '@motionslides/shared'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants/export'
import { nanoid } from '../nanoid'
import type { GeneratedPresentation, AISlideType, AIElementType } from './slideGenerationSchema'

const CELL_W = CANVAS_WIDTH / 12
const CELL_H = CANVAS_HEIGHT / 8

/**
 * assembleSlides
 * 
 * Maps the AI-generated presentation structure into our internal Slide[] format.
 * Performs coordinate conversion and basic validation.
 */
export function assembleSlides(generated: GeneratedPresentation): Slide[] {
  return generated.slides.map(aiSlide => {
    const slideId = aiSlide.id || nanoid()

    const elements: SceneElement[] = aiSlide.elements.map(aiEl => {
      const pos = 'position' in aiEl ? aiEl.position : { col: 0, row: 0, width: 1, height: 1 }
      const x = pos.col * CELL_W
      const y = pos.row * CELL_H
      const width = pos.width * CELL_W
      const height = pos.height * CELL_H

      const common = {
        id: aiEl.id || nanoid(),
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
              shapeType: aiEl.shape === 'aws-icon' ? 'aws-icon' : (aiEl.shape || 'rectangle') as any,
              fill: aiEl.style?.backgroundColor ?? generated.theme.primaryColor,
              stroke: aiEl.style?.borderColor ?? generated.theme.accentColor,
              label: aiEl.label ?? undefined,
              iconPath: aiEl.iconPath ?? undefined,
            } as ShapeContent
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
              lineType: 'curved',
              x1: 0, y1: 0, x2: 1, y2: 1,
              style: aiEl.lineStyle ?? 'solid',
              arrow: aiEl.direction === 'one-way' ? 'end' : aiEl.direction === 'two-way' ? 'both' : 'none',
              color: generated.theme.accentColor,
              strokeWidth: 2,
              label: aiEl.label ?? undefined,
              startConnection: { elementId: aiEl.fromElementId, handleId: 'center' },
              endConnection: { elementId: aiEl.toElementId, handleId: 'center' },
            } as any
          }

        default:
          return null as any
      }
    }).filter(Boolean)

    const transition = aiSlide.transition ? {
      type: aiSlide.transition.type as any,
      duration: ensureMs(aiSlide.transition.duration, 500),
      easing: aiSlide.transition.easing ?? 'easeInOut',
    } : undefined

    return {
      id: slideId,
      name: aiSlide.title,
      background: aiSlide.background ?? generated.theme.backgroundColor,
      elements,
      transition
    }
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

/**
 * Ensures a time value is in milliseconds.
 * If the AI provides a value like 0.5 or 1, we assume it's seconds and convert.
 */
function ensureMs(val: number | null | undefined, fallback = 0): number {
  if (val === null || val === undefined) return fallback
  if (val > 0 && val < 20) return val * 1000
  return val
}
