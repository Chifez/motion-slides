import { useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useCanvasScale } from '@/hooks/useCanvasScale'
import { useCanvasCamera } from '@/hooks/useCanvasCamera'
import { useAccessControl } from '@/hooks/useAccessControl'
import { getCanvasDimensions } from '@motionslides/shared'
import { useSectionLasso } from '@/hooks/useSectionLasso'

import { MotionStage } from './MotionStage'
import { GroupBoundingBox } from './GroupBoundingBox'
import { ConnectionAnchors } from './BoundingBox'
import { SlideBackgroundPicker } from './SlideBackgroundPicker'
import { SlideNavigation } from './SlideNavigation'
import { SyncStatusButton } from './SyncStatusButton'
import { ReviewOverlay } from './ReviewOverlay'

export function CanvasStage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const { isReadOnly, isAuthenticated, mode } = useAccessControl()

  useCanvasCamera(stageRef)

  const playbackSettings = useEditorStore(state => state.playbackSettings)
  const camera = useEditorStore(state => state.camera)
  const activeTool = useEditorStore(state => state.activeTool)
  const slide = useEditorStore(state => state.activeSlide())
  const slideBackground = slide?.background ?? '#0a0a0a'
  const slideName = slide?.name ?? `Slide ${(useEditorStore.getState().activeSlideIndex) + 1}`

  const { width: canvasW, height: canvasH } = getCanvasDimensions(playbackSettings.aspectRatio)
  const scale = useCanvasScale(stageRef, canvasW, canvasH)

  const selectedElementIds = useEditorStore(state => state.selectedElementIds)
  
  const selectedElements = slide?.elements.filter(element => selectedElementIds.includes(element.id)) ?? []

  const isGroupSelection = selectedElements.length > 1 || (selectedElements.length === 1 && !!selectedElements[0].groupId)

  const setSelectedElement = useEditorStore(state => state.setSelectedElement)
  const setMobileInspectorOpen = useEditorStore(state => state.setMobileInspectorOpen)
  const setEditingId = useEditorStore(state => state.setEditingId)

  const { lasso, pointerHandlers } = useSectionLasso({
    stageRef,
    scale,
    canvasW,
    canvasH,
    isReadOnly,
  })

  const handleStageClick = () => {
    if (activeTool !== 'select') return
    setSelectedElement(null)
    setEditingId(null)
    setMobileInspectorOpen(false)
  }

  const reviewingSuggestionId = useEditorStore(state => state.reviewingSuggestionId)

  return (
    <main
      ref={stageRef}
      className={`flex-1 bg-(--ms-bg-base) flex items-center justify-center overflow-hidden relative p-2 md:p-0 transition-colors ${activeTool === 'section' ? 'cursor-crosshair' : ''
        }`}
      onClick={handleStageClick}
      {...pointerHandlers}
    >

      <div
        data-canvas-board
        className={`relative rounded-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_32px_80px_rgba(0,0,0,0.8)] ${
          playbackSettings.clipContent ? 'overflow-hidden' : ''
        }`}
        style={{
          width: canvasW,
          height: canvasH,
          backgroundColor: slideBackground.startsWith('url') ? 'transparent' : slideBackground,
          backgroundImage: slideBackground.startsWith('url') ? slideBackground : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${scale * camera.zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <MotionStage
          mode="editor"
          slide={slide}
          previousSlide={null}
          settings={playbackSettings}
        />
        <ConnectionAnchors />
        {isGroupSelection && <GroupBoundingBox elements={selectedElements} />}

        {lasso && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none z-1000"
            style={{
              left: Math.min(lasso.x1, lasso.x2),
              top: Math.min(lasso.y1, lasso.y2),
              width: Math.abs(lasso.x2 - lasso.x1),
              height: Math.abs(lasso.y2 - lasso.y1),
            }}
          />
        )}
      </div>

      {mode === 'edit' && (
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="text-[10px] text-(--ms-text-muted) font-medium bg-(--ms-bg-surface)/80 backdrop-blur-sm border border-(--ms-border) rounded-md px-2 py-1">
            {slideName}
          </span>

          <SlideBackgroundPicker />
          {!reviewingSuggestionId && (
            <SyncStatusButton isAuthenticated={isAuthenticated} isReadOnly={isReadOnly} />
          )}
        </div>
      )}

      {mode === 'edit' && <SlideNavigation />}
      {reviewingSuggestionId && <ReviewOverlay />}
    </main>
  )
}
