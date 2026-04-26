import { X, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Eye, Maximize2, RefreshCcw, Sparkles } from 'lucide-react'
import type { SlideTransition, TransitionAnimation } from '@motionslides/shared'
import { BezierEditor } from '../toolbar/BezierEditor'

const labelCls = "text-[10px] text-(--ms-text-muted) uppercase tracking-wider block mb-1.5"

const ANIMATIONS: { value: TransitionAnimation; label: string; icon: any }[] = [
  { value: 'slide-left', label: 'Slide Left', icon: ArrowLeft },
  { value: 'slide-right', label: 'Slide Right', icon: ArrowRight },
  { value: 'slide-up', label: 'Slide Up', icon: ArrowUp },
  { value: 'slide-down', label: 'Slide Down', icon: ArrowDown },
  { value: 'fade', label: 'Fade', icon: Eye },
  { value: 'zoom', label: 'Zoom', icon: Maximize2 },
  { value: 'flip', label: 'Flip', icon: RefreshCcw },
  { value: 'magic-move', label: 'Magic Move', icon: Sparkles },
]

interface Props {
  transition: SlideTransition
  onUpdate: (updates: Partial<SlideTransition>) => void
  onDelete: () => void
  onClose: () => void
}

export function TransitionPanel({ transition, onUpdate, onDelete, onClose }: Props) {
  return (
    <div className="absolute top-4 right-4 w-72 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-lg shadow-2xl z-50 overflow-hidden transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-(--ms-border)">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-(--ms-text-muted)">Transition</span>
        <button
          onClick={onClose}
          className="p-0.5 rounded text-(--ms-text-muted) hover:text-(--ms-text-primary) bg-transparent border-none cursor-pointer"
        >
          <X size={12} />
        </button>
      </div>

      <div className="p-3 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
        {/* Animation Type Grid */}
        <div>
          <span className={labelCls}>Animation Type</span>
          <div className="grid grid-cols-4 gap-1.5">
            {ANIMATIONS.map((a) => {
              const Icon = a.icon
              const isActive = transition.animation === a.value
              return (
                <button
                  key={a.value}
                  onClick={() => onUpdate({ animation: a.value })}
                  title={a.label}
                  className={`flex flex-col items-center justify-center gap-1.5 aspect-square rounded-md border transition-all cursor-pointer ${
                    isActive
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-(--ms-border) bg-(--ms-bg-base) text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:border-(--ms-border-strong)'
                  }`}
                >
                  <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[8px] font-medium text-center leading-none">{a.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
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
              className="flex-1 accent-blue-500 bg-(--ms-bg-base) rounded-lg h-1 appearance-none cursor-pointer"
            />
            <span className="text-[10px] text-(--ms-text-muted) w-10 text-right">{transition.duration}ms</span>
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
          <div className="flex gap-1.5">
            {(['click', 'auto'] as const).map((t) => (
              <button
                key={t}
                onClick={() => onUpdate({ trigger: t })}
                className={`flex-1 text-[10px] py-2 rounded-md border transition-all cursor-pointer capitalize font-medium ${
                  transition.trigger === t
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-(--ms-border) bg-(--ms-bg-base) text-(--ms-text-muted) hover:text-(--ms-text-primary)'
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
                className="flex-1 accent-blue-500 bg-(--ms-bg-base) rounded-lg h-1 appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-(--ms-text-muted) w-10 text-right">{((transition.autoDelay ?? 2000) / 1000).toFixed(1)}s</span>
            </div>
          </div>
        )}

        {/* Delete */}
        <div className="pt-2">
          <button
            onClick={onDelete}
            className="w-full py-2 text-[10px] font-semibold uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-md border border-red-500/20 transition-all cursor-pointer bg-transparent"
          >
            Remove Transition
          </button>
        </div>
      </div>
    </div>
  )
}
