import { useRef, useCallback, memo, useMemo } from 'react'
import { Cloud } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useCanvasScale } from '@/hooks/useCanvasScale'
import { useCanvasCamera } from '@/hooks/useCanvasCamera'
import { useAccessControl } from '@/hooks/useAccessControl'
import { getCanvasDimensions } from '@motionslides/shared'

import { MotionStage } from './MotionStage'
import { GroupBoundingBox } from './GroupBoundingBox'
import { ConnectionAnchors } from './BoundingBox'
import { SlideBackgroundPicker } from './SlideBackgroundPicker'
import { SlideNavigation } from './SlideNavigation'

export const CanvasStage = memo(function CanvasStage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const { isReadOnly, isAuthenticated } = useAccessControl()

  useCanvasCamera(stageRef)

  const playbackSettings = useEditorStore(s => s.playbackSettings)
  const camera = useEditorStore(s => s.camera)
  const slide = useEditorStore(s => s.activeSlide())
  const slideBackground = slide?.background || '#0a0a0a'
  const slideName = slide?.name || `Slide ${(useEditorStore.getState().activeSlideIndex) + 1}`

  const { width: canvasW, height: canvasH } = getCanvasDimensions(playbackSettings.aspectRatio)
  const scale = useCanvasScale(stageRef, canvasW, canvasH)

  const selectedElementIds = useEditorStore(s => s.selectedElementIds)
  const selectedElements = useMemo(() =>
    slide?.elements.filter(el => selectedElementIds.includes(el.id)) || [],
    [slide?.elements, selectedElementIds]
  )

  const isGroupSelection = useMemo(() =>
    selectedElements.length > 1 || (selectedElements.length === 1 && !!selectedElements[0].groupId),
    [selectedElements]
  )

  const setSelectedElement = useEditorStore(s => s.setSelectedElement)
  const setMobileInspectorOpen = useEditorStore(s => s.setMobileInspectorOpen)
  const setEditingId = useEditorStore(s => s.setEditingId)

  const handleStageClick = useCallback(() => {
    setSelectedElement(null)
    setEditingId(null)
    setMobileInspectorOpen(false)
  }, [setSelectedElement, setEditingId, setMobileInspectorOpen])

  return (
    <main
      ref={stageRef}
      className="flex-1 bg-(--ms-bg-base) flex items-center justify-center overflow-hidden relative p-2 md:p-0 transition-colors"
      onClick={handleStageClick}
    >

      <div
        data-canvas-board
        className="relative rounded-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden"
        style={{
          width: canvasW,
          height: canvasH,
          background: slideBackground,
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
      </div>


      {!isReadOnly && (
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="text-[10px] text-(--ms-text-muted) font-medium bg-(--ms-bg-surface)/80 backdrop-blur-sm border border-(--ms-border) rounded-md px-2 py-1">
            {slideName}
          </span>

          <SlideBackgroundPicker />
          <SyncStatusButton isAuthenticated={isAuthenticated} isReadOnly={isReadOnly} />
        </div>
      )}

      {!isReadOnly && <SlideNavigation />}
    </main>
  )
})

/**
 * ☁️ SyncStatusButton — Isolated to prevent whole Stage re-renders on sync state change
 */
const SyncStatusButton = memo(function SyncStatusButton({ isAuthenticated, isReadOnly }: { isAuthenticated: boolean, isReadOnly: boolean }) {
  const project = useEditorStore(s => s.activeProject())
  const isSyncing = useEditorStore(s => s.isSyncing)
  const syncProjects = useEditorStore(s => s.syncProjects)

  if (isReadOnly || !isAuthenticated || !project || project.synced) return null

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        syncProjects()
      }}
      disabled={isSyncing}
      className="flex items-center gap-1.5 text-[10px] text-orange-400 hover:text-orange-300 bg-orange-500/10 backdrop-blur-sm border border-orange-500/30 rounded-md px-2 py-1 cursor-pointer transition-colors disabled:opacity-50"
      title="Unsaved changes - click to sync to cloud"
    >
      <Cloud size={11} className={isSyncing ? 'animate-pulse' : ''} />
      <span>{isSyncing ? 'Saving...' : 'Save'}</span>
    </button>
  )
})
