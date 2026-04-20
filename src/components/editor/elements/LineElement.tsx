import React from 'react'
import { motion } from 'framer-motion'
import type { LineContent } from '@/types'
import { useMotionContext } from '@/context/MotionContext'
import { CODE_PHASE } from '@/lib/motionEngine'
import { getArrow } from 'perfect-arrows'

interface Props { content: LineContent }

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
      // Primary branch
      const midX = (x1 + x2) / 2
      path += ` L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`
      
      // Additional branches
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

/**
 * LineElement — renders an animated SVG path.
 *
 * During a slide transition the visible `motion.path` animates:
 *   - `d` (path shape) using the Phase 1 easing — same as all morphing elements
 *   - `stroke` (color) cross-fades simultaneously
 *   - `strokeWidth` interpolates smoothly
 *
 * The hit-area path is a plain SVG element (no animation needed).
 */
export function LineElement({ content }: Props) {
  const { isTransitioning, durationSec } = useMotionContext()
  const EASE_IN_OUT: [number, number, number, number] = [0.37, 0, 0.63, 1]

  const pathTransition = isTransitioning
    ? {
        d: { duration: durationSec, ease: EASE_IN_OUT },
        stroke: { duration: durationSec * 0.6, ease: EASE_IN_OUT },
        strokeWidth: { duration: durationSec, ease: EASE_IN_OUT },
      }
    : { duration: 0 }

  const w = 100
  const h = 100

  // 1. Get all unique colors for markers
  const uniqueColors = Array.from(new Set([
    content.color,
    ...(content.branches?.map(b => b.color).filter(Boolean) as string[] || [])
  ]))

  // 2. Main path logic (without branches)
  const mainD = buildLinePath(w, h, { ...content, branches: undefined })
  
  return (
    <svg
      viewBox={`-2 -2 ${w + 4} ${h + 4}`}
      preserveAspectRatio="none"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <defs>
        {uniqueColors.map(color => (
          <React.Fragment key={color}>
            <marker
              id={`arrow-end-${color.replace('#', '')}`}
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L8,3 z" fill={color} />
            </marker>
            <marker
              id={`arrow-start-${color.replace('#', '')}`}
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto-start-reverse"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L8,3 z" fill={color} />
            </marker>
          </React.Fragment>
        ))}
      </defs>

      {/* Main Path Hit Area */}
      <path
        d={mainD}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(12, content.strokeWidth * 4)}
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        vectorEffect="non-scaling-stroke"
      />

      {/* Main Path */}
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
        markerEnd={content.arrow !== 'none' ? `url(#arrow-end-${content.color.replace('#', '')})` : undefined}
        markerStart={content.arrow === 'both' ? `url(#arrow-start-${content.color.replace('#', '')})` : undefined}
        vectorEffect="non-scaling-stroke"
        animate={{ d: mainD, stroke: content.color, strokeWidth: content.strokeWidth }}
        transition={pathTransition}
      />

      {/* Main Label */}
      {content.label && (
        <LabelGroup 
          text={content.label} 
          x={(content.x1 + content.x2) / 2 * w} 
          y={(content.y1 + content.y2) / 2 * h} 
        />
      )}

      {/* Branches */}
      {content.lineType === 'branching' && content.branches?.map((b, i) => {
        const bx = b.x * w
        const by = b.y * h
        const x1 = content.x1 * w
        const y1 = content.y1 * h
        const bmidX = (x1 + bx) / 2
        const branchD = `M ${x1} ${y1} L ${bmidX} ${y1} L ${bmidX} ${by} L ${bx} ${by}`
        const branchColor = b.color || content.color
        const branchStyle = b.style || content.style

        return (
          <React.Fragment key={i}>
            {/* Hit Area */}
            <path
              d={branchD}
              fill="none"
              stroke="transparent"
              strokeWidth={Math.max(12, content.strokeWidth * 4)}
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              vectorEffect="non-scaling-stroke"
            />
            {/* Branch Path */}
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
              markerEnd={content.arrow !== 'none' ? `url(#arrow-end-${branchColor.replace('#', '')})` : undefined}
              vectorEffect="non-scaling-stroke"
              animate={{ d: branchD, stroke: branchColor, strokeWidth: content.strokeWidth }}
              transition={pathTransition}
            />
            {/* Branch Label */}
            {b.label && (
              <LabelGroup 
                text={b.label} 
                x={bx} 
                y={by - 15} 
              />
            )}
          </React.Fragment>
        )
      })}
    </svg>
  )
}

function LabelGroup({ text, x, y }: { text: string, x: number, y: number }) {
  return (
    <g>
      <rect
        x={x - text.length * 3 - 4}
        y={y - 9}
        width={text.length * 6 + 8}
        height={18}
        rx={4}
        fill="#1a1a1a"
        fillOpacity={0.92}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={0.5}
      />
      <text
        x={x}
        y={y + 4}
        fill="#a3a3a3"
        fontSize="10"
        fontFamily="Inter, sans-serif"
        textAnchor="middle"
      >
        {text}
      </text>
    </g>
  )
}

// Re-export CODE_PHASE so callers don't need a second import
export { CODE_PHASE }
