import type { HotspotContent } from '@motionslides/shared'

const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-(--ms-text-muted) mb-1.5 block font-medium"
const sectionCls = "px-3 py-3 border-b border-(--ms-border)"

interface Props {
  content: HotspotContent
  onUpdate: (data: Partial<HotspotContent>) => void
}

export function HotspotSection({ content, onUpdate }: Props) {
  const iconTypes: Array<HotspotContent['iconType']> = ['info', 'question', 'warning', 'star']

  return (
    <div className="flex flex-col">
      <div className={sectionCls}>
        <span className={labelCls}>Hotspot Title</span>
        <input
          type="text"
          value={content.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full bg-(--ms-bg-base)/50 border border-(--ms-border) rounded px-2.5 py-1.5 text-xs text-(--ms-text-primary) focus:outline-none focus:border-(--ms-accent) transition font-medium"
          placeholder="e.g. Load Balancer Details"
        />
      </div>

      <div className={sectionCls}>
        <span className={labelCls}>Icon Style</span>
        <select
          value={content.iconType || 'info'}
          onChange={(e) => onUpdate({ iconType: e.target.value as HotspotContent['iconType'] })}
          className="w-full bg-(--ms-bg-base)/50 border border-(--ms-border) rounded px-2 py-1.5 text-xs text-(--ms-text-primary) focus:outline-none focus:border-(--ms-accent) transition cursor-pointer font-medium"
        >
          {iconTypes.map((t) => (
            <option key={t} value={t}>
              {t.toUpperCase()} Icon
            </option>
          ))}
        </select>
      </div>

      <div className={sectionCls}>
        <span className={labelCls}>Theme Color</span>
        <div className="flex gap-2">
          <input
            type="color"
            value={content.color || '#3b82f6'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-8 h-8 rounded border border-(--ms-border) cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={content.color || '#3b82f6'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="flex-1 bg-(--ms-bg-base)/50 border border-(--ms-border) rounded px-2.5 py-1.5 text-xs text-(--ms-text-primary) focus:outline-none focus:border-(--ms-accent) transition font-mono font-medium"
            placeholder="#3b82f6"
          />
        </div>
      </div>

      <div className={sectionCls}>
        <span className={labelCls}>Popover Explanation (Text)</span>
        <textarea
          value={content.body || ''}
          onChange={(e) => onUpdate({ body: e.target.value })}
          className="w-full bg-(--ms-bg-base)/50 border border-(--ms-border) rounded px-2.5 py-1.5 text-xs text-(--ms-text-primary) focus:outline-none focus:border-(--ms-accent) transition resize-none h-32 leading-relaxed font-medium"
          placeholder="Explain this system component..."
        />
      </div>
    </div>
  )
}
