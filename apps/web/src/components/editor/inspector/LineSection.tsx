import { Trash2, X } from 'lucide-react'
import type { BranchContent, LineContent, LineType } from '@motionslides/shared'
import { LINE_TYPE_OPTIONS } from '@/constants/editor'

const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-(--ms-text-muted) mb-2.5 block"
const selectCls = "w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-md px-2 py-1.5 text-[12px] text-(--ms-text-primary) focus:outline-none focus:border-blue-500 transition-colors"

interface Props {
  content: LineContent
  onUpdate: (content: LineContent) => void
  onDelete?: () => void
}

export function LineSection({ content, onUpdate, onDelete }: Props) {
  return (
    <div className="px-3 py-3 border-b border-(--ms-border)">
      <div className="flex items-center justify-between mb-3">
        <span className={labelCls.replace(' mb-2.5', '')}>Line</span>
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1 rounded bg-(--ms-bg-base) hover:bg-(--ms-border) text-(--ms-text-muted) hover:text-(--ms-text-primary) border border-(--ms-border) transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Line Type */}
      <div className="mb-2">
        <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider block mb-1">Type</span>
        <select
          value={content.lineType}
          onChange={(e) => {
            const nextType = e.target.value as LineType
            let nextBranches = content.branches
            if (nextType === 'branching' && (!nextBranches || nextBranches.length === 0)) {
              nextBranches = [
                { id: `b-${Math.random().toString(36).slice(2, 8)}`, x: 1, y: 0 },
                { id: `b-${Math.random().toString(36).slice(2, 8)}`, x: 1, y: 1 },
              ]
            }
            onUpdate({ ...content, lineType: nextType, branches: nextBranches })
          }}
          className={selectCls}
        >
          {LINE_TYPE_OPTIONS.map((lt) => (
            <option key={lt.value} value={lt.value}>
              {lt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Line Style */}
      <div className="mb-2">
        <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider block mb-1">Style</span>
        <div className="flex gap-1">
          {(['solid', 'dashed', 'dotted'] as const).map((s) => (
            <button
              key={s}
              onClick={() => onUpdate({ ...content, style: s })}
              className={`flex-1 text-[10px] py-1.5 rounded-md border transition-colors cursor-pointer capitalize ${
                content.style === s
                  ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                  : 'border-(--ms-border) bg-(--ms-bg-base) text-(--ms-text-secondary) hover:text-(--ms-text-primary)'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Arrow (Main Line) */}
      <div className="mb-2">
        <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider block mb-1">
          {content.lineType === 'branching' ? 'Default Arrow' : 'Arrow'}
        </span>
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
          <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider">
            {content.lineType === 'branching' ? 'Default Color' : 'Color'}
          </span>
          <input
            type="color"
            value={content.color.startsWith('rgba') ? '#808080' : content.color}
            onChange={(e) => onUpdate({ ...content, color: e.target.value })}
            className="w-full h-8 rounded-md cursor-pointer border-none bg-transparent"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider">Width</span>
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

      {/* Label & Font Size */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <div className="col-span-3 flex flex-col gap-0.5">
          <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider">
            {content.lineType === 'branching' ? 'Default Label' : 'Label'}
          </span>
          {content.lineType !== 'branching' ? (
            <input
              type="text"
              value={content.label ?? ''}
              onChange={(e) => onUpdate({ ...content, label: e.target.value })}
              placeholder="Label"
              className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-md px-2 py-1.5 text-[11px] text-(--ms-text-primary) placeholder-(--ms-text-muted) focus:outline-none focus:border-blue-500 transition-colors"
            />
          ) : (
            <div className="text-[10px] text-(--ms-text-muted) italic py-1.5">Branch labels are individual</div>
          )}
        </div>
        <div className="col-span-2 flex flex-col gap-0.5">
          <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider">Size</span>
          <input
            type="number"
            min="6"
            max="32"
            value={content.labelFontSize || 10}
            onChange={(e) => onUpdate({ ...content, labelFontSize: parseInt(e.target.value) })}
            className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-md px-2 py-1.5 text-[11px] text-(--ms-text-primary) focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Connections Info */}
      {(content.startConnection || content.endConnection) && (
        <div className="space-y-3 pt-2 border-t border-(--ms-border)">
          <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider block mb-2">Connected To</span>
          <div className="flex flex-col gap-1.5">
            {content.startConnection && (
              <div className="flex items-center justify-between text-[11px] text-neutral-400 bg-white/5 p-2 rounded-md">
                <span>Start: <span className="text-blue-400 font-medium">{content.startConnection.handleId}</span></span>
                <button 
                  onClick={() => onUpdate({ ...content, startConnection: undefined })} 
                  className="text-neutral-500 hover:text-red-500 transition-colors p-1 border-none bg-transparent cursor-pointer"
                  title="Disconnect"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {content.endConnection && (
              <div className="flex items-center justify-between text-[11px] text-neutral-400 bg-white/5 p-2 rounded-md">
                <span>End: <span className="text-blue-400 font-medium">{content.endConnection.handleId}</span></span>
                <button 
                  onClick={() => onUpdate({ ...content, endConnection: undefined })} 
                  className="text-neutral-500 hover:text-red-500 transition-colors p-1 border-none bg-transparent cursor-pointer"
                  title="Disconnect"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Branches management */}
      {content.lineType === 'branching' && (
        <div className="pt-3 mt-1 border-t border-(--ms-border)">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider flex items-center gap-1.5">
              <Palette size={10} className="text-(--ms-text-muted)" />
              Series Colors
            </span>
            <button 
              onClick={() => onUpdate({ ...content, branches: [...(content.branches || []), { id: `b-${Math.random().toString(36).slice(2, 8)}`, x: 1, y: 1 }] })}
              className="text-[10px] font-semibold text-blue-500 hover:text-blue-400 border-none bg-transparent cursor-pointer"
            >
              + Add Point
            </button>
          </div>
          {(content.branches || []).map((b, idx) => (
            <div key={b.id ?? idx} className="flex flex-col gap-3 p-3 bg-(--ms-bg-base) rounded-lg mb-3 border border-(--ms-border)">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-400 tracking-tight">Branch {idx + 1}</span>
                <button 
                  onClick={() => onUpdate({ ...content, branches: content.branches?.filter((_, i) => i !== idx) })}
                  className="text-neutral-600 hover:text-red-500 transition-colors p-0.5 border-none bg-transparent cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Individual Branch Label */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-neutral-500 font-medium">Label</span>
                <input
                  type="text"
                  value={b.label ?? ''}
                  onChange={(e) => {
                    const newBranches = [...(content.branches || [])]
                    newBranches[idx] = { ...b, label: e.target.value }
                    onUpdate({ ...content, branches: newBranches })
                  }}
                  placeholder="Branch label"
                  className="w-full bg-(--ms-bg-elevated) border border-(--ms-border) rounded px-2 py-1 text-[11px] text-(--ms-text-primary) placeholder-(--ms-text-muted) focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Individual Color, Style & Font Size */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-neutral-500 font-medium">Color</span>
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="color"
                      value={b.color || content.color}
                      onChange={(e) => {
                        const newBranches = [...(content.branches || [])]
                        newBranches[idx] = { ...b, color: e.target.value }
                        onUpdate({ ...content, branches: newBranches })
                      }}
                      className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                    />
                    <button 
                      onClick={() => {
                        const newBranches = [...(content.branches || [])]
                        const { color, ...rest } = b
                        newBranches[idx] = rest
                        onUpdate({ ...content, branches: newBranches })
                      }}
                      className="text-[8px] text-neutral-600 hover:text-neutral-400 border-none bg-transparent underline cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-(--ms-text-muted) font-medium">Style</span>
                  <select
                    value={b.style || 'default'}
                    onChange={(e) => {
                      const newBranches = [...(content.branches || [])]
                      const val = e.target.value
                      if (val === 'default') {
                        const { style, ...rest } = b
                        newBranches[idx] = rest
                      } else {
                        newBranches[idx] = { ...b, style: val as BranchContent['style'] }
                      }
                      onUpdate({ ...content, branches: newBranches })
                    }}
                    className="w-full bg-(--ms-bg-elevated) border border-(--ms-border) rounded px-1.5 py-1 text-[10px] text-(--ms-text-primary) focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="default">Default</option>
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-neutral-500 font-medium">Font Size</span>
                  <input
                    type="number"
                    min="6"
                    max="32"
                    value={b.labelFontSize || content.labelFontSize || 10}
                    onChange={(e) => {
                      const newBranches = [...(content.branches || [])]
                      newBranches[idx] = { ...b, labelFontSize: parseInt(e.target.value) }
                      onUpdate({ ...content, branches: newBranches })
                    }}
                    className="w-full bg-(--ms-bg-elevated) border border-(--ms-border) rounded px-1.5 py-1 text-[10px] text-(--ms-text-primary) focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Individual Styling Row 2: Arrow */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-neutral-500 font-medium">Branch Arrow</span>
                <select
                  value={b.arrow || 'default'}
                  onChange={(e) => {
                    const newBranches = [...(content.branches || [])]
                    const val = e.target.value
                    if (val === 'default') {
                      const { arrow, ...rest } = b
                      newBranches[idx] = rest
                    } else {
                      newBranches[idx] = { ...b, arrow: val as BranchContent['arrow'] }
                    }
                    onUpdate({ ...content, branches: newBranches })
                  }}
                  className="w-full bg-[#1c1c1c] border border-white/8 rounded px-1.5 py-1 text-[10px] text-neutral-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="default">Follow Main</option>
                  <option value="none">None</option>
                  <option value="end">End →</option>
                </select>
              </div>

              {/* Position Sliders */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center px-0.5">
                    <span className="text-[9px] text-neutral-500 font-medium">X Delta</span>
                    <span className="text-[9px] text-neutral-400">{Math.round(b.x * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="-2" max="2" step="0.01" 
                    value={b.x} 
                    onChange={(e) => {
                      const newBranches = [...(content.branches || [])]
                      newBranches[idx] = { ...b, x: parseFloat(e.target.value) }
                      onUpdate({ ...content, branches: newBranches })
                    }}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center px-0.5">
                    <span className="text-[9px] text-neutral-500 font-medium">Y Delta</span>
                    <span className="text-[9px] text-neutral-400">{Math.round(b.y * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="-2" max="2" step="0.01" 
                    value={b.y} 
                    onChange={(e) => {
                      const newBranches = [...(content.branches || [])]
                      newBranches[idx] = { ...b, y: parseFloat(e.target.value) }
                      onUpdate({ ...content, branches: newBranches })
                    }}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
