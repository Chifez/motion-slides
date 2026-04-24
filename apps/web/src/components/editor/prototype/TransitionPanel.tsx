import { X } from 'lucide-react'
import type { SlideTransition, TransitionAnimation } from '@motionslides/shared'
import { BezierEditor } from '../toolbar/BezierEditor'

const selectCls = "w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2 py-1.5 text-[12px] text-neutral-100 focus:outline-none focus:border-blue-500"
const labelCls = "text-[10px] text-neutral-600 uppercase tracking-wider block mb-1"

const ANIMATIONS: { value: TransitionAnimation; label: string }[] = [
  { value: 'slide-left', label: '← Slide Left' },
  { value: 'slide-right', label: '→ Slide Right' },
  { value: 'slide-up', label: '↑ Slide Up' },
  { value: 'slide-down', label: '↓ Slide Down' },
  { value: 'fade', label: '◐ Fade' },
  { value: 'zoom', label: '⊕ Zoom' },
  { value: 'flip', label: '↻ Flip' },
]

interface Props {
  transition: SlideTransition
  onUpdate: (updates: Partial<SlideTransition>) => void
  onDelete: () => void
  onClose: () => void
}

export function TransitionPanel({ transition, onUpdate, onDelete, onClose }: Props) {
  return (
    <div className="absolute top-4 right-4 w-72 bg-[#1a1a1a] border border-white/8 rounded-lg shadow-2xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/6">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Transition</span>
        <button
          onClick={onClose}
          className="p-0.5 rounded text-neutral-600 hover:text-neutral-100 bg-transparent border-none cursor-pointer"
        >
          <X size={12} />
        </button>
      </div>

      <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
        {/* Animation Type */}
        <div>
          <span className={labelCls}>Animation</span>
          <select
            value={transition.animation}
            onChange={(e) => onUpdate({ animation: e.target.value as TransitionAnimation })}
            className={selectCls}
          >
            {ANIMATIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <span className={labelCls}>Duration</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={100}
              max={2000}
              step={50}
              value={transition.duration}
              onChange={(e) => onUpdate({ duration: +e.target.value })}
              className="flex-1 accent-blue-500"
            />
            <span className="text-[10px] text-neutral-500 w-10 text-right">{transition.duration}ms</span>
          </div>
        </div>

        {/* Easing */}
        <div>
          <span className={labelCls}>Easing Curve</span>
          <BezierEditor
            value={transition.ease}
            onChange={(ease) => onUpdate({ ease })}
          />
        </div>

        {/* Trigger */}
        <div>
          <span className={labelCls}>Trigger</span>
          <div className="flex gap-1">
            {(['click', 'auto'] as const).map((t) => (
              <button
                key={t}
                onClick={() => onUpdate({ trigger: t })}
                className={`flex-1 text-[10px] py-1.5 rounded-md border transition-colors cursor-pointer capitalize ${
                  transition.trigger === t
                    ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                    : 'border-white/8 bg-[#1c1c1c] text-neutral-500 hover:text-neutral-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {transition.trigger === 'auto' && (
          <div>
            <span className={labelCls}>Auto Delay</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={500}
                max={10000}
                step={500}
                value={transition.autoDelay ?? 2000}
                onChange={(e) => onUpdate({ autoDelay: +e.target.value })}
                className="flex-1 accent-blue-500"
              />
              <span className="text-[10px] text-neutral-500 w-10 text-right">{((transition.autoDelay ?? 2000) / 1000).toFixed(1)}s</span>
            </div>
          </div>
        )}

        {/* Delete */}
        <div className="pt-2 border-t border-white/6">
          <button
            onClick={onDelete}
            className="w-full py-1.5 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md border border-red-500/20 transition-colors cursor-pointer bg-transparent"
          >
            Delete Transition
          </button>
        </div>
      </div>
    </div>
  )
}
