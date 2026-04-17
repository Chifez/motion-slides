import type { CodeContent } from '@/types'
import { CODE_LANGUAGES } from '@/constants/editor'

const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-neutral-600 mb-2.5 block"

interface Props {
  content: CodeContent
  onUpdate: (content: CodeContent) => void
}

export function CodeSection({ content, onUpdate }: Props) {
  return (
    <div className="px-3 py-3 border-b border-white/6">
      <span className={labelCls}>Code</span>
      <select
        value={content.language || 'javascript'}
        onChange={(e) => onUpdate({ ...content, language: e.target.value })}
        className="w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2 py-1.5 text-[12px] text-neutral-100 focus:outline-none focus:border-blue-500 mb-2"
      >
        {CODE_LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
      </select>
      <textarea
        value={content.value}
        onChange={(e) => onUpdate({ ...content, value: e.target.value })}
        spellCheck={false}
        className="w-full bg-[#0d1117] border border-white/8 rounded-md px-2.5 py-2 text-[12px] text-[#e2e8f0] focus:outline-none focus:border-blue-500 resize-y min-h-[120px] font-mono"
      />
    </div>
  )
}
