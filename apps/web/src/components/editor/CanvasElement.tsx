import { useState } from 'react'
import type React from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useMotionContext } from '@/context/MotionContext'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { usePermissions } from '@/context/PermissionContext'
import { useElementDrag } from '@/hooks/useElementDrag'
import { MotionWrapper } from './MotionWrapper'
import { BoundingBox } from './BoundingBox'
import { ElementRenderer } from './ElementRenderer'
import { useElementDiffStatus } from '@/hooks/useElementDiffStatus'
import { DiffBadge } from './DiffBadge'
import type { SceneElement } from '@motionslides/shared'
import { Info } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { HotspotCard } from './elements/HotspotCard'

interface Props {
  elementId: string
  staggerIndex?: number
  element?: SceneElement
  ref?: React.Ref<HTMLDivElement>
}

export function CanvasElement({ elementId, element: elementProp, ref }: Props) {
  const elementFromStore = useEditorStore(state => state.activeSlide()?.elements.find(slideElement => slideElement.id === elementId))
  const element = elementProp ?? elementFromStore
  const selectedElementIds = useEditorStore(state => state.selectedElementIds)
  const isEditingId = useEditorStore(state => state.isEditingId)
  const isMultiSelectMode = useEditorStore(state => state.isMultiSelectMode)

  const setSelectedElement = useEditorStore(state => state.setSelectedElement)
  const setMobileInspectorOpen = useEditorStore(state => state.setMobileInspectorOpen)
  const setEditingId = useEditorStore(state => state.setEditingId)

  const { isReadOnly } = usePermissions()
  const isMobile = useIsMobile()
  const { continuingIds } = useMotionContext()

  const { onPointerDown } = useElementDrag({
    element,
    isReadOnly,
    isEditing: isEditingId === elementId,
    isMultiSelectMode
  })

  const handleClick = (event: React.MouseEvent) => {
    if (isReadOnly) return
    event.stopPropagation()
  }

  const handleDoubleClick = (event: React.MouseEvent) => {
    if (!element || isReadOnly) return
    event.stopPropagation()
    if (!element.locked) {
      setSelectedElement(element.id, false)
      if (element.type === 'text' || element.type === 'shape' || element.type === 'line') setEditingId(element.id)
      if (isMobile) setMobileInspectorOpen(true)
    }
  }

  const diffStatus = useElementDiffStatus(elementId, element)

  const [isCardOpen, setIsCardOpen] = useState(false)

  if (!element) return null

  const isSelected = selectedElementIds.includes(element.id)
  const isContinuing = continuingIds.has(elementId)

  return (
    <>
      <MotionWrapper
        ref={ref}
        element={element}
        isSelected={isSelected}
        isReadOnly={isReadOnly}
        isContinuing={isContinuing}
        onPointerDown={onPointerDown}
        onDoubleClick={handleDoubleClick}
        onClick={handleClick}
      >
        <ElementRenderer element={element} isSelected={isSelected} />
        <DiffBadge status={diffStatus} />

        {element.isHotspot && (
          <div 
            className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg z-[5500] hover:scale-115 active:scale-95 transition-transform pointer-events-auto cursor-pointer border border-white/20"
            onClick={(e) => {
              e.stopPropagation()
              setIsCardOpen(!isCardOpen)
            }}
          >
            <Info size={10} className="text-white" />
            <AnimatePresence>
              {isCardOpen && (
                <HotspotCard
                  title={element.hotspotTitle || 'Annotation'}
                  body={element.hotspotBody || ''}
                  color="#3b82f6"
                  onClose={() => setIsCardOpen(false)}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </MotionWrapper>

      {isSelected && selectedElementIds.length === 1 && !element.groupId && (
        <BoundingBox element={element} />
      )}
    </>
  )
}
