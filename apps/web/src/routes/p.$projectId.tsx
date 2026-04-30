import { createFileRoute, Link, useParams } from '@tanstack/react-router'
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
import { PermissionProvider } from '@/context/PermissionContext'
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

    const isServer = typeof window === 'undefined'
    const existsLocally = !isServer && store.projects.some(p => p.id === params.projectId)
    
    console.log(`[ProjectLoader] ID: ${params.projectId} | Exists locally: ${existsLocally} | isServer: ${isServer}`)

    if (existsLocally) {
      console.log(`[ProjectLoader] Found in client store, using local data.`)
      store.loadProject(params.projectId)
      if (store.user) store.syncProjects() // Background sync
      return
    }

    const { getRemoteProjectAction } = await import('@/lib/actions/project')
    const key = deps.key

    console.log(`[ProjectLoader] Requesting remote project from server...`)

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const remoteProject = await getRemoteProjectAction({
          data: { projectId: params.projectId, shareKey: key }
        })

        if (remoteProject) {
          console.log(`[Loader] Successfully fetched project ${params.projectId}`)
          
          // CRITICAL: Attach the key from the URL to the project metadata.
          // The server omits it from JSON for security, but the client needs it 
          // to satisfy the useAccessControl permission check in the UI.
          const projectWithKey = {
            ...remoteProject,
            shareKey: key || (remoteProject as any).shareKey
          }

          store.importProject(projectWithKey as any)
          store.loadProject(params.projectId)
          return { project: projectWithKey as any }
        }
      } catch (err: any) {
        console.error(`[Loader] Attempt ${attempt} failed for ${params.projectId}:`, err.message)
      }

      if (attempt < 3) {
        const delay = 1000 * attempt
        console.log(`[Loader] Retrying in ${delay}ms...`)
        await new Promise(r => setTimeout(r, delay))
      }
    }

    store.loadProject(params.projectId) 
    const project = store.activeProject()
    return { project }
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
  const loaderData = Route.useLoaderData()
  const loaderProject = loaderData?.project
  const { projectId } = useParams({ from: '/p/$projectId' })
  const project = useEditorStore(s => s.projects.find(p => p.id === projectId))
  const isPresenting = useEditorStore(s => s.isPresenting)
  
  const isPrototypeMode = useEditorStore(s => s.isPrototypeMode)
  const startPresentation = useEditorStore(s => s.startPresentation)
  const setReadOnly = useEditorStore(s => s.setReadOnly)
  const importProject = useEditorStore(s => s.importProject)
  const loadProject = useEditorStore(s => s.loadProject)

  console.log(`[ProjectPage] Render ID: ${projectId}`)
  console.log(`- Project in store: ${project ? 'YES' : 'NO'}`)
  console.log(`- Loader Project: ${loaderProject ? 'YES' : 'NO'}`)

  // Hydrate store from loader data if necessary (critical for guest/incognito access)
  useEffect(() => {
    if (loaderProject && !project) {
      console.log('[ProjectPage] Action: Importing remote project into store...')
      importProject(loaderProject)
      loadProject(loaderProject.id)
    }
  }, [loaderProject, project, importProject, loadProject])

  const { mode, isReadOnly, autoplay, isDenied, isPending } = useAccessControl()

  useEditorShortcuts()

  // Sync derived read-only state to the store
  const storeIsReadOnly = useEditorStore(s => s.isReadOnly)
  useEffect(() => {
    if (!isPending && storeIsReadOnly !== isReadOnly) {
      setReadOnly(isReadOnly)
    }
  }, [isReadOnly, storeIsReadOnly, setReadOnly, isPending])

  // Trigger presentation mode once if the URL requests it on initial load
  const hasStartedPresentation = useRef(false)
  useEffect(() => {
    if (!isPending && !hasStartedPresentation.current && (mode === 'present' || (mode === 'view' && autoplay))) {
      hasStartedPresentation.current = true
      startPresentation({ autoplay: !!autoplay })
    }
  }, [mode, autoplay, startPresentation, isPending])

  // ✅ Safe to early-return here — all hooks are already above this line
  
  if (isPending || (loaderProject && !project)) return <LoadingPage />

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
    <PermissionProvider>
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
    </PermissionProvider>
  )
}