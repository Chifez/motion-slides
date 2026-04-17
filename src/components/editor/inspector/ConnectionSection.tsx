import { Trash2 } from 'lucide-react'
import type { Connection } from '@/types'

const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-neutral-600 mb-2.5 block"
const selectCls = "w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2 py-1.5 text-[12px] text-neutral-100 focus:outline-none focus:border-blue-500"

interface Props {
  connection: Connection
  onUpdate: (updates: Partial<Connection>) => void
  onDelete: () => void
}

export function ConnectionSection({ connection, onUpdate, onDelete }: Props) {
  return (
    <div className="px-3 py-3 border-b border-white/6">
      <div className="flex items-center justify-between mb-3">
        <span className={labelCls.replace(' mb-2.5', '')}>Connection</span>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer border-none bg-transparent"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Label */}
      <div className="mb-2">
        <span className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Label</span>
        <input
          type="text"
          value={connection.label ?? ''}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="e.g. REST API"
          className="w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2 py-1.5 text-[12px] text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Line Style */}
      <div className="mb-2">
        <span className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Line Style</span>
        <div className="flex gap-1">
          {(['solid', 'dashed', 'dotted'] as const).map((s) => (
            <button
              key={s}
              onClick={() => onUpdate({ style: s })}
              className={`flex-1 text-[10px] py-1.5 rounded-md border transition-colors cursor-pointer capitalize ${
                connection.style === s
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
          value={connection.arrow}
          onChange={(e) => onUpdate({ arrow: e.target.value as Connection['arrow'] })}
          className={selectCls}
        >
          <option value="none">None</option>
          <option value="end">End →</option>
          <option value="both">Both ↔</option>
        </select>
      </div>

      {/* Color + Stroke Width */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Color</span>
          <input
            type="color"
            value={connection.color || '#808080'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-full h-8 rounded-md cursor-pointer border-none bg-transparent"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Width</span>
          <select
            value={connection.strokeWidth || 1.5}
            onChange={(e) => onUpdate({ strokeWidth: +e.target.value })}
            className={selectCls}
          >
            <option value={1}>Thin (1px)</option>
            <option value={1.5}>Default (1.5px)</option>
            <option value={2}>Medium (2px)</option>
            <option value={3}>Thick (3px)</option>
            <option value={4}>Heavy (4px)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
