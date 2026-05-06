import { memo } from 'react'
import type { SectionContent } from '@motionslides/shared'

interface Props {
  content: SectionContent
  onUpdate: (updates: Partial<SectionContent>) => void
}

const labelCls = "block text-[10px] font-medium text-(--ms-text-muted) mb-1.5 uppercase tracking-wider"
const inputCls = "w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-md px-2 py-1.5 text-xs text-(--ms-text-primary) focus:outline-none focus:border-blue-500 transition-colors"

export const SectionSection = memo(function SectionSection({ content, onUpdate }: Props) {
  return (
    <div className="space-y-4 px-3 py-3">
      {/* Label */}
      <div>
        <label className={labelCls}>Label</label>
        <input
          type="text"
          value={content.label || ''}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="e.g. Data Tier"
          className={inputCls}
        />
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Background</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={content.backgroundColor.startsWith('#') ? content.backgroundColor : '#3b82f6'}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-(--ms-border) bg-transparent"
            />
            <span className="text-[10px] text-(--ms-text-muted) font-mono">Fill</span>
          </div>
        </div>
        <div>
          <label className={labelCls}>Border</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={content.borderColor.startsWith('#') ? content.borderColor : '#3b82f6'}
              onChange={(e) => onUpdate({ borderColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-(--ms-border) bg-transparent"
            />
            <span className="text-[10px] text-(--ms-text-muted) font-mono">Stroke</span>
          </div>
        </div>
      </div>

      {/* Border Style */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Style</label>
          <select
            value={content.borderStyle}
            onChange={(e) => onUpdate({ borderStyle: e.target.value as any })}
            className={inputCls}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="none">None</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Radius</label>
          <input
            type="number"
            value={content.cornerRadius}
            onChange={(e) => onUpdate({ cornerRadius: Number(e.target.value) })}
            min={0}
            max={40}
            className={inputCls}
          />
        </div>
      </div>
    </div>
  )
})
