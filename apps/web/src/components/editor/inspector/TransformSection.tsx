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
    </div>
  )
}
