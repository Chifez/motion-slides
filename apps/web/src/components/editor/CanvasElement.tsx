import { memo, useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useMotionContext } from '@/context/MotionContext'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { usePermissions } from '@/context/PermissionContext'
import { useElementDrag } from '@/hooks/useElementDrag'
import { MotionWrapper } from './MotionWrapper'
import { BoundingBox } from './BoundingBox'

import { TextElement } from './elements/TextElement'
import { CodeElement } from './elements/CodeElement'
import { ShapeElement } from './elements/ShapeElement'
import { LineElement } from './elements/LineElement'
import { ChartElement } from './elements/ChartElement'
import type { CodeContent, ShapeContent, ChartContent } from '@motionslides/shared'

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

  function ElementRenderer({ element, isSelected }: { element: any, isSelected: boolean }) {
    switch (element.type) {
      case 'text': return <TextElement element={element} />
      case 'code': return <CodeElement content={element.content as CodeContent} elementId={element.id} />
      case 'shape': return <ShapeElement content={element.content as ShapeContent} />
      case 'line': return <LineElement element={element} isSelected={isSelected} />
      case 'chart': return <ChartElement content={element.content as ChartContent} />
      default: return null
    }
  }

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



