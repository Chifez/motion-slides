import { Trash2, Plus, Palette } from 'lucide-react'
import type { ChartContent, ChartType, ChartDataPoint } from '@motionslides/shared'


const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-neutral-600 mb-2.5 block"

interface Props {
  content: ChartContent
  onUpdate: (content: ChartContent) => void
}

export function ChartSection({ content, onUpdate }: Props) {
  const chartTypes: { value: ChartType; label: string }[] = [
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'area', label: 'Area Chart' },
  ]

  const addDataPoint = () => {
    const newData = [...content.data, { label: `Label ${content.data.length + 1}`, value: 10 }]
    onUpdate({ ...content, data: newData })
  }

  const updateDataPoint = (index: number, updates: Partial<ChartDataPoint>) => {
    const newData = content.data.map((dp, i) => i === index ? { ...dp, ...updates } : dp)
    onUpdate({ ...content, data: newData })
  }

  const removeDataPoint = (index: number) => {
    const newData = content.data.filter((_, i) => i !== index)
    onUpdate({ ...content, data: newData })
  }

  return (
    <div className="px-3 py-3 border-b border-white/6">
      <span className={labelCls}>Chart Type</span>
      <select
        value={content.chartType}
        onChange={(e) => onUpdate({ ...content, chartType: e.target.value as ChartType })}
        className="w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2 py-1.5 text-[12px] text-neutral-100 focus:outline-none focus:border-blue-500 mb-4"
      >
        {chartTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>

      <div className="flex items-center justify-between mb-3">
        <span className={labelCls}>Data Points</span>
        <button
          onClick={addDataPoint}
          className="p-1 rounded bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-neutral-100 border-none cursor-pointer"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="flex flex-col gap-2 mb-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {content.data.map((dp, i) => (
          <div key={i} className="flex flex-col gap-1.5 p-2 bg-white/3 rounded border border-white/5">
            <div className="flex items-center justify-between gap-2 px-2">
              <input
                type="text"
                value={dp.label}
                onChange={(e) => updateDataPoint(i, { label: e.target.value })}
                className="min-w-0 bg-transparent border-none text-[11px] text-neutral-200 outline-none font-semibold"
                placeholder="Label"
              />
              {!content.isStacked && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={dp.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                    onChange={(e) => updateDataPoint(i, { color: e.target.value })}
                    className="w-4 h-4 bg-transparent border-none cursor-pointer rounded-sm overflow-hidden p-0"
                  />
                  <input
                    type="number"
                    value={dp.value}
                    onChange={(e) => updateDataPoint(i, { value: parseFloat(e.target.value) || 0 })}
                    className="w-16 bg-[#0d1117] border border-white/8 rounded px-1.5 py-1 text-[11px] text-neutral-200 outline-none"
                  />
                </div>
              )}
              <button
                onClick={() => removeDataPoint(i)}
                className="p-1 text-neutral-600 hover:text-red-500 border-none bg-transparent cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {content.isStacked && (
              <div className="space-y-1.5 mt-1 border-t border-white/5 pt-2">
                {(dp.stack || [dp.value]).map((val, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500/50 shrink-0" />
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => {
                        const newStack = [...(dp.stack || [dp.value])]
                        newStack[si] = parseFloat(e.target.value) || 0
                        updateDataPoint(i, { stack: newStack, value: newStack.reduce((a, b) => a + b, 0) })
                      }}
                      className="flex-1 bg-[#0d1117] border border-white/8 rounded px-1.5 py-0.5 text-[10px] text-neutral-300 outline-none"
                    />
                    {(dp.stack?.length ?? 0) > 1 && (
                      <button
                        onClick={() => {
                          const newStack = (dp.stack || [dp.value]).filter((_, index) => index !== si)
                          updateDataPoint(i, { stack: newStack, value: newStack.reduce((a, b) => a + b, 0) })
                        }}
                        className="p-0.5 text-neutral-700 hover:text-red-500 border-none bg-transparent cursor-pointer"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newStack = [...(dp.stack || [dp.value]), 10]
                    updateDataPoint(i, { stack: newStack, value: newStack.reduce((a, b) => a + b, 0) })
                  }}
                  className="w-full py-1 text-[9px] text-neutral-500 hover:text-neutral-300 border border-dashed border-white/10 rounded mt-1 transition-colors cursor-pointer bg-transparent"
                >
                  + Add Segment
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-2 border-t border-white/4">
        {content.chartType === 'bar' && (
          <>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Bar Width</span>
                <span className="text-[10px] text-neutral-400 font-mono">{content.barSize || 40}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="100"
                value={content.barSize || 40}
                onChange={(e) => onUpdate({ ...content, barSize: parseInt(e.target.value) })}
                className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-2"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer group pb-2">
              <input
                type="checkbox"
                checked={content.isStacked}
                onChange={(e) => onUpdate({ ...content, isStacked: e.target.checked })}
                className="w-3 h-3 rounded border-white/10 bg-transparent text-blue-500 focus:ring-offset-0 focus:ring-0"
              />
              <span className="text-[11px] text-neutral-500 group-hover:text-neutral-300 transition-colors">Stacked Bars</span>
            </label>
          </>
        )}

        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={content.showLabels}
            onChange={(e) => onUpdate({ ...content, showLabels: e.target.checked })}
            className="w-3 h-3 rounded border-white/10 bg-transparent text-blue-500 focus:ring-offset-0 focus:ring-0"
          />
          <span className="text-[11px] text-neutral-500 group-hover:text-neutral-300 transition-colors">Show Labels</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={content.showGrid}
            onChange={(e) => onUpdate({ ...content, showGrid: e.target.checked })}
            className="w-3 h-3 rounded border-white/10 bg-transparent text-blue-500 focus:ring-offset-0 focus:ring-0"
          />
          <span className="text-[11px] text-neutral-500 group-hover:text-neutral-300 transition-colors">Show Grid</span>
        </label>

        <div className="pt-3 mt-1 border-t border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Palette size={10} className="text-neutral-600" />
              Series Colors
            </span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {(content.colors || DEFAULT_COLORS).map((color, ci) => (
              <div key={ci} className="relative group/color">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const newColors = [...(content.colors || DEFAULT_COLORS)]
                    newColors[ci] = e.target.value
                    onUpdate({ ...content, colors: newColors })
                  }}
                  className="w-full h-6 bg-transparent border-none cursor-pointer rounded overflow-hidden p-0"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
