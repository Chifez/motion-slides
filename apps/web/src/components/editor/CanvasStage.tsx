import { useRef, useEffect, useState, useCallback } from 'react'
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
import { AlignmentGuides } from './AlignmentGuides'
import { Keyboard } from 'lucide-react'
import { ShortcutsHelper } from './ShortcutsHelper'

// ---------------------------------------------------------------------------
// CanvasResizeHandles
// ---------------------------------------------------------------------------
// Uses getBoundingClientRect so handle positions always reflect the board's
// true painted screen location — no manual transform math required.
// ---------------------------------------------------------------------------

interface CanvasResizeHandlesProps {
  canvasW: number
  canvasH: number
  scale: number
  translateX: number
  translateY: number
  onResize: (edge: 'right' | 'bottom' | 'both') => (e: React.PointerEvent) => void
}

function CanvasResizeHandles({
  canvasW,
  canvasH,
  scale,
  translateX,
  translateY,
  onResize,
}: CanvasResizeHandlesProps) {
  const EDGE_HIT = 8
  const CORNER = 16

  // Mathematical boundaries of the board in stage coordinates
  const relLeft = translateX
  const relTop = translateY
  const relRight = translateX + canvasW * scale
  const relBottom = translateY + canvasH * scale
  const boardWidth = canvasW * scale
  const boardHeight = canvasH * scale

  return (
    <>
      {/* Right edge */}
      <div
        title="Drag to resize canvas width"
        style={{
          position: 'absolute',
          left: relRight,
          top: relTop,
          width: EDGE_HIT,
          height: boardHeight,
          cursor: 'ew-resize',
          zIndex: 100,
        }}
        className="hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors"
        onPointerDown={onResize('right')}
      />

      {/* Bottom edge */}
      <div
        title="Drag to resize canvas height"
        style={{
          position: 'absolute',
          left: relLeft,
          top: relBottom,
          width: boardWidth,
          height: EDGE_HIT,
          cursor: 'ns-resize',
          zIndex: 100,
        }}
        className="hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors"
        onPointerDown={onResize('bottom')}
      />

      {/* Corner */}
      <div
        title="Drag to resize canvas"
        style={{
          position: 'absolute',
          left: relRight,
          top: relBottom,
          width: CORNER,
          height: CORNER,
          cursor: 'nwse-resize',
          zIndex: 101,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: 2,
        }}
        className="hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors"
        onPointerDown={onResize('both')}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" className="text-blue-500 opacity-60">
          <line x1="6" y1="0" x2="6" y2="8" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="6" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </>
  )
}


// ---------------------------------------------------------------------------
// CanvasStage
// ---------------------------------------------------------------------------

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

  useEffect(() => {
    if (mode === 'view') resetCamera()
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

  // ---------------------------------------------------------------------------
  // Stage dimensions — tracked via ResizeObserver so the board transform always
  // uses the real stage size for centering rather than flexbox doing it for us.
  // ---------------------------------------------------------------------------
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setStageSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scale = useCanvasScale(stageRef, canvasW, canvasH)

  const setCustomCanvasDimensions = useEditorStore(state => state.setCustomCanvasDimensions)
  const zoom = camera.zoom

  // ---------------------------------------------------------------------------
  // Board transform
  //
  // Instead of relying on flexbox centering (which re-centers on every resize
  // and causes the board to drift), we position the board absolutely at (0,0)
  // and compute the centering translation ourselves using the live stage size.
  //
  // transformOrigin: 'top left' means scale grows rightward and downward only —
  // the top-left corner stays pinned. This makes right/bottom resize handles
  // track the cursor correctly with zero camera compensation.
  //
  // Translation breakdown:
  //   stageSize.w / 2               → move to horizontal center of stage
  //   - canvasW / 2 * scale * zoom  → shift left so board center aligns to stage center
  //   + camera.x                    → apply pan offset
  // ---------------------------------------------------------------------------
  const boardTranslateX = stageSize.w / 2 - (canvasW / 2) * scale * zoom + camera.x
  const boardTranslateY = stageSize.h / 2 - (canvasH / 2) * scale * zoom + camera.y

  // ---------------------------------------------------------------------------
  // Resize drag handler
  //
  // With transformOrigin: top left, growing canvasW only moves the right edge —
  // no camera compensation needed. The drag delta in screen pixels is converted
  // to canvas units via the current combined scale.
  // ---------------------------------------------------------------------------
  const startCanvasResize = useCallback(
    (edge: 'right' | 'bottom' | 'both') => (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const startW = canvasW
      const startH = canvasH
      const startX = e.clientX
      const startY = e.clientY
      const currentScale = scale * zoom

      const onPointerMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY

        let nextW = startW
        let nextH = startH

        if (edge === 'right' || edge === 'both') {
          nextW = Math.max(300, startW + dx / currentScale)
        }
        if (edge === 'bottom' || edge === 'both') {
          nextH = Math.max(200, startH + dy / currentScale)
        }

        setCustomCanvasDimensions(nextW, nextH)
      }

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
    },
    [canvasW, canvasH, scale, zoom, setCustomCanvasDimensions],
  )

  const selectedElementIds = useEditorStore(state => state.selectedElementIds)
  const selectedElements = slide?.elements.filter(el => selectedElementIds.includes(el.id)) ?? []
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
      className={`flex-1 bg-(--ms-bg-base) overflow-hidden relative transition-colors ${activeTool === 'section' ? 'cursor-crosshair' : ''
        }`}
      onClick={handleStageClick}
      {...pointerHandlers}
    >
      {/*
        Board is absolutely positioned at (0,0) and centered via an explicit
        translation. transformOrigin: top left ensures scale grows only
        rightward and downward, so right/bottom resize handles track correctly.
      */}
      <div
        data-canvas-board
        className={`absolute rounded-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_32px_80px_rgba(0,0,0,0.8)] ${playbackSettings.clipContent ? 'overflow-hidden' : ''
          }`}
        style={{
          top: 0,
          left: 0,
          width: canvasW,
          height: canvasH,
          backgroundColor: slideBackground.startsWith('url') ? 'transparent' : slideBackground,
          backgroundImage: slideBackground.startsWith('url') ? slideBackground : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: `translate(${boardTranslateX}px, ${boardTranslateY}px) scale(${scale * zoom})`,
          transformOrigin: 'top left',
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
        <AlignmentGuides />

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

      {/* Resize handles live outside the board in unscaled stage space */}
      {mode === 'edit' && !isReadOnly && (
        <CanvasResizeHandles
          canvasW={canvasW}
          canvasH={canvasH}
          scale={scale * zoom}
          translateX={boardTranslateX}
          translateY={boardTranslateY}
          onResize={startCanvasResize}
        />
      )}

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

      {/* Floating help shortcuts button */}
      {mode === 'edit' && (
        <button
          onClick={() => setIsShortcutsHelpOpen(true)}
          className="absolute bottom-4 right-4 z-[400] flex items-center justify-center p-2 rounded-lg bg-(--ms-bg-surface)/80 backdrop-blur border border-(--ms-border) hover:bg-(--ms-bg-surface) text-(--ms-text-secondary) hover:text-(--ms-text-primary) shadow-sm cursor-pointer transition-all hover:scale-105"
          title="Keyboard Shortcuts (Ctrl + /)"
        >
          <Keyboard size={16} />
        </button>
      )}

      {/* Shortcuts Helper Dialog */}
      <ShortcutsHelper 
        isOpen={isShortcutsHelpOpen} 
        onClose={() => setIsShortcutsHelpOpen(false)} 
      />
    </main>
  )
}