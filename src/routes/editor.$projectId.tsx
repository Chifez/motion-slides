import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useEditorStore } from '../store/editorStore'
import { EditorToolbar } from '../components/editor/EditorToolbar'
import { SlidePanel } from '../components/editor/SlidePanel'
import { CanvasStage } from '../components/editor/CanvasStage'
import { InspectorPanel } from '../components/editor/InspectorPanel'

export const Route = createFileRoute('/editor/$projectId')({
  component: EditorPage,
})

function EditorPage() {
  const { projectId } = Route.useParams()
  const { loadProject, activeProject } = useEditorStore()

  useEffect(() => {
    loadProject(projectId)
  }, [projectId])

  const project = activeProject()
  if (!project) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: '#4a4a4a', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 32 }}>⚠</div>
        <div>Project not found. <Link to="/dashboard">Go to Dashboard</Link></div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <EditorToolbar project={project} />
      <div className="editor-workspace">
        <SlidePanel />
        <CanvasStage />
        <InspectorPanel />
      </div>
    </div>
  )
}
