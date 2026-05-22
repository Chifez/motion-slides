import type React from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useMotionContext } from '@/context/MotionContext'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { usePermissions } from '@/context/PermissionContext'
import { useElementDrag } from '@/hooks/useElementDrag'
import { MotionWrapper } from './MotionWrapper'
import { BoundingBox } from './BoundingBox'
import { ElementRenderer } from './ElementRenderer'
import type { SceneElement } from '@motionslides/shared'

interface Props {
  elementId: string
  staggerIndex?: number
}

export function CanvasElement({ elementId }: Props) {
  const element = useEditorStore(state => state.activeSlide()?.elements.find(slideElement => slideElement.id === elementId))
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
      if (element.type === 'text') setEditingId(element.id)
      if (isMobile) setMobileInspectorOpen(true)
    }
  }

  const reviewingSuggestionId = useEditorStore(state => state.reviewingSuggestionId)
  const reviewMode = useEditorStore(state => state.reviewMode)
  const activeSlideIndex = useEditorStore(state => state.activeSlideIndex)
  const originalProjectBackup = useEditorStore(state => state.originalProjectBackup)

  if (!element) return null

  const isSelected = selectedElementIds.includes(element.id)
  const isContinuing = continuingIds.has(elementId)

  let diffStatus: 'added' | 'modified' | null = null
  if (reviewingSuggestionId && reviewMode === 'suggested' && originalProjectBackup) {
    const originalSlide = originalProjectBackup.slides[activeSlideIndex]
    const originalElement = originalSlide?.elements.find((originalElementItem: SceneElement) => originalElementItem.id === elementId)
    if (!originalElement) {
      diffStatus = 'added'
    } else {
      const isChanged = 
        element.position.x !== originalElement.position.x ||
        element.position.y !== originalElement.position.y ||
        element.size.width !== originalElement.size.width ||
        element.size.height !== originalElement.size.height ||
        element.rotation !== originalElement.rotation ||
        JSON.stringify(element.content) !== JSON.stringify(originalElement.content) ||
        element.opacity !== originalElement.opacity ||
        element.zIndex !== originalElement.zIndex
      
      if (isChanged) {
        diffStatus = 'modified'
      }
    }
  }

  return (
    <>
      <MotionWrapper
        element={element}
        isSelected={isSelected}
        isReadOnly={isReadOnly}
        isContinuing={isContinuing}
        onPointerDown={onPointerDown}
        onDoubleClick={handleDoubleClick}
        onClick={handleClick}
      >
        <ElementRenderer element={element} isSelected={isSelected} />

        {diffStatus === 'added' && (
          <div className="absolute inset-0 border-2 border-emerald-500 rounded-sm pointer-events-none z-[10] select-none">
            <span className="absolute -top-5 left-0 bg-emerald-500 text-white text-[9px] font-semibold px-1 py-0.5 rounded shadow whitespace-nowrap">
              Added
            </span>
          </div>
        )}
        
        {diffStatus === 'modified' && (
          <div className="absolute inset-0 border-2 border-dashed border-blue-500 rounded-sm pointer-events-none z-[10] select-none">
            <span className="absolute -top-5 left-0 bg-blue-500 text-white text-[9px] font-semibold px-1 py-0.5 rounded shadow whitespace-nowrap">
              Modified
            </span>
          </div>
        )}
      </MotionWrapper>

      {isSelected && selectedElementIds.length === 1 && !element.groupId && (
        <BoundingBox element={element} />
      )}
    </>
  )
}



