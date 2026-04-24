import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps, type Edge } from '@xyflow/react'
import type { TransitionAnimation, CubicBezier } from '@motionslides/shared'

type TransitionEdgeData = {
  animation: TransitionAnimation
  duration: number
  ease: CubicBezier
  trigger: 'click' | 'auto'
  transitionId: string
}

type TransitionEdgeType = Edge<TransitionEdgeData, 'transitionEdge'>

const ANIMATION_LABELS: Record<TransitionAnimation, string> = {
  'slide-left': '← Slide',
  'slide-right': '→ Slide',
  'slide-up': '↑ Slide',
  'slide-down': '↓ Slide',
  fade: '◐ Fade',
  zoom: '⊕ Zoom',
  flip: '↻ Flip',
}

function TransitionEdgeComponent({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  data,
  selected,
}: EdgeProps<TransitionEdgeType>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY,
    targetX, targetY,
    sourcePosition, targetPosition,
  })

  const animation = data?.animation || 'fade'
  const duration = data?.duration || 500

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : '#555',
          strokeWidth: selected ? 2.5 : 1.5,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
        markerEnd="url(#proto-arrow)"
      />
      <EdgeLabelRenderer>
        <div
          className={`nodrag nopan absolute px-2 py-1 rounded-md text-[9px] font-medium pointer-events-auto cursor-pointer transition-all ${
            selected
              ? 'bg-blue-500/20 border border-blue-500 text-blue-300 shadow-lg shadow-blue-500/10'
              : 'bg-[#1a1a1a] border border-white/10 text-neutral-500 hover:text-neutral-300 hover:border-white/20'
          }`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {ANIMATION_LABELS[animation]} · {duration}ms
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const TransitionEdge = memo(TransitionEdgeComponent)
