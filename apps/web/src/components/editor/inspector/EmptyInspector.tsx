import { memo } from 'react'

const sectionCls = "px-3 py-3 border-b border-(--ms-border)"

export const EmptyInspector = memo(function EmptyInspector() {
  return (
    <div className={sectionCls}>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-(--ms-text-muted) mb-2.5 block">Inspector</span>
      <p className="text-[12px] text-(--ms-text-secondary)">Select an element to inspect its properties.</p>
    </div>
  )
})
