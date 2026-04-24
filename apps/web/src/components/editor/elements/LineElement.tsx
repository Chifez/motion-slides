import React from 'react'
import { motion } from 'framer-motion'
import type { LineContent, SceneElement } from '@motionslides/shared'
import { useMotionContext } from '@/context/MotionContext'
import { CODE_PHASE } from '@/lib/motionEngine'
import { getArrow } from 'perfect-arrows'

interface Props { element: SceneElement }

/** Compute SVG path for a line within its bounding box */
function buildLinePath(w: number, h: number, content: LineContent): string {
  const x1 = content.x1 * w
  const y1 = content.y1 * h
  const x2 = content.x2 * w
  const y2 = content.y2 * h

  switch (content.lineType) {
    case 'straight':
      return `M ${x1} ${y1} L ${x2} ${y2}`
    case 'elbow': {
      const midX = (x1 + x2) / 2
      return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`
    }
    case 'curved': {
      const arrow = getArrow(x1, y1, x2, y2, {
        bow: 0.2,
        stretch: 0.5,
        padStart: 0,
        padEnd: 0,
        straights: false,
      })
      const [sx, sy, cx, cy, ex, ey] = arrow
      return `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`
    }
    case 'step-after':
      return `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`
    case 'step-before':
      return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`
    case 'branching': {
      let path = `M ${x1} ${y1}`
      const midX = (x1 + x2) / 2
      path += ` L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`
      
      if (content.branches) {
        content.branches.forEach(b => {
          const bx = b.x * w
          const by = b.y * h
          const bmidX = (x1 + bx) / 2
          path += ` M ${x1} ${y1} L ${bmidX} ${y1} L ${bmidX} ${by} L ${bx} ${by}`
        })
      }
      return path
    }
    default:
      return `M ${x1} ${y1} L ${x2} ${y2}`
  }
}

export function LineElement({ element }: Props) {
  const content = element.content as LineContent
  const { isTransitioning, durationSec } = useMotionContext()
  const EASE_IN_OUT: [number, number, number, number] = [0.37, 0, 0.63, 1]

  const pathTransition = isTransitioning
    ? {
        d: { duration: durationSec, ease: EASE_IN_OUT },
        stroke: { duration: durationSec * 0.6, ease: EASE_IN_OUT },
        strokeWidth: { duration: durationSec, ease: EASE_IN_OUT },
      }
    : { duration: 0 }

  // Use actual pixel dimensions to prevent squashing
  const w = element.size.width
  const h = element.size.height

  const uniqueColors = Array.from(new Set([
    content.color,
    ...(content.branches?.map(b => b.color).filter(Boolean) as string[] || [])
  ]))

  const sanitizeId = (c: string) => c.replace(/[^a-zA-Z0-9]/g, '')
  const isFork = content.lineType === 'branching'
  const mainD = buildLinePath(w, h, { ...content, branches: undefined })
  
  return (
    <svg
      viewBox={`-50 -50 ${w + 100} ${h + 100}`}
      style={{
        position: 'absolute',
        left: -50,
        top: -50,
        width: w + 100,
        height: h + 100,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <defs>
        {uniqueColors.map(color => (
          <React.Fragment key={color}>
            <marker
              id={`arrow-end-${sanitizeId(color)}`}
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="6"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L0,12 L12,6 z" fill={color} />
            </marker>
            <marker
              id={`arrow-start-${sanitizeId(color)}`}
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="6"
              orient="auto-start-reverse"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L0,12 L12,6 z" fill={color} />
            </marker>
          </React.Fragment>
        ))}
      </defs>

      {!isFork && (
        <>
          <path
            d={mainD}
            fill="none"
            stroke="transparent"
            strokeWidth={Math.max(12, content.strokeWidth * 4)}
            style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
          />
          <motion.path
            d={mainD}
            fill="none"
            stroke={content.color}
            strokeWidth={content.strokeWidth}
            strokeDasharray={
              content.style === 'dashed' ? '8 5'
              : content.style === 'dotted' ? '2 4'
              : undefined
            }
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={content.arrow !== 'none' ? `url(#arrow-end-${sanitizeId(content.color)})` : undefined}
            markerStart={content.arrow === 'both' ? `url(#arrow-start-${sanitizeId(content.color)})` : undefined}
            animate={{ d: mainD, stroke: content.color, strokeWidth: content.strokeWidth }}
            transition={pathTransition}
          />
          {content.label && (
            <LabelGroup 
              text={content.label} 
              x={(content.x1 + content.x2) / 2 * w} 
              y={(content.y1 + content.y2) / 2 * h} 
              fontSize={content.labelFontSize || 10}
            />
          )}
        </>
      )}

      {isFork && content.branches?.map((b, i) => {
        const bx = b.x * w
        const by = b.y * h
        const x1 = content.x1 * w
        const y1 = content.y1 * h
        const bmidX = (x1 + bx) / 2
        const branchD = `M ${x1} ${y1} L ${bmidX} ${y1} L ${bmidX} ${by} L ${bx} ${by}`
        
        const branchColor = b.color || content.color
        const branchStyle = b.style || content.style
        const hasArrow = b.arrow === 'end' || (b.arrow === undefined && content.arrow !== 'none')

        const lx = bmidX
        const ly = (y1 + by) / 2

        return (
          <React.Fragment key={i}>
            <path
              d={branchD}
              fill="none"
              stroke="transparent"
              strokeWidth={Math.max(12, content.strokeWidth * 4)}
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
            />
            <motion.path
              d={branchD}
              fill="none"
              stroke={branchColor}
              strokeWidth={content.strokeWidth}
              strokeDasharray={
                branchStyle === 'dashed' ? '8 5'
                : branchStyle === 'dotted' ? '2 4'
                : undefined
              }
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={hasArrow ? `url(#arrow-end-${sanitizeId(branchColor)})` : undefined}
              animate={{ d: branchD, stroke: branchColor, strokeWidth: content.strokeWidth }}
              transition={pathTransition}
            />
            {b.label && (
              <LabelGroup 
                text={b.label} 
                x={lx} 
                y={ly} 
                fontSize={b.labelFontSize || content.labelFontSize || 10}
              />
            )}
          </React.Fragment>
        )
      })}
    </svg>
  )
}

function LabelGroup({ text, x, y, fontSize }: { text: string, x: number, y: number, fontSize: number }) {
  const charWidth = fontSize * 0.6
  const padding = 8
  const width = text.length * charWidth + padding
  const height = fontSize + padding

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={4}
        fill="#1a1a1a"
        fillOpacity={0.92}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={0.5}
      />
      <text
        x={x}
        y={y}
        fill="#a3a3a3"
        fontSize={fontSize}
        fontFamily="Inter, sans-serif"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {text}
      </text>
    </g>
  )
}

// Re-export CODE_PHASE so callers don't need a second import
export { CODE_PHASE }
