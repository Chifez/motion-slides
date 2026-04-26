import { createFileRoute, Link } from '@tanstack/react-router'
import { useEditorStore } from '@/store/editorStore'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { SlidePanel } from '@/components/editor/SlidePanel'
import { CanvasStage } from '@/components/editor/CanvasStage'

import { PrototypeCanvas } from '@/components/editor/prototype/PrototypeCanvas'
import { useEditorShortcuts } from '@/hooks/useEditorShortcuts'

import { InspectorPanel } from '@/components/editor/InspectorPanel'
import { PresentationOverlay } from '@/components/editor/PresentationOverlay'
import { AIChat } from '@/components/editor/AIChat'

export const Route = createFileRoute('/editor/$projectId')({
  loader: ({ params }) => {
    useEditorStore.getState().loadProject(params.projectId)
  },
  component: EditorPage,
})

function EditorPage() {

  const { activeProject, isPresenting, isPrototypeMode } = useEditorStore()

  useEditorShortcuts()

  const project = activeProject()
  if (!project) {
    return (
      <div className="flex items-center justify-center h-dvh text-(--ms-text-muted) flex-col gap-3">
        <div className="text-[32px]">⚠</div>
        <div>Project not found. <Link to="/dashboard" className="text-blue-400 underline">Go to Dashboard</Link></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-(--ms-bg-base) overflow-hidden transition-colors">
      {!isPresenting && <EditorToolbar project={project} />}
      <div className="flex flex-1 overflow-hidden relative">
        {!isPresenting && !isPrototypeMode && <SlidePanel />}
        {isPrototypeMode ? <PrototypeCanvas /> : <CanvasStage />}
        {!isPresenting && !isPrototypeMode && <InspectorPanel />}
        <AIChat />
      </div>
      <PresentationOverlay />
    </div>
  )
}
