import { Italic } from 'lucide-react'
import type { TextContent } from '@motionslides/shared'
import { FONT_FAMILIES } from '@/constants/editor'
import { PropPair } from '@/components/ui/PropPair'

const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-neutral-600 mb-2.5 block"
const selectCls = "w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2 py-1.5 text-[12px] text-neutral-100 focus:outline-none focus:border-blue-500"

interface Props {
  content: TextContent
  onUpdate: (content: TextContent) => void
}

export function TextSection({ content, onUpdate }: Props) {
  return (
    <div className="px-3 py-3 border-b border-white/6">
      <span className={labelCls}>Text</span>

      {/* Font Family */}
      <div className="mb-2">
        <span className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Font</span>
        <select
          value={content.fontFamily || 'Inter'}
          onChange={(e) => onUpdate({ ...content, fontFamily: e.target.value })}
          className={selectCls}
          style={{ fontFamily: `"${content.fontFamily || 'Inter'}", sans-serif` }}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: `"${f.value}", ${f.category}` }}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Weight + Style row */}
      <div className="grid grid-cols-[1fr_auto] gap-2 mb-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Weight</span>
          <select
            value={content.fontWeight}
            onChange={(e) => onUpdate({ ...content, fontWeight: e.target.value as TextContent['fontWeight'] })}
            className={selectCls}
          >
            <option value="normal">Regular</option>
            <option value="medium">Medium</option>
            <option value="semibold">Semibold</option>
            <option value="bold">Bold</option>
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Style</span>
          <button
            onClick={() => onUpdate({ ...content, fontStyle: content.fontStyle === 'italic' ? 'normal' : 'italic' })}
            className={`h-[30px] w-[30px] flex items-center justify-center rounded-md border transition-colors cursor-pointer ${
              content.fontStyle === 'italic'
                ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                : 'border-white/8 bg-[#1c1c1c] text-neutral-400 hover:text-neutral-100'
            }`}
            title="Toggle italic"
          >
            <Italic size={13} />
          </button>
        </div>
      </div>

      {/* Color + Size row */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Color</span>
          <input
            type="color"
            value={content.color}
            onChange={(e) => onUpdate({ ...content, color: e.target.value })}
            className="w-full h-8 rounded-md cursor-pointer border-none bg-transparent"
          />
        </div>
        <PropPair label="Font Size" value={content.fontSize} onChange={(v) => onUpdate({ ...content, fontSize: v })} />
      </div>

      {/* Alignment */}
      <div className="flex gap-1 mb-2">
        {(['left', 'center', 'right'] as const).map((a) => (
          <button
            key={a}
            onClick={() => onUpdate({ ...content, align: a })}
            className={`flex-1 text-[10px] py-1 rounded-md border transition-colors cursor-pointer capitalize ${
              content.align === a
                ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                : 'border-white/8 bg-[#1c1c1c] text-neutral-500 hover:text-neutral-100'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <textarea
        value={content.value}
        onChange={(e) => onUpdate({ ...content, value: e.target.value })}
        className="w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2.5 py-2 text-[12px] text-neutral-100 focus:outline-none focus:border-blue-500 resize-y min-h-[56px] font-sans"
      />
    </div>
  )
}
