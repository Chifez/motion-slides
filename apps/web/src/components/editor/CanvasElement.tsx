import { memo, useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useMotionContext } from '@/context/MotionContext'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { usePermissions } from '@/context/PermissionContext'
import { useElementDrag } from '@/hooks/useElementDrag'
import { MotionWrapper } from './MotionWrapper'
import { BoundingBox } from './BoundingBox'
import { ElementRenderer } from './ElementRenderer'

interface Props {
  elementId: string
  staggerIndex?: number
}

export const CanvasElement = memo(function CanvasElement({ elementId }: Props) {
  const element = useEditorStore(s => s.activeSlide()?.elements.find(e => e.id === elementId))
  const selectedElementIds = useEditorStore(s => s.selectedElementIds)
  const isEditingId = useEditorStore(s => s.isEditingId)
  const isMultiSelectMode = useEditorStore(s => s.isMultiSelectMode)

  const setSelectedElement = useEditorStore(s => s.setSelectedElement)
  const setMobileInspectorOpen = useEditorStore(s => s.setMobileInspectorOpen)
  const setEditingId = useEditorStore(s => s.setEditingId)

  const { isReadOnly } = usePermissions()
  const isMobile = useIsMobile()
  const { continuingIds } = useMotionContext()

  const { onPointerDown } = useElementDrag({
    element,
    isReadOnly,
    isEditing: isEditingId === elementId,
    isMultiSelectMode
  })

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isReadOnly) return
    e.stopPropagation()
  }, [isReadOnly])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!element || isReadOnly) return
    e.stopPropagation()
    if (!element.locked) {
      setSelectedElement(element.id, false)
      if (element.type === 'text') setEditingId(element.id)
      if (isMobile) setMobileInspectorOpen(true)
    }
  }, [element, isReadOnly, isMobile, setSelectedElement, setEditingId, setMobileInspectorOpen])

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
      </MotionWrapper>

      {isSelected && selectedElementIds.length === 1 && !element.groupId && (
        <BoundingBox element={element} />
      )}
    </>
  )
})



