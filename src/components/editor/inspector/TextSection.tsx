import type { TextContent } from '@/types'
import { PropPair } from '@/components/ui/PropPair'

const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-neutral-600 mb-2.5 block"

interface Props {
  content: TextContent
  onUpdate: (content: TextContent) => void
}

export function TextSection({ content, onUpdate }: Props) {
  return (
    <div className="px-3 py-3 border-b border-white/6">
      <span className={labelCls}>Text</span>
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
      <textarea
        value={content.value}
        onChange={(e) => onUpdate({ ...content, value: e.target.value })}
        className="w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2.5 py-2 text-[12px] text-neutral-100 focus:outline-none focus:border-blue-500 resize-y min-h-[56px] font-sans"
      />
    </div>
  )
}
