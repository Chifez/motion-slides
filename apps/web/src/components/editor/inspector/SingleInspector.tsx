import { memo } from 'react'
import { Trash2, X } from 'lucide-react'
import type { SceneElement } from '@motionslides/shared'
import { TransformSection } from './TransformSection'
import { INSPECTOR_REGISTRY } from './registry'

const sectionCls = "px-3 py-3 border-b border-(--ms-border)"

interface Props {
  element: SceneElement
  isMobile: boolean
  onUpdate: (data: Partial<SceneElement>) => void
  onDelete: () => void
  onClose: () => void
}

export const SingleInspector = memo(function SingleInspector({ 
  element, 
  isMobile, 
  onUpdate, 
  onDelete, 
  onClose 
}: Props) {
  const Section = INSPECTOR_REGISTRY[element.type]

  return (
    <>
      <div className={`${sectionCls} flex items-center justify-between sticky top-0 bg-(--ms-bg-surface) z-10`}>
        <span className="text-[11px] font-semibold text-(--ms-text-secondary) uppercase tracking-wider">
          {element.type}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer border-none bg-transparent"
          >
            <Trash2 size={13} />
          </button>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-neutral-500 hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 md:pb-0">
        <TransformSection element={element} onUpdate={onUpdate} />
        {Section && (
          <Section 
            element={element} 
            onUpdate={onUpdate} 
            onDelete={onDelete} 
          />
        )}
      </div>
    </>
  )
})
