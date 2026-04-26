import type { ShapeContent, ShapeType } from '@motionslides/shared'
import { SHAPE_OPTIONS } from '@/constants/editor'
import { IconLibrarySection } from './IconLibrarySection'

const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-(--ms-text-muted) mb-2.5 block"

interface Props {
  content: ShapeContent
  onUpdate: (content: ShapeContent) => void
}

export function ShapeSection({ content, onUpdate }: Props) {
  const isIcon = content.shapeType === 'aws-icon' || content.shapeType === 'gcp-icon'

  return (
    <div className="px-3 py-3 border-b border-(--ms-border)">
      <span className={labelCls}>Shape</span>
      <select
        value={content.shapeType}
        onChange={(e) => onUpdate({ ...content, shapeType: e.target.value as ShapeType })}
        className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-md px-2 py-1.5 text-[12px] text-(--ms-text-primary) focus:outline-none focus:border-blue-500 mb-3 transition-colors"
      >
        {SHAPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {isIcon && (
        <div className="mb-4">
          <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider mb-2 block">Icon Library</span>
          <IconLibrarySection content={content} onUpdate={onUpdate} />
        </div>
      )}

      {!isIcon && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider">Fill</span>
            <input type="color" value={content.fill} onChange={(e) => onUpdate({ ...content, fill: e.target.value })} className="w-full h-8 cursor-pointer border-none rounded-md bg-transparent" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider">Stroke</span>
            <input type="color" value={content.stroke} onChange={(e) => onUpdate({ ...content, stroke: e.target.value })} className="w-full h-8 cursor-pointer border-none rounded-md bg-transparent" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-0.5 mt-3">
        <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider">Label</span>
        <input
          type="text"
          value={content.label ?? ''}
          onChange={(e) => onUpdate({ ...content, label: e.target.value })}
          placeholder={isIcon ? "Icon label" : "e.g. API Server"}
          className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-md px-2 py-1.5 text-[12px] text-(--ms-text-primary) placeholder-(--ms-text-muted) focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>
    </div>
  )
}

