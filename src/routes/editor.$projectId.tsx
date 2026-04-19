import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { SlidePanel } from '@/components/editor/SlidePanel'
import { CanvasStage } from '@/components/editor/CanvasStage'
import { InspectorPanel } from '@/components/editor/InspectorPanel'
import { PresentationOverlay } from '@/components/editor/PresentationOverlay'
import { PrototypeCanvas } from '@/components/editor/prototype/PrototypeCanvas'
import { useIsMobile } from '@/hooks/useMediaQuery'

export const Route = createFileRoute('/editor/$projectId')({
  component: EditorPage,
})

function EditorPage() {
  const { projectId } = Route.useParams()
  const { loadProject, activeProject, isPresenting, isPrototypeMode } = useEditorStore()

  useEffect(() => {
    loadProject(projectId)
  }, [projectId, loadProject])

  const project = activeProject()
  if (!project) {
    return (
      <div className="flex items-center justify-center h-dvh text-neutral-600 flex-col gap-3">
        <div className="text-[32px]">⚠</div>
        <div>Project not found. <Link to="/dashboard" className="text-blue-400 underline">Go to Dashboard</Link></div>
      </div>
    )
  }

  const isMobile = useIsMobile()

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0d] overflow-hidden">
      {!isPresenting && <EditorToolbar project={project} />}
      <div className="flex flex-1 overflow-hidden">
        {!isPresenting && !isPrototypeMode && <SlidePanel />}
        {isPrototypeMode ? <PrototypeCanvas /> : <CanvasStage />}
        {!isPresenting && !isPrototypeMode && <InspectorPanel />}
      </div>
      <PresentationOverlay />
    </div>
  )
}
