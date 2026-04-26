import type { CodeContent } from '@motionslides/shared'
import { CODE_LANGUAGES } from '@/constants/editor'

const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-(--ms-text-muted) mb-2.5 block"

interface Props {
  content: CodeContent
  onUpdate: (content: CodeContent) => void
}

export function CodeSection({ content, onUpdate }: Props) {
  return (
    <div className="px-3 py-3 border-b border-(--ms-border)">
      <span className={labelCls}>Code</span>
      <select
        value={content.language || 'javascript'}
        onChange={(e) => onUpdate({ ...content, language: e.target.value })}
        className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-md px-2 py-1.5 text-[12px] text-(--ms-text-primary) focus:outline-none focus:border-blue-500 mb-2 transition-colors"
      >
        {CODE_LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
      </select>
      <textarea
        value={content.value}
        onChange={(e) => onUpdate({ ...content, value: e.target.value })}
        spellCheck={false}
        className="w-full bg-[#0d1117] border border-(--ms-border) rounded-md px-2.5 py-2 text-[12px] text-[#e2e8f0] focus:outline-none focus:border-blue-500 resize-y min-h-[120px] font-mono mb-4 transition-colors"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-[9px] text-(--ms-text-muted) uppercase tracking-widest block mb-1">Font Size</span>
          <input
            type="number"
            value={content.fontSize || 12}
            onChange={(e) => onUpdate({ ...content, fontSize: parseInt(e.target.value) || 12 })}
            className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-md px-2 py-1 text-[11px] text-(--ms-text-secondary) transition-colors"
          />
        </div>
        <div>
          <span className="text-[9px] text-(--ms-text-muted) uppercase tracking-widest block mb-1">Line Height</span>
          <input
            type="number"
            step="0.1"
            value={content.lineHeight || 1.5}
            onChange={(e) => onUpdate({ ...content, lineHeight: parseFloat(e.target.value) || 1.5 })}
            className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-md px-2 py-1 text-[11px] text-(--ms-text-secondary) transition-colors"
          />
        </div>
      </div>

      <div className="mt-3">
        <span className="text-[9px] text-(--ms-text-muted) uppercase tracking-widest block mb-1">Font Family</span>
        <select
          value={content.fontFamily || 'monospace'}
          onChange={(e) => onUpdate({ ...content, fontFamily: e.target.value })}
          className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-md px-2 py-1 text-[11px] text-(--ms-text-secondary) transition-colors"
        >
          <option value='ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'>Default Mono</option>
          <option value='"Fira Code", monospace'>Fira Code</option>
          <option value='"JetBrains Mono", monospace'>JetBrains Mono</option>
          <option value='"Roboto Mono", monospace'>Roboto Mono</option>
        </select>
      </div>
    </div>
  )
}
