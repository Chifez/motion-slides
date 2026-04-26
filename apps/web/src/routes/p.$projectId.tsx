import { createFileRoute, Link } from '@tanstack/react-router'
import { useEditorStore, storeHydrationPromise } from '@/store/editorStore'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { SlidePanel } from '@/components/editor/SlidePanel'
import { CanvasStage } from '@/components/editor/CanvasStage'
import { PrototypeCanvas } from '@/components/editor/prototype/PrototypeCanvas'
import { useEditorShortcuts } from '@/hooks/useEditorShortcuts'
import { InspectorPanel } from '@/components/editor/InspectorPanel'
import { PresentationOverlay } from '@/components/editor/PresentationOverlay'
import { AIChat } from '@/components/editor/AIChat'
import { useAccessControl } from '@/hooks/useAccessControl'
import { ViewerOverlay } from '@/components/editor/presentation/ViewerOverlay'
import { useEffect } from 'react'
import { z } from 'zod'

// Define search params for professional routing
const projectSearchSchema = z.object({
  mode: z.enum(['edit', 'view', 'present']).optional().catch('edit'),
  key: z.string().optional(),
  autoplay: z.string().optional().catch('false'),
})

export const Route = createFileRoute('/p/$projectId')({
  validateSearch: (search) => projectSearchSchema.parse(search),
  loader: async ({ params }) => {
    await storeHydrationPromise
    useEditorStore.getState().loadProject(params.projectId)
  },
  component: ProjectPage,
})

function ProjectPage() {
  const { activeProject, isPresenting, isPrototypeMode, startPresentation, setReadOnly } = useEditorStore()
  const { mode, isReadOnly, autoplay } = useAccessControl()
  
  useEditorShortcuts()

  // Sync access control to global store
  useEffect(() => {
    setReadOnly(isReadOnly)
  }, [isReadOnly, setReadOnly])

  // Handle immediate presentation mode if requested via URL
  useEffect(() => {
    if (mode === 'present' || (mode === 'view' && autoplay)) {
      startPresentation()
    }
  }, [mode, autoplay, startPresentation])

  const project = activeProject()
  
  if (!project) {
    return (
      <div className="flex items-center justify-center h-dvh text-(--ms-text-muted) flex-col gap-3 bg-(--ms-bg-base)">
        <div className="text-[32px]">⚠</div>
        <div className="text-sm">Project not found or access denied.</div>
        <Link to="/dashboard" className="text-blue-400 text-xs underline mt-2">Go to Dashboard</Link>
      </div>
    )
  }

  // Determine what to show based on access mode
  const showEditorUI = !isPresenting && mode === 'edit'
  const isViewOnly = mode === 'view' || mode === 'present'

  return (
    <div className="h-screen flex flex-col bg-(--ms-bg-base) overflow-hidden transition-colors relative">
      {/* Only show toolbar in Edit mode */}
      {showEditorUI && <EditorToolbar project={project} />}
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Hide panels in View/Present modes */}
        {showEditorUI && !isPrototypeMode && <SlidePanel />}
        
        {isPrototypeMode ? <PrototypeCanvas /> : <CanvasStage />}
        
        {showEditorUI && !isPrototypeMode && <InspectorPanel />}
        
        {/* Only show AI chat in Edit mode */}
        {showEditorUI && <AIChat />}
      </div>

      {/* Presentation Overlay is always present, but triggered by isPresenting */}
      <PresentationOverlay />

      {/* Professional Viewer Controls for View Mode */}
      {isViewOnly && !isPresenting && <ViewerOverlay startPresentation={startPresentation} />}
    </div>
  )
}
