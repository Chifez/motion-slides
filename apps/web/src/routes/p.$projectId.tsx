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
import { useRef, useState, useEffect } from 'react'
import { z } from 'zod'

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

    const existsLocally = store.projects.some(p => p.id === params.projectId)
    if (existsLocally) {
      store.loadProject(params.projectId)
      return
    }

    const { getRemoteProjectAction } = await import('@/lib/actions/project')

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const remoteProject = await getRemoteProjectAction({
          data: { projectId: params.projectId, shareKey: deps.key }
        })

        if (remoteProject) {
          store.importProject(remoteProject as any)
          store.loadProject(params.projectId)
          return
        }
      } catch (err) {
        console.error(`Loader attempt ${attempt} failed:`, err)
      }

      if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt)) // 1s, 2s backoff
    }

    store.loadProject(params.projectId) // resolves to null → "not found" UI
  },
  pendingComponent: LoadingPage,
  component: ProjectPage,
})

/**
 * Outer shell — owns only the SSR hydration guard.
 *
 * The server renders with Postgres data. On the client, the Zustand store
 * needs a tick to determine whether to source state from Postgres (signed-in)
 * or IndexedDB (guest/offline). Rendering <LoadingPage /> until mounted
 * prevents a hydration mismatch between the two environments.
 *
 * useEffect is intentional: it is the correct React primitive for
 * "run only on the client, after the first render".
 */
function ProjectPage() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return <LoadingPage />

  return <ProjectPageInner />
}

/**
 * Inner component — only rendered after mount, so the store is guaranteed
 * to have resolved its Postgres vs. IndexedDB source before any hook runs.
 * All hooks are unconditional; early returns only appear after them.
 */
function ProjectPageInner() {
  const { activeProject, isPresenting, isPrototypeMode, startPresentation, setReadOnly } =
    useEditorStore()
  const { mode, isReadOnly, autoplay, isDenied } = useAccessControl()

  useEditorShortcuts()

  // Sync derived read-only state to the store
  const storeIsReadOnly = useEditorStore(s => s.isReadOnly)
  useEffect(() => {
    if (storeIsReadOnly !== isReadOnly) {
      setReadOnly(isReadOnly)
    }
  }, [isReadOnly, storeIsReadOnly, setReadOnly])

  // Trigger presentation mode once if the URL requests it on initial load
  const hasStartedPresentation = useRef(false)
  useEffect(() => {
    if (!hasStartedPresentation.current && (mode === 'present' || (mode === 'view' && autoplay))) {
      hasStartedPresentation.current = true
      startPresentation({ autoplay: !!autoplay })
    }
  }, [mode, autoplay, startPresentation])

  // ✅ Safe to early-return here — all hooks are already above this line
  const project = activeProject()
  if (!project || isDenied) {
    return (
      <div className="flex items-center justify-center h-dvh text-(--ms-text-muted) flex-col gap-3 bg-(--ms-bg-base)">
        <div className="text-[32px]">⚠</div>
        <div className="text-sm">Project not found or access denied.</div>
        <Link to="/dashboard" className="text-blue-400 text-xs underline mt-2">
          Go to Dashboard
        </Link>
      </div>
    )
  }

  const showEditorUI = !isPresenting && mode === 'edit'
  const isViewOnly = mode === 'view' || mode === 'present'

  return (
    <div className="h-screen flex flex-col bg-(--ms-bg-base) overflow-hidden transition-colors relative">
      {showEditorUI && <EditorToolbar project={project} />}

      <div className="flex flex-1 overflow-hidden relative">
        {showEditorUI && !isPrototypeMode && <SlidePanel />}
        {isPrototypeMode ? <PrototypeCanvas /> : <CanvasStage />}
        {showEditorUI && !isPrototypeMode && <InspectorPanel />}
        {showEditorUI && <AIChat />}
      </div>

      <PresentationOverlay />
      {isViewOnly && !isPresenting && <ViewerOverlay startPresentation={startPresentation} />}
    </div>
  )
}