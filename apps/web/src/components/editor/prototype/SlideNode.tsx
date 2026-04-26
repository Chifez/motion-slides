import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { Slide } from '@motionslides/shared'

type SlideNodeData = {
  slide: Slide
  index: number
  isActive: boolean
}

type SlideNodeType = Node<SlideNodeData, 'slideNode'>

function SlideNodeComponent({ data, selected }: NodeProps<SlideNodeType>) {
  const { slide, index, isActive } = data

  return (
    <div
      className={`rounded-lg overflow-hidden border-2 transition-all shadow-xl bg-(--ms-bg-elevated) ${
        selected ? 'border-blue-500 shadow-blue-500/20' : isActive ? 'border-blue-400/50' : 'border-(--ms-border) hover:border-(--ms-border-strong)'
      }`}
      style={{ width: 240 }}
    >
      {/* Slide preview */}
      <div
        className="w-full aspect-video flex items-center justify-center relative"
        style={{ background: slide.background || '#0a0a0a' }}
      >
        <span className="absolute top-1.5 left-2 text-[9px] text-white/30 font-semibold">{index + 1}</span>
        <div className="text-[10px] text-neutral-600">
          {slide.elements.length > 0
            ? `${slide.elements.length} element${slide.elements.length > 1 ? 's' : ''}`
            : 'Empty'}
        </div>
      </div>

      {/* Label */}
      <div className="px-2.5 py-1.5 flex items-center justify-between border-t border-(--ms-border)">
        <span className="text-[10px] text-(--ms-text-muted) font-medium truncate">
          {slide.name || `Slide ${index + 1}`}
        </span>
      </div>

      {/* Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5! h-2.5! bg-blue-500! border-2! border-blue-300! rounded-full!"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5! h-2.5! bg-purple-500! border-2! border-purple-300! rounded-full!"
      />
    </div>
  )
}

export const SlideNode = memo(SlideNodeComponent)
