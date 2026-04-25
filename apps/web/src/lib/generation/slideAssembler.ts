import type { Slide, SceneElement, TextContent, ShapeContent, CodeContent, AnimationType } from '@shared/types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@shared/canvas'
import { nanoid } from 'nanoid'
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
      const x = aiEl.position.col * CELL_W
      const y = aiEl.position.row * CELL_H
      const width  = aiEl.position.width * CELL_W
      const height = aiEl.position.height * CELL_H

      const common = {
        id:             aiEl.id || nanoid(),
        position:       { x, y },
        size:           { width, height },
        rotation:       0,
        opacity:        1,
        zIndex:         10,
        animation:      aiEl.animation as AnimationType,
        animationDelay: aiEl.animationDelay ?? 0,
      }

      switch (aiEl.type) {
        case 'text':
          return {
            ...common,
            type: 'text',
            content: {
              value:      aiEl.content,
              fontSize:   mapFontSize(aiEl.style?.fontSize || 'md', aiEl.role),
              fontWeight: aiEl.style?.fontWeight || (aiEl.role === 'title' ? 'bold' : 'normal'),
              fontFamily: mapFontFamily(generated.theme.fontFamily),
              fontStyle:  'normal',
              color:      aiEl.style?.color || generated.theme.textColor,
              align:      aiEl.style?.align || 'left',
            } as TextContent
          }

        case 'shape':
          return {
            ...common,
            type: 'shape',
            content: {
              shapeType: aiEl.shape === 'aws-icon' ? 'aws-icon' : (aiEl.shape || 'rectangle') as any,
              fill:      aiEl.style?.backgroundColor || generated.theme.primaryColor,
              stroke:    aiEl.style?.borderColor || generated.theme.accentColor,
              label:     aiEl.label,
              iconPath:  aiEl.iconPath,
            } as ShapeContent
          }

        case 'code':
          return {
            ...common,
            type: 'code',
            content: {
              value:    aiEl.code,
              language: aiEl.language || 'javascript',
            } as CodeContent
          }

        case 'line':
          // Lines are a bit special, they need to be handled by the line recalculator
          // but we provide the basic content here.
          return {
            ...common,
            type: 'line',
            content: {
              lineType: 'curved',
              x1: 0, y1: 0, x2: 1, y2: 1, // temporary, recalculateLines will fix
              style: aiEl.lineStyle || 'solid',
              arrow: aiEl.direction === 'one-way' ? 'end' : aiEl.direction === 'two-way' ? 'both' : 'none',
              color: generated.theme.accentColor,
              strokeWidth: 2,
              label: aiEl.label,
              startConnection: { elementId: aiEl.fromElementId, handleId: 'center' },
              endConnection:   { elementId: aiEl.toElementId,   handleId: 'center' },
            } as any
          }

        default:
          return null as any
      }
    }).filter(Boolean)

    return {
      id:         slideId,
      name:       aiSlide.title,
      background: aiSlide.background || generated.theme.backgroundColor,
      elements
    }
  })
}

function mapFontSize(size: string, role: string): number {
  const sizes: Record<string, number> = {
    xs: 12, sm: 16, md: 24, lg: 32, xl: 48, '2xl': 64, '3xl': 80, '4xl': 96
  }
  if (role === 'title') return sizes[size] || 64
  return sizes[size] || 24
}

function mapFontFamily(themeFont: string): string {
  const fonts: Record<string, string> = {
    inter:   'Inter',
    display: 'Outfit',
    mono:    'JetBrains Mono',
    serif:   'Playfair Display'
  }
  return fonts[themeFont] || 'Inter'
}
