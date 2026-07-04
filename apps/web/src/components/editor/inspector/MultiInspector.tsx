import { memo } from 'react'
import { Trash2, X } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useShallow } from 'zustand/react/shallow'

const sectionCls = "px-3 py-3 border-b border-(--ms-border)"

interface Props {
  selectedIds: string[]
  isMobile: boolean
  onClose: () => void
}

// ── Figma Align Icons ────────────────────────────────────────────────────────

const AlignLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
    <line x1="2" y1="1.5" x2="2" y2="12.5" />
    <rect x="3.5" y="3.5" width="8" height="2" rx="0.5" fill="currentColor" opacity="0.3" />
    <rect x="3.5" y="8.5" width="5" height="2" rx="0.5" fill="currentColor" opacity="0.3" />
  </svg>
)

const AlignHorizontalCenterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
    <line x1="7" y1="1.5" x2="7" y2="12.5" />
    <rect x="3" y="3.5" width="8" height="2" rx="0.5" fill="currentColor" opacity="0.3" />
    <rect x="4.5" y="8.5" width="5" height="2" rx="0.5" fill="currentColor" opacity="0.3" />
  </svg>
)

const AlignRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
    <line x1="12" y1="1.5" x2="12" y2="12.5" />
    <rect x="4" y="3.5" width="8" height="2" rx="0.5" fill="currentColor" opacity="0.3" />
    <rect x="7" y="8.5" width="5" height="2" rx="0.5" fill="currentColor" opacity="0.3" />
  </svg>
)

const AlignTopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
    <line x1="1.5" y1="2" x2="12.5" y2="2" />
    <rect x="3.5" y="3.5" width="2" height="8" rx="0.5" fill="currentColor" opacity="0.3" />
    <rect x="8.5" y="3.5" width="2" height="5" rx="0.5" fill="currentColor" opacity="0.3" />
  </svg>
)

const AlignVerticalCenterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
    <line x1="1.5" y1="7" x2="12.5" y2="7" />
    <rect x="3.5" y="3" width="2" height="8" rx="0.5" fill="currentColor" opacity="0.3" />
    <rect x="8.5" y="4.5" width="2" height="5" rx="0.5" fill="currentColor" opacity="0.3" />
  </svg>
)

const AlignBottomIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
    <line x1="1.5" y1="12" x2="12.5" y2="12" />
    <rect x="3.5" y="2.5" width="2" height="8" rx="0.5" fill="currentColor" opacity="0.3" />
    <rect x="8.5" y="5.5" width="2" height="5" rx="0.5" fill="currentColor" opacity="0.3" />
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────

export const MultiInspector = memo(function MultiInspector({ selectedIds, isMobile, onClose }: Props) {
  const groupElements = useEditorStore(s => s.groupElements)
  const ungroupElements = useEditorStore(s => s.ungroupElements)
  const deleteElement = useEditorStore(s => s.deleteElement)
  const updateElementsBatch = useEditorStore(s => s.updateElementsBatch)

  const elements = useEditorStore(useShallow(s =>
    s.activeSlide()?.elements.filter(e => selectedIds.includes(e.id)) || []
  ))

  const firstGroupId = elements[0]?.groupId
  const allSameGroup = firstGroupId && elements.every(el => el.groupId === firstGroupId) && elements.length > 1

  const align = (type: 'left' | 'h-center' | 'right' | 'top' | 'v-center' | 'bottom') => {
    if (elements.length < 2) return

    const minX = Math.min(...elements.map(e => e.position.x))
    const maxX = Math.max(...elements.map(e => e.position.x + e.size.width))
    const centerX = (minX + maxX) / 2

    const minY = Math.min(...elements.map(e => e.position.y))
    const maxY = Math.max(...elements.map(e => e.position.y + e.size.height))
    const centerY = (minY + maxY) / 2

    const updates = elements.map(el => {
      let nextX = el.position.x
      let nextY = el.position.y

      if (type === 'left') {
        nextX = minX
      } else if (type === 'h-center') {
        nextX = centerX - el.size.width / 2
      } else if (type === 'right') {
        nextX = maxX - el.size.width
      } else if (type === 'top') {
        nextY = minY
      } else if (type === 'v-center') {
        nextY = centerY - el.size.height / 2
      } else if (type === 'bottom') {
        nextY = maxY - el.size.height
      }

      return {
        id: el.id,
        changes: {
          position: { x: nextX, y: nextY }
        }
      }
    })

    updateElementsBatch(updates, { silent: false })
  }

  return (
    <div className={sectionCls}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-(--ms-text-secondary) uppercase tracking-wider">
          Multiple Selected ({selectedIds.length})
        </span>
        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-500 hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Alignment Tools Row */}
      <div className="flex items-center justify-between bg-white/4 border border-white/5 p-1 rounded-lg mb-4 text-neutral-400">
        <button
          onClick={() => align('left')}
          title="Align Left"
          className="flex-1 flex items-center justify-center p-1.5 rounded hover:bg-white/5 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
        >
          <AlignLeftIcon />
        </button>
        <button
          onClick={() => align('h-center')}
          title="Align Horizontal Center"
          className="flex-1 flex items-center justify-center p-1.5 rounded hover:bg-white/5 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
        >
          <AlignHorizontalCenterIcon />
        </button>
        <button
          onClick={() => align('right')}
          title="Align Right"
          className="flex-1 flex items-center justify-center p-1.5 rounded hover:bg-white/5 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
        >
          <AlignRightIcon />
        </button>
        <div className="w-[1px] h-4 bg-white/10 mx-1" />
        <button
          onClick={() => align('top')}
          title="Align Top"
          className="flex-1 flex items-center justify-center p-1.5 rounded hover:bg-white/5 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
        >
          <AlignTopIcon />
        </button>
        <button
          onClick={() => align('v-center')}
          title="Align Vertical Center"
          className="flex-1 flex items-center justify-center p-1.5 rounded hover:bg-white/5 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
        >
          <AlignVerticalCenterIcon />
        </button>
        <button
          onClick={() => align('bottom')}
          title="Align Bottom"
          className="flex-1 flex items-center justify-center p-1.5 rounded hover:bg-white/5 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
        >
          <AlignBottomIcon />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {allSameGroup ? (
          <button
            onClick={() => ungroupElements(firstGroupId)}
            className="w-full flex items-center justify-center gap-1.5 bg-white/4 hover:bg-white/8 border border-white/8 text-neutral-300 hover:text-white text-xs font-medium py-2 rounded-md transition-all cursor-pointer"
          >
            Ungroup Elements
          </button>
        ) : (
          <button
            onClick={() => groupElements(selectedIds)}
            className="w-full flex items-center justify-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 hover:text-blue-200 text-xs font-medium py-2 rounded-md transition-all cursor-pointer"
          >
            Group Elements
          </button>
        )}

        <button
          onClick={() => selectedIds.forEach(id => deleteElement(id))}
          className="w-full flex items-center justify-center gap-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium py-2 rounded-md transition-all cursor-pointer"
        >
          <Trash2 size={13} /> Delete All
        </button>
      </div>
    </div>
  )
})
