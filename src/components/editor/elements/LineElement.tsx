import { motion } from 'framer-motion'
import type { LineContent } from '@/types'
import { useMotionContext } from '@/context/MotionContext'

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
      const cx1 = x1 + (x2 - x1) * 0.4
      const cy1 = y1
      const cx2 = x2 - (x2 - x1) * 0.4
      const cy2 = y2
      return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`
    }
    default:
      return `M ${x1} ${y1} L ${x2} ${y2}`
  }
}

export function LineElement({ content }: Props) {
  const { durationSec, ease } = useMotionContext()

  // Use a generous viewBox — the SVG fills the element's bounding box
  const w = 100
  const h = 100
  const d = buildLinePath(w, h, content)
  const markerId = `arrow-${content.lineType}-${content.strokeWidth}`

  const pathTransition = {
    duration: durationSec,
    ease,
  }

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
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L8,3 z" fill={content.color} />
        </marker>
      </defs>

      {/* Hit area for interaction — transparent thick stroke */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(12, content.strokeWidth * 4)}
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        vectorEffect="non-scaling-stroke"
      />

      {/* Visible line — uses motion.path for smooth path morphing */}
      <motion.path
        d={d}
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
        markerEnd={content.arrow !== 'none' ? `url(#${markerId})` : undefined}
        markerStart={content.arrow === 'both' ? `url(#${markerId})` : undefined}
        vectorEffect="non-scaling-stroke"
        animate={{ d }}
        transition={pathTransition}
      />

      {/* Label at midpoint */}
      {content.label && (() => {
        const mx = (content.x1 + content.x2) / 2 * w
        const my = (content.y1 + content.y2) / 2 * h
        return (
          <g>
            <rect
              x={mx - content.label.length * 3 - 4}
              y={my - 9}
              width={content.label.length * 6 + 8}
              height={18}
              rx={4}
              fill="#1a1a1a"
              fillOpacity={0.92}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={0.5}
            />
            <text
              x={mx}
              y={my + 4}
              fill="#a3a3a3"
              fontSize="10"
              fontFamily="Inter, sans-serif"
              textAnchor="middle"
            >
              {content.label}
            </text>
          </g>
        )
      })()}
    </svg>
  )
}
