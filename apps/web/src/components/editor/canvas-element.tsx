import type React from 'react'
import { useEditorStore } from '@/store/editor-store'
import { useMotionContext } from '@/context/motion-context'
import { useIsMobile } from '@/hooks/use-media-query'
import { usePermissions } from '@/context/permission-context'
import { useElementDrag } from '@/hooks/use-element-drag'
import { MotionWrapper } from './motion-wrapper'
import { BoundingBox } from './bounding-box'
import { ElementRenderer } from './element-renderer'
import { useElementDiffStatus } from '@/hooks/use-element-diff-status'
import { DiffBadge } from './diff-badge'
import type { SceneElement } from '@motionslides/shared'
import { Info } from 'lucide-react'

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
            className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg z-[5500] border border-white/20 pointer-events-none"
            title={`Info Card: ${element.hotspotTitle || 'Annotation'}`}
          >
            <Info size={10} className="text-white" />
          </div>
        )}
      </MotionWrapper>

      {isSelected && selectedElementIds.length === 1 && !element.groupId && (
        <BoundingBox element={element} />
      )}
    </>
  )
}
