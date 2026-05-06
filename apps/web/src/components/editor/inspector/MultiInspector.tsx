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

export const MultiInspector = memo(function MultiInspector({ selectedIds, isMobile, onClose }: Props) {
  const groupElements = useEditorStore(s => s.groupElements)
  const ungroupElements = useEditorStore(s => s.ungroupElements)
  const deleteElement = useEditorStore(s => s.deleteElement)

  const elements = useEditorStore(useShallow(s =>
    s.activeSlide()?.elements.filter(e => selectedIds.includes(e.id)) || []
  ))

  const firstGroupId = elements[0]?.groupId
  const allSameGroup = firstGroupId && elements.every(el => el.groupId === firstGroupId) && elements.length > 1

  return (
    <div className={sectionCls}>
      <div className="flex items-center justify-between mb-4">
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
