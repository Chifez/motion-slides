import type { ShapeContent, ShapeType } from '@motionslides/shared'
import { SHAPE_OPTIONS } from '@/constants/editor'

const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-neutral-600 mb-2.5 block"

interface Props {
  content: ShapeContent
  onUpdate: (content: ShapeContent) => void
}

export function ShapeSection({ content, onUpdate }: Props) {
  return (
    <div className="px-3 py-3 border-b border-white/6">
      <span className={labelCls}>Shape</span>
      <select
        value={content.shapeType}
        onChange={(e) => onUpdate({ ...content, shapeType: e.target.value as ShapeType })}
        className="w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2 py-1.5 text-[12px] text-neutral-100 focus:outline-none focus:border-blue-500 mb-3"
      >
        {SHAPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Fill</span>
          <input type="color" value={content.fill} onChange={(e) => onUpdate({ ...content, fill: e.target.value })} className="w-full h-8 cursor-pointer border-none rounded-md bg-transparent" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Stroke</span>
          <input type="color" value={content.stroke} onChange={(e) => onUpdate({ ...content, stroke: e.target.value })} className="w-full h-8 cursor-pointer border-none rounded-md bg-transparent" />
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Label</span>
        <input
          type="text"
          value={content.label ?? ''}
          onChange={(e) => onUpdate({ ...content, label: e.target.value })}
          placeholder="e.g. API Server"
          className="w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2 py-1.5 text-[12px] text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  )
}
