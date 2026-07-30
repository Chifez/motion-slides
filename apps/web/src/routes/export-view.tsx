import { createFileRoute } from '@tanstack/react-router'
import { useEditorStore } from '@/store/editor-store'
import { MotionStage } from '@/components/editor/motion-stage'
import { getCanvasDimensions } from '@motionslides/shared'
import { PermissionProvider } from '@/context/permission-context'
import type { AccessControl } from '@/hooks/use-access-control'

export const Route = createFileRoute('/export-view')({
  component: ExportView,
})

const EXPORT_ACCESS: AccessControl = {
  mode: 'present',
  canEdit: false,
  isReadOnly: true,
  autoplay: false,
  isAuthenticated: true,
  isDenied: false,
  isPending: false,
}

/**
 * export-view.tsx
 *
 * A clean, fullscreen canvas view used exclusively by the headless renderer.
 * Renders the active slide at 100% viewport size with no editor chrome.
 * State is injected into the Zustand store by HeadlessRenderer.ts before
 * this page is captured.
 */
function ExportView() {
  const activeSlideIndex = useEditorStore(s => s.activeSlideIndex)
  const previousSlideIndex = useEditorStore(s => s.previousSlideIndex)
  const project = useEditorStore(s => s.activeProject())
  const playbackSettings = useEditorStore(s => s.playbackSettings)

  // Derived state during render (referentially stable)
  const activeSlide = project?.slides[activeSlideIndex] ?? null
  const previousSlide = previousSlideIndex !== null ? (project?.slides[previousSlideIndex] ?? null) : null

  const activeTransition = (() => {
    if (!project || !activeSlide || !previousSlide) return null
    const transitions = project.transitions ?? []
    return transitions.find(t => t.fromSlideId === previousSlide.id && t.toSlideId === activeSlide.id) ?? null
  })()

  if (!activeSlide) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }} />
    )
  }

  const defaultDims = getCanvasDimensions(playbackSettings.aspectRatio)
  const canvasW = activeSlide.customWidth ?? defaultDims.width
  const canvasH = activeSlide.customHeight ?? defaultDims.height

  return (
    <PermissionProvider value={EXPORT_ACCESS}>
      <div
        style={{
          width:    '100vw',
          height:   '100vh',
          overflow: 'hidden',
          background: activeSlide.background || '#0a0a0a',
          transform: 'none',
          zoom:      1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        data-canvas-board
      >
        <div
          style={{
            width: canvasW,
            height: canvasH,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <MotionStage
            mode="presentation"
            slide={activeSlide}
            previousSlide={previousSlide}
            settings={playbackSettings}
            activeTransition={activeTransition}
          />
        </div>
      </div>
    </PermissionProvider>
  )
}
