import { createFileRoute } from '@tanstack/react-router'
import { useEditorStore } from '@/store/editorStore'
import { MotionStage } from '@/components/editor/MotionStage'
import { getCanvasDimensions } from '@/constants/canvas'

export const Route = createFileRoute('/export-view')({
  component: ExportView,
})

/**
 * export-view.tsx
 *
 * A clean, fullscreen canvas view used exclusively by the headless renderer.
 * Renders the active slide at 100% viewport size with no editor chrome.
 * State is injected into the Zustand store by HeadlessRenderer.ts before
 * this page is captured.
 */
function ExportView() {
  const activeSlide = useEditorStore(s => s.activeSlide())
  const playbackSettings = useEditorStore(s => s.playbackSettings)

  if (!activeSlide) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }} />
    )
  }

  const { width: canvasW, height: canvasH } = getCanvasDimensions(playbackSettings.aspectRatio)

  return (
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
          previousSlide={null}
          settings={playbackSettings}
        />
      </div>
    </div>
  )
}
