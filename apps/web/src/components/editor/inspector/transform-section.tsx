import type { SceneElement } from '@motionslides/shared'
import { PropPair } from '@/components/ui/PropPair'

const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-(--ms-text-muted) mb-2.5 block"

interface Props {
  element: SceneElement
  onUpdate: (data: Partial<SceneElement>) => void
}

export function TransformSection({ element, onUpdate }: Props) {
  return (
    <div className="px-3 py-3 border-b border-(--ms-border)">
      <span className={labelCls}>Transform</span>
      <div className="grid grid-cols-2 gap-2">
        <PropPair label="X" value={Math.round(element.position.x)} onChange={(v) => onUpdate({ position: { ...element.position, x: v } })} />
        <PropPair label="Y" value={Math.round(element.position.y)} onChange={(v) => onUpdate({ position: { ...element.position, y: v } })} />
        <PropPair label="W" value={Math.round(element.size.width)} min={1} max={5000} onChange={(v) => onUpdate({ size: { ...element.size, width: v } })} />
        <PropPair label="H" value={Math.round(element.size.height)} min={1} max={5000} onChange={(v) => onUpdate({ size: { ...element.size, height: v } })} />
        <PropPair label="Rotate" value={element.rotation} onChange={(v) => onUpdate({ rotation: v })} />
        <PropPair label="Opacity" value={element.opacity} min={0} max={1} step={0.01} onChange={(v) => onUpdate({ opacity: v })} />
      </div>

      <div className="mt-4 pt-3 border-t border-(--ms-border) space-y-2">
        <label className="flex items-center justify-between text-xs text-(--ms-text-secondary) cursor-pointer select-none">
          <span>Focus Spotlight</span>
          <input
            type="checkbox"
            checked={!!element.isFocal}
            onChange={(e) => onUpdate({ isFocal: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-(--ms-border) accent-blue-500 cursor-pointer"
          />
        </label>
        <label className="flex items-center justify-between text-xs text-(--ms-text-secondary) cursor-pointer select-none">
          <span>Ripple Pulse</span>
          <input
            type="checkbox"
            checked={!!element.pulseEffect}
            onChange={(e) => onUpdate({ pulseEffect: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-(--ms-border) accent-blue-500 cursor-pointer"
          />
        </label>

        <div className="h-px bg-(--ms-border) my-2" />

        <label className="flex items-center justify-between text-xs text-(--ms-text-secondary) cursor-pointer select-none">
          <span>Enable Info Card</span>
          <input
            type="checkbox"
            checked={!!element.isHotspot}
            onChange={(e) => onUpdate({ isHotspot: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-(--ms-border) accent-blue-500 cursor-pointer"
          />
        </label>

        {element.isHotspot && (
          <div className="space-y-2.5 mt-2 pl-2 border-l-2 border-blue-500/30">
            <div>
              <span className="text-[9px] font-semibold uppercase text-(--ms-text-muted) block mb-1">Popover Title</span>
              <input
                type="text"
                value={element.hotspotTitle || ''}
                onChange={(e) => onUpdate({ hotspotTitle: e.target.value })}
                className="w-full bg-(--ms-bg-base)/50 border border-(--ms-border) rounded px-2.5 py-1 text-xs text-(--ms-text-primary) focus:outline-none focus:border-(--ms-accent) transition"
                placeholder="Popover Title"
              />
            </div>
            <div>
              <span className="text-[9px] font-semibold uppercase text-(--ms-text-muted) block mb-1">Popover Explanation</span>
              <textarea
                value={element.hotspotBody || ''}
                onChange={(e) => onUpdate({ hotspotBody: e.target.value })}
                className="w-full bg-(--ms-bg-base)/50 border border-(--ms-border) rounded px-2.5 py-1 text-xs text-(--ms-text-primary) focus:outline-none focus:border-(--ms-accent) transition h-20 resize-none leading-relaxed"
                placeholder="Write description here..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
