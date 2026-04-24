import type { SceneElement } from '@motionslides/shared'
import { PropPair } from '@/components/ui/PropPair'

const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-neutral-600 mb-2.5 block"

interface Props {
  element: SceneElement
  onUpdate: (data: Partial<SceneElement>) => void
}

export function TransformSection({ element, onUpdate }: Props) {
  return (
    <div className="px-3 py-3 border-b border-white/6">
      <span className={labelCls}>Transform</span>
      <div className="grid grid-cols-2 gap-2">
        <PropPair label="X" value={Math.round(element.position.x)} onChange={(v) => onUpdate({ position: { ...element.position, x: v } })} />
        <PropPair label="Y" value={Math.round(element.position.y)} onChange={(v) => onUpdate({ position: { ...element.position, y: v } })} />
        <PropPair label="W" value={Math.round(element.size.width)} onChange={(v) => onUpdate({ size: { ...element.size, width: v } })} />
        <PropPair label="H" value={Math.round(element.size.height)} onChange={(v) => onUpdate({ size: { ...element.size, height: v } })} />
        <PropPair label="Rotate °" value={element.rotation} onChange={(v) => onUpdate({ rotation: v })} />
        <PropPair label="Opacity" value={element.opacity} onChange={(v) => onUpdate({ opacity: v })} min={0} max={1} step={0.01} />
      </div>
    </div>
  )
}
