import { useRef, useEffect, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { useCanvasScale } from '@/hooks/use-canvas-scale'
import { useCanvasCamera } from '@/hooks/use-canvas-camera'
import { useAccessControl } from '@/hooks/use-access-control'
import { useBoardTransform } from '@/hooks/use-board-transform'
import { getCanvasDimensions } from '@motionslides/shared'
import { useSectionLasso } from '@/hooks/use-section-lasso'

import { CanvasBoard } from './canvas-board'
import { CanvasToolbar } from './canvas-toolbar'
import { CanvasHelpButton } from './canvas-help-button'
import { CanvasResizeHandles } from './canvas-resize-handles'
import { SlideNavigation } from './slide-navigation'
import { ReviewOverlay } from './review-overlay'

export function CanvasStage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const { isReadOnly, isAuthenticated, mode } = useAccessControl()
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.getAttribute('contenteditable') === 'true'
      )
      if (isInput) return
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        setIsShortcutsHelpOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useCanvasCamera(stageRef, mode === 'view')
  const resetCamera = useEditorStore(state => state.resetCamera)
  useEffect(() => { if (mode === 'view') resetCamera() }, [mode, resetCamera])

  const playbackSettings = useEditorStore(state => state.playbackSettings)
  const camera = useEditorStore(state => state.camera)
  const activeTool = useEditorStore(state => state.activeTool)
  const slide = useEditorStore(state => state.activeSlide())
  const slideBackground = slide?.background ?? '#0a0a0a'
  const slideName = slide?.name ?? `Slide ${useEditorStore.getState().activeSlideIndex + 1}`

  const customCanvasWidth = useEditorStore(s => s.customCanvasWidth) ?? slide?.customWidth ?? null
  const customCanvasHeight = useEditorStore(s => s.customCanvasHeight) ?? slide?.customHeight ?? null
  const { width: defaultW, height: defaultH } = getCanvasDimensions(playbackSettings.aspectRatio)
  const canvasW = customCanvasWidth ?? defaultW
  const canvasH = customCanvasHeight ?? defaultH

  const scale = useCanvasScale(stageRef, canvasW, canvasH)

  const { translateX, translateY, startCanvasResize } = useBoardTransform(
    stageRef, canvasW, canvasH, scale, camera.zoom, camera.x, camera.y,
  )

  const setSelectedElement = useEditorStore(state => state.setSelectedElement)
  const setMobileInspectorOpen = useEditorStore(state => state.setMobileInspectorOpen)
  const setEditingId = useEditorStore(state => state.setEditingId)

  const { lasso, pointerHandlers } = useSectionLasso({
    stageRef, scale, canvasW, canvasH, isReadOnly,
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
      className={`flex-1 bg-(--ms-bg-base) overflow-hidden relative z-0 transition-colors ${activeTool === 'section' ? 'cursor-crosshair' : ''
        }`}
      onClick={handleStageClick}
      {...pointerHandlers}
    >
      <CanvasBoard
        canvasW={canvasW}
        canvasH={canvasH}
        translateX={translateX}
        translateY={translateY}
        scale={scale}
        zoom={camera.zoom}
        slideBackground={slideBackground}
        lasso={lasso}
      />

      {mode === 'edit' && !isReadOnly && (
        <CanvasResizeHandles
          canvasW={canvasW}
          canvasH={canvasH}
          scale={scale * camera.zoom}
          translateX={translateX}
          translateY={translateY}
          onResize={startCanvasResize}
        />
      )}

      {mode === 'edit' && (
        <CanvasToolbar
          slideName={slideName}
          isAuthenticated={isAuthenticated}
          isReadOnly={isReadOnly}
        />
      )}

      {/* Git/PR Comments Layer */}

      {mode === 'edit' && <SlideNavigation />}
      {reviewingSuggestionId && <ReviewOverlay />}

      {mode === 'edit' && (
        <CanvasHelpButton
          isOpen={isShortcutsHelpOpen}
          onOpen={() => setIsShortcutsHelpOpen(true)}
          onClose={() => setIsShortcutsHelpOpen(false)}
        />
      )}
    </main>
  )
}