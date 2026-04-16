import { Trash2 } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { TextContent, CodeContent, ShapeContent, ShapeType } from '../../types'
import { CODE_LANGUAGES } from './elements/CodeElement'

const SHAPE_OPTIONS: { value: ShapeType; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'database', label: 'Database' },
  { value: 'server', label: 'Server' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'client', label: 'Client / Screen' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'user', label: 'User / Actor' },
  { value: 'bucket', label: 'Storage / Bucket' },
  { value: 'queue', label: 'Queue' },
  { value: 'document', label: 'Document' },
]

// Reusable numeric input pair inside a 2-col grid
function PropPair({
  label, value, onChange, min, max, step,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-neutral-600 uppercase tracking-wider">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full bg-[#1c1c1c] border border-white/[0.08] rounded-md px-2 py-1.5 text-[12px] text-neutral-100 focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  )
}

const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-neutral-600 mb-2.5 block"
const sectionCls = "px-3 py-3 border-b border-white/[0.06]"

export function InspectorPanel() {
  const { selectedElementId, activeSlide, updateElement, deleteElement } = useEditorStore()
  const slide = activeSlide()
  const element = slide?.elements.find((el) => el.id === selectedElementId)

  if (!element) {
    return (
      <aside className="w-[280px] shrink-0 bg-[#161616] border-l border-white/8 overflow-y-auto">
        <div className={sectionCls}>
          <span className={labelCls}>Inspector</span>
          <p className="text-[12px] text-neutral-700">Select an element to inspect its properties.</p>
        </div>
      </aside>
    )
  }

  const update = (data: Parameters<typeof updateElement>[1]) => updateElement(element.id, data)
  const textContent = element.content as TextContent
  const codeContent = element.content as CodeContent
  const shapeContent = element.content as ShapeContent

  return (
    <aside className="w-[280px] shrink-0 bg-[#161616] border-l border-white/8 overflow-y-auto">
      {/* Header row: type + delete */}
      <div className={`${sectionCls} flex items-center justify-between`}>
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          {element.type}
        </span>
        <button
          onClick={() => deleteElement(element.id)}
          className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer border-none bg-transparent"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Transform — 2-column grid, no overflow */}
      <div className={sectionCls}>
        <span className={labelCls}>Transform</span>
        {/* Fix #4: proper 2-col grid that shares the full width */}
        <div className="grid grid-cols-2 gap-2">
          <PropPair
            label="X"
            value={Math.round(element.position.x)}
            onChange={(v) => update({ position: { ...element.position, x: v } })}
          />
          <PropPair
            label="Y"
            value={Math.round(element.position.y)}
            onChange={(v) => update({ position: { ...element.position, y: v } })}
          />
          <PropPair
            label="W"
            value={Math.round(element.size.width)}
            onChange={(v) => update({ size: { ...element.size, width: v } })}
          />
          <PropPair
            label="H"
            value={Math.round(element.size.height)}
            onChange={(v) => update({ size: { ...element.size, height: v } })}
          />
          <PropPair
            label="Rotate °"
            value={element.rotation}
            onChange={(v) => update({ rotation: v })}
          />
          <PropPair
            label="Opacity"
            value={element.opacity}
            onChange={(v) => update({ opacity: v })}
            min={0} max={1} step={0.01}
          />
        </div>
      </div>

      {/* Text properties */}
      {element.type === 'text' && (
        <div className={sectionCls}>
          <span className={labelCls}>Text</span>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Color</span>
              <input
                type="color"
                value={textContent.color}
                onChange={(e) => update({ content: { ...textContent, color: e.target.value } })}
                className="w-full h-8 rounded-md cursor-pointer border-none bg-transparent"
              />
            </div>
            <PropPair
              label="Font Size"
              value={textContent.fontSize}
              onChange={(v) => update({ content: { ...textContent, fontSize: v } })}
            />
          </div>
          <textarea
            value={textContent.value}
            onChange={(e) => update({ content: { ...textContent, value: e.target.value } })}
            className="w-full bg-[#1c1c1c] border border-white/[0.08] rounded-md px-2.5 py-2 text-[12px] text-neutral-100 focus:outline-none focus:border-blue-500 resize-y min-h-[56px] font-sans"
          />
        </div>
      )}

      {/* Code properties */}
      {element.type === 'code' && (
        <div className={sectionCls}>
          <span className={labelCls}>Code</span>
          <select
            value={codeContent.language || 'javascript'}
            onChange={(e) => update({ content: { ...codeContent, language: e.target.value } })}
            className="w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2 py-1.5 text-[12px] text-neutral-100 focus:outline-none focus:border-blue-500 mb-2"
          >
            {CODE_LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <textarea
            value={codeContent.value}
            onChange={(e) => update({ content: { ...codeContent, value: e.target.value } })}
            spellCheck={false}
            className="w-full bg-[#0d1117] border border-white/8 rounded-md px-2.5 py-2 text-[12px] text-[#e2e8f0] focus:outline-none focus:border-blue-500 resize-y min-h-[120px] font-mono"
          />
        </div>
      )}

      {/* Shape properties */}
      {element.type === 'shape' && (
        <div className={sectionCls}>
          <span className={labelCls}>Shape</span>
          <select
            value={shapeContent.shapeType}
            onChange={(e) => update({ content: { ...shapeContent, shapeType: e.target.value as ShapeType } })}
            className="w-full bg-[#1c1c1c] border border-white/[0.08] rounded-md px-2 py-1.5 text-[12px] text-neutral-100 focus:outline-none focus:border-blue-500 mb-3"
          >
            {SHAPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Fill</span>
              <input
                type="color"
                value={shapeContent.fill}
                onChange={(e) => update({ content: { ...shapeContent, fill: e.target.value } })}
                className="w-full h-8 cursor-pointer border-none rounded-md bg-transparent"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Stroke</span>
              <input
                type="color"
                value={shapeContent.stroke}
                onChange={(e) => update({ content: { ...shapeContent, stroke: e.target.value } })}
                className="w-full h-8 cursor-pointer border-none rounded-md bg-transparent"
              />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Label</span>
            <input
              type="text"
              value={shapeContent.label ?? ''}
              onChange={(e) => update({ content: { ...shapeContent, label: e.target.value } })}
              placeholder="e.g. API Server"
              className="w-full bg-[#1c1c1c] border border-white/[0.08] rounded-md px-2 py-1.5 text-[12px] text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </aside>
  )
}
