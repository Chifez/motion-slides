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
import { LoadingPage } from '@/components/ui/LoadingPage'
import { useAccessControl } from '@/hooks/useAccessControl'
import { ViewerOverlay } from '@/components/editor/presentation/ViewerOverlay'
import { useRef } from 'react'
import { z } from 'zod'

// Define search params for professional routing
const projectSearchSchema = z.object({
  mode: z.enum(['edit', 'view', 'present']).optional().catch('edit'),
  key: z.string().optional(),
  autoplay: z.string().optional().catch('false'),
})


export const Route = createFileRoute('/p/$projectId')({
  validateSearch: (search) => projectSearchSchema.parse(search),
  loaderDeps: ({ search: { key } }) => ({ key }),
  loader: async ({ params, deps }) => {
    await storeHydrationPromise
    const store = useEditorStore.getState()

    // 1. Try to find the project locally
    const existsLocally = store.projects.some(p => p.id === params.projectId)

    if (existsLocally) {
      store.loadProject(params.projectId)
    } else {
      // 2. Fall back to the cloud (e.g., shareable link or cleared cache)
      try {
        const { getRemoteProjectAction } = await import('@/lib/actions/project')
        const remoteProject = await getRemoteProjectAction({
          data: { projectId: params.projectId, shareKey: deps.key }
        })

        if (remoteProject) {
          // Add to local state
          store.importProject(remoteProject as any)
          store.loadProject(params.projectId)
        } else {
          // Ensure it's cleared if not found anywhere
          store.loadProject(params.projectId)
        }
      } catch (err) {
        console.error('Failed to load remote project:', err)
        store.loadProject(params.projectId)
      }
    }
  },
  pendingComponent: LoadingPage,
  component: ProjectPage,
})

function ProjectPage() {
  const { activeProject, isPresenting, isPrototypeMode, startPresentation, setReadOnly } = useEditorStore()
  const { mode, isReadOnly, autoplay } = useAccessControl()

  useEditorShortcuts()

  // Sync access control to global store during render (React-approved pattern for derived state)
  const storeIsReadOnly = useEditorStore(s => s.isReadOnly)
  if (storeIsReadOnly !== isReadOnly) {
    setReadOnly(isReadOnly)
  }

  // Handle immediate presentation mode if requested via URL (one-time)
  const hasStartedPresentation = useRef(false)
  if (!hasStartedPresentation.current && (mode === 'present' || (mode === 'view' && autoplay))) {
    hasStartedPresentation.current = true
    // Defer the state update to avoid React warnings about updating during render
    setTimeout(() => startPresentation(), 0)
  }

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
