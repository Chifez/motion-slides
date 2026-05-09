import React from 'react'
import type { Slide, SceneElement, TextContent, ShapeContent, SectionContent, LineContent } from '@motionslides/shared'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@motionslides/shared'

interface Props {
  slide: Slide
  className?: string
}

/**
 * A lightweight, static renderer for slide thumbnails.
 * Used to provide visual feedback during the AI generation process.
 * Consumes internal Slide structure (pixels) rather than raw AI JSON (normalized).
 */
export function StaticSlidePreview({ slide, className = '' }: Props) {
  return (
    <div 
      className={`relative w-full h-full overflow-hidden select-none pointer-events-none ${className}`}
      style={{ background: slide.background || '#000' }}
    >
      {slide.elements.map((el) => (
        <StaticElement key={el.id} element={el} allElements={slide.elements} />
      ))}
    </div>
  )
}

function StaticElement({ element, allElements }: { element: SceneElement, allElements: SceneElement[] }) {
  const { x, y } = element.position
  const { width: w, height: h } = element.size
  
  // Convert pixels to percentages for responsive thumbnail scaling
  const left   = (x / CANVAS_WIDTH) * 100
  const top    = (y / CANVAS_HEIGHT) * 100
  const width  = (w / CANVAS_WIDTH) * 100
  const height = (h / CANVAS_HEIGHT) * 100

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
    zIndex: element.type === 'section' ? 0 : 1,
  }

  switch (element.type) {
    case 'text': {
      const content = element.content as TextContent
      return (
        <div 
          style={{ 
            ...style, 
            color: content.color || 'inherit',
            fontSize: 'max(4px, 0.6em)', // Scale down font size for thumbnail
            display: 'flex',
            alignItems: 'center',
            justifyContent: content.align === 'center' ? 'center' : (content.align === 'right' ? 'flex-end' : 'flex-start'),
            textAlign: content.align || 'left',
            fontWeight: content.fontWeight === 'bold' ? 700 : 400,
            lineHeight: 1.2,
            padding: '2px',
          }}
        >
          <span className="truncate w-full leading-tight">{content.value}</span>
        </div>
      )
    }
    
    case 'shape': {
      const content = element.content as any
      return (
        <div 
          style={{ 
            ...style,
            backgroundColor: content.fill || '#3b82f6',
            border: `${content.strokeWidth || 1}px solid ${content.stroke || 'transparent'}`,
            borderRadius: content.shapeType === 'circle' ? '50%' : (content.shapeType === 'rounded-rectangle' ? '4px' : '0'),
            opacity: element.opacity ?? 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1px',
          }}
        >
          {content.label && (
            <span style={{ fontSize: '3px', color: '#fff', fontWeight: 600, textAlign: 'center', padding: '1px' }}>
              {content.label}
            </span>
          )}
        </div>
      )
    }

    case 'section': {
      const content = element.content as any
      return (
        <div 
          style={{ 
            ...style,
            backgroundColor: content.backgroundColor || 'rgba(255,255,255,0.05)',
            border: `${content.borderWidth || 0.5}px ${content.borderStyle || 'solid'} ${content.borderColor || 'rgba(255,255,255,0.1)'}`,
            borderRadius: `${content.cornerRadius || 4}px`,
          }}
        >
          {content.label && (
            <div className="absolute top-0.5 left-1 text-[3px] uppercase tracking-tighter opacity-40 font-bold text-white">
              {content.label}
            </div>
          )}
        </div>
      )
    }

    case 'line': {
      const content = element.content as any
      const fromEl = allElements.find(e => e.id === content.startConnection?.elementId)
      const toEl = allElements.find(e => e.id === content.endConnection?.elementId)
      
      if (!fromEl || !toEl) return null

      // Simplified line: straight between centers
      const x1 = ((fromEl.position.x + fromEl.size.width / 2) / CANVAS_WIDTH) * 100
      const y1 = ((fromEl.position.y + fromEl.size.height / 2) / CANVAS_HEIGHT) * 100
      const x2 = ((toEl.position.x + toEl.size.width / 2) / CANVAS_WIDTH) * 100
      const y2 = ((toEl.position.y + toEl.size.height / 2) / CANVAS_HEIGHT) * 100

      return (
        <svg 
          style={{ 
            position: 'absolute',
            left: 0, top: 0, width: '100%', height: '100%',
            overflow: 'visible',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <line 
            x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} 
            stroke={content.color || "rgba(255,255,255,0.3)"} 
            strokeWidth="0.5"
            strokeDasharray={content.style === 'dashed' ? '2,2' : 'none'}
          />
        </svg>
      )
    }

    default:
      return null
  }
}
