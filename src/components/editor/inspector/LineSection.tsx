import { Trash2 } from 'lucide-react'
import type { LineContent, LineType } from '@/types'
import { LINE_TYPE_OPTIONS } from '@/constants/editor'

const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-neutral-600 mb-2.5 block"
const selectCls = "w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2 py-1.5 text-[12px] text-neutral-100 focus:outline-none focus:border-blue-500"

interface Props {
  content: LineContent
  onUpdate: (content: LineContent) => void
  onDelete?: () => void
}

export function LineSection({ content, onUpdate, onDelete }: Props) {
  return (
    <div className="px-3 py-3 border-b border-white/6">
      <div className="flex items-center justify-between mb-3">
        <span className={labelCls.replace(' mb-2.5', '')}>Line</span>
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer border-none bg-transparent"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Line Type */}
      <div className="mb-2">
        <span className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Type</span>
        <div className="flex gap-1">
          {LINE_TYPE_OPTIONS.map((lt) => (
            <button
              key={lt.value}
              onClick={() => onUpdate({ ...content, lineType: lt.value as LineType })}
              className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 rounded-md border transition-colors cursor-pointer ${
                content.lineType === lt.value
                  ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                  : 'border-white/8 bg-[#1c1c1c] text-neutral-500 hover:text-neutral-100'
              }`}
            >
              <span className="text-sm">{lt.icon}</span>
              {lt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Line Style */}
      <div className="mb-2">
        <span className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Style</span>
        <div className="flex gap-1">
          {(['solid', 'dashed', 'dotted'] as const).map((s) => (
            <button
              key={s}
              onClick={() => onUpdate({ ...content, style: s })}
              className={`flex-1 text-[10px] py-1.5 rounded-md border transition-colors cursor-pointer capitalize ${
                content.style === s
                  ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                  : 'border-white/8 bg-[#1c1c1c] text-neutral-500 hover:text-neutral-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Arrow */}
      <div className="mb-2">
        <span className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Arrow</span>
        <select
          value={content.arrow}
          onChange={(e) => onUpdate({ ...content, arrow: e.target.value as LineContent['arrow'] })}
          className={selectCls}
        >
          <option value="none">None</option>
          <option value="end">End →</option>
          <option value="both">Both ↔</option>
        </select>
      </div>

      {/* Color + Width */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Color</span>
          <input
            type="color"
            value={content.color.startsWith('rgba') ? '#808080' : content.color}
            onChange={(e) => onUpdate({ ...content, color: e.target.value })}
            className="w-full h-8 rounded-md cursor-pointer border-none bg-transparent"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Width</span>
          <select
            value={content.strokeWidth}
            onChange={(e) => onUpdate({ ...content, strokeWidth: +e.target.value })}
            className={selectCls}
          >
            <option value={1}>Thin (1px)</option>
            <option value={2}>Default (2px)</option>
            <option value={3}>Medium (3px)</option>
            <option value={4}>Thick (4px)</option>
            <option value={6}>Heavy (6px)</option>
          </select>
        </div>
      </div>

      {/* Label */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Label</span>
        <input
          type="text"
          value={content.label ?? ''}
          onChange={(e) => onUpdate({ ...content, label: e.target.value })}
          placeholder="e.g. REST API"
          className="w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2 py-1.5 text-[12px] text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  )
}
