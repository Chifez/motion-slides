import { useRef, useEffect } from 'react'
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

  useCanvasCamera(stageRef, mode === 'view')

  const resetCamera = useEditorStore(state => state.resetCamera)

  useEffect(() => {
    if (mode === 'view') {
      resetCamera()
    }
  }, [mode, resetCamera])

  const playbackSettings = useEditorStore(state => state.playbackSettings)
  const camera = useEditorStore(state => state.camera)
  const activeTool = useEditorStore(state => state.activeTool)
  const slide = useEditorStore(state => state.activeSlide())
  const slideBackground = slide?.background ?? '#0a0a0a'
  const slideName = slide?.name ?? `Slide ${(useEditorStore.getState().activeSlideIndex) + 1}`

  const customCanvasWidth = useEditorStore(state => state.customCanvasWidth) ?? slide?.customWidth ?? null
  const customCanvasHeight = useEditorStore(state => state.customCanvasHeight) ?? slide?.customHeight ?? null
  const { width: defaultW, height: defaultH } = getCanvasDimensions(playbackSettings.aspectRatio)
  const canvasW = customCanvasWidth ?? defaultW
  const canvasH = customCanvasHeight ?? defaultH
  const scale = useCanvasScale(stageRef, defaultW, defaultH)

  const setCustomCanvasDimensions = useEditorStore(state => state.setCustomCanvasDimensions)
  const zoom = camera.zoom

  const startCanvasResize = (edge: 'right' | 'bottom' | 'both') => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const startW = canvasW
    const startH = canvasH
    const startX = e.clientX
    const startY = e.clientY
    const currentScale = scale * zoom
    const ratio = defaultW / defaultH

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY

      let nextW = startW
      let nextH = startH

      if (edge === 'right') {
        nextW = Math.max(defaultW, startW + dx / currentScale)
        nextH = nextW / ratio
      } else if (edge === 'bottom') {
        nextH = Math.max(defaultH, startH + dy / currentScale)
        nextW = nextH * ratio
      } else if (edge === 'both') {
        const delta = Math.max(dx / currentScale, (dy / currentScale) * ratio)
        nextW = Math.max(defaultW, startW + delta)
        nextH = nextW / ratio
      }

      setCustomCanvasDimensions(nextW, nextH)
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

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
      id="tour-canvas-stage"
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

        {/* Manual Canvas Resize Handles */}
        {mode === 'edit' && !isReadOnly && (
          <>
            {/* Right Resize Handle */}
            <div
              className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-blue-500/20 active:bg-blue-500/40 z-50 pointer-events-auto transition-colors"
              onPointerDown={startCanvasResize('right')}
              title="Drag to resize canvas width"
            />
            {/* Bottom Resize Handle */}
            <div
              className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-blue-500/20 active:bg-blue-500/40 z-50 pointer-events-auto transition-colors"
              onPointerDown={startCanvasResize('bottom')}
              title="Drag to resize canvas height"
            />
            {/* Bottom-right Corner Resize Handle */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-blue-500/40 active:bg-blue-500/60 z-50 pointer-events-auto transition-colors flex items-end justify-end p-0.5"
              onPointerDown={startCanvasResize('both')}
              title="Drag to resize canvas width and height"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" className="text-blue-500 opacity-60">
                <line x1="6" y1="0" x2="6" y2="8" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="6" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          </>
        )}
      </div>

      {mode === 'edit' && (
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="text-[10px] text-(--ms-text-muted) font-medium bg-(--ms-bg-surface)/80 backdrop-blur-sm border border-(--ms-border) rounded-md px-2 py-1">
            {slideName}
          </span>

          <SlideBackgroundPicker />
          <SyncStatusButton isAuthenticated={isAuthenticated} isReadOnly={isReadOnly} />
        </div>
      )}

      {mode === 'edit' && <SlideNavigation />}
      {reviewingSuggestionId && <ReviewOverlay />}
    </main>
  )
}
