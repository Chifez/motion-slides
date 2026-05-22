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

  const diffStatus = useElementDiffStatus(elementId, element)

  if (!element) return null

  const isSelected = selectedElementIds.includes(element.id)
  const isContinuing = continuingIds.has(elementId)

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
        <DiffBadge status={diffStatus} />
      </MotionWrapper>

      {isSelected && selectedElementIds.length === 1 && !element.groupId && (
        <BoundingBox element={element} />
      )}
    </>
  )
}



