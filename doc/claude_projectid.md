Looking at this file, there are a few clear violations worth addressing: the component carries too many concerns, business logic lives inside JSX files, and hooks are scattered across two components. Here's how I'd break it down.

---

## Problems with the current structure

1. **`ProjectPageInner` does 5 unrelated things** — hydration, access control, read-only sync, presentation autostart, and navigation blocking. Each of those is a hidden side-effect dependency on the others.
2. **Loader logic is inline and imperative** — the retry loop, access-denial check, and server guard belong in a dedicated module.
3. **Two-component SSR guard pattern is fine**, but `ProjectPageInner` is still too large to justify keeping everything in one place.
4. **No separation between layout and logic** — the JSX at the bottom is trivial, but it's buried under ~60 lines of hooks.

---

## Proposed file structure

```
/p/$projectId/
├── index.tsx              ← route definition + loader only
├── ProjectPage.tsx         ← SSR mount guard
├── ProjectPageInner.tsx    ← orchestrator, composes hooks + layout
├── ProjectLayout.tsx       ← pure layout/JSX shell
│
hooks/
├── useProjectHydration.ts  ← imports project from loader into store
├── usePresentationAutostart.ts
├── useProjectSync.ts       ← navigation blocker + sync
│
lib/actions/
└── project.ts             ← loader helper (already exists, just isolated)
```

---

## Refactored files

### `index.tsx` — route definition only

```ts
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { storeHydrationPromise } from '@/store/editorStore'
import { loadProjectForRoute } from '@/lib/loaders/projectLoader'
import { LoadingPage } from '@/components/ui/LoadingPage'
import { ProjectPage } from './ProjectPage'

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
    return loadProjectForRoute(params.projectId, deps.key)
  },
  pendingComponent: LoadingPage,
  component: ProjectPage,
})
```

The route file now has zero business logic — just wiring.

---

### `lib/loaders/projectLoader.ts` — extracted loader logic

```ts
import { useEditorStore } from '@/store/editorStore'

const MAX_ATTEMPTS = 3

export async function loadProjectForRoute(projectId: string, shareKey?: string) {
  const store = useEditorStore.getState()
  const isServer = typeof window === 'undefined'
  const existsLocally = !isServer && store.projects.some(p => p.id === projectId)

  if (existsLocally) {
    store.loadProject(projectId)
    if (store.user) store.syncProjects()
    return { project: null }
  }

  const { getRemoteProjectAction } = await import('@/lib/actions/project')

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const remoteProject = await getRemoteProjectAction({
        data: { projectId, shareKey },
      })

      if (remoteProject) {
        const projectWithKey = { ...remoteProject, shareKey: shareKey ?? (remoteProject as any).shareKey }
        store.importProject(projectWithKey as any)
        store.loadProject(projectId)
        return { project: projectWithKey }
      }
    } catch (err: any) {
      const isAccessDenied = err.message?.includes('Access Denied')
      if (isServer || isAccessDenied) return { project: null }
      if (attempt === MAX_ATTEMPTS) throw err
    }

    await new Promise(r => setTimeout(r, 1000 * attempt))
  }

  store.loadProject(projectId)
  return { project: null }
}
```

The retry loop, access-denial guard, and server check are now testable in isolation.

---

### `hooks/useProjectHydration.ts`

```ts
import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'

interface Options {
  projectId: string
  loaderProject: any | null
}

/**
 * Imports a project from loader data into the store when it isn't
 * already present (guest / incognito access pattern).
 */
export function useProjectHydration({ projectId, loaderProject }: Options) {
  const project = useEditorStore(s => s.projects.find(p => p.id === projectId))
  const importProject = useEditorStore(s => s.importProject)
  const loadProject = useEditorStore(s => s.loadProject)

  useEffect(() => {
    if (loaderProject && !project) {
      importProject(loaderProject)
      loadProject(loaderProject.id)
    }
  }, [loaderProject, project, importProject, loadProject])

  return project
}
```

---

### `hooks/usePresentationAutostart.ts`

```ts
import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'

interface Options {
  mode: 'edit' | 'view' | 'present'
  autoplay: boolean
  isPending: boolean
}

export function usePresentationAutostart({ mode, autoplay, isPending }: Options) {
  const startPresentation = useEditorStore(s => s.startPresentation)
  const hasStarted = useRef(false)

  useEffect(() => {
    if (isPending || hasStarted.current) return
    if (mode === 'present' || (mode === 'view' && autoplay)) {
      hasStarted.current = true
      startPresentation({ autoplay })
    }
  }, [mode, autoplay, isPending, startPresentation])
}
```

---

### `hooks/useProjectSync.ts`

```ts
import { useEffect } from 'react'
import { useBlocker } from '@tanstack/react-router'
import { useEditorStore } from '@/store/editorStore'

interface Options {
  isPending: boolean
  projectSynced: boolean
}

/**
 * Blocks in-app navigation when there are unsynced changes,
 * and exposes modal state for the UnsavedChangesModal.
 */
export function useProjectSync({ isPending, projectSynced }: Options) {
  const user = useEditorStore(s => s.user)
  const syncProjects = useEditorStore(s => s.syncProjects)

  const { proceed, reset, status } = useBlocker({
    condition: !isPending && !!user && !projectSynced,
  })

  return { proceed, reset, status, syncProjects }
}
```

---

### `ProjectPageInner.tsx` — now just an orchestrator

```tsx
import { useParams } from '@tanstack/react-router'
import { useEditorStore } from '@/store/editorStore'
import { useAccessControl } from '@/hooks/useAccessControl'
import { useEditorShortcuts } from '@/hooks/useEditorShortcuts'
import { useProjectHydration } from '@/hooks/useProjectHydration'
import { useProjectSync } from '@/hooks/useProjectSync'
import { usePresentationAutostart } from '@/hooks/usePresentationAutostart'
import { ProjectLayout } from './ProjectLayout'
import { LoadingPage } from '@/components/ui/LoadingPage'
import { Link } from '@tanstack/react-router'
import { Route } from '.'
import { useEffect } from 'react'

export function ProjectPageInner() {
  const { projectId } = useParams({ from: '/p/$projectId' })
  const loaderProject = Route.useLoaderData()?.project ?? null

  // 1. Hydrate store from loader (guest/incognito path)
  const project = useProjectHydration({ projectId, loaderProject })

  // 2. Access control
  const { mode, isReadOnly, autoplay, isDenied, isPending } = useAccessControl()

  // 3. Sync derived read-only flag into the store
  const setReadOnly = useEditorStore(s => s.setReadOnly)
  const storeIsReadOnly = useEditorStore(s => s.isReadOnly)
  useEffect(() => {
    if (!isPending && storeIsReadOnly !== isReadOnly) setReadOnly(isReadOnly)
  }, [isReadOnly, storeIsReadOnly, setReadOnly, isPending])

  // 4. Auto-start presentation if URL requests it
  usePresentationAutostart({ mode, autoplay: !!autoplay, isPending })

  // 5. Navigation blocker for unsaved changes
  const { proceed, reset, status, syncProjects } = useProjectSync({
    isPending,
    projectSynced: project?.synced ?? true,
  })

  // 6. Keyboard shortcuts
  useEditorShortcuts()

  // — early returns after all hooks —
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

  return (
    <ProjectLayout
      project={project}
      mode={mode}
      blockerStatus={status}
      onBlockerClose={() => reset?.()}
      onBlockerDiscard={() => proceed?.()}
      onBlockerConfirm={async () => { await syncProjects(); proceed?.() }}
    />
  )
}
```

---

### `ProjectLayout.tsx` — pure layout, no side-effects

```tsx
import { useEditorStore } from '@/store/editorStore'
import { PermissionProvider } from '@/context/PermissionContext'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { SlidePanel } from '@/components/editor/SlidePanel'
import { CanvasStage } from '@/components/editor/CanvasStage'
import { PrototypeCanvas } from '@/components/editor/prototype/PrototypeCanvas'
import { InspectorPanel } from '@/components/editor/InspectorPanel'
import { PresentationOverlay } from '@/components/editor/PresentationOverlay'
import { AIChat } from '@/components/editor/AIChat'
import { ViewerOverlay } from '@/components/editor/presentation/ViewerOverlay'
import { UnsavedChangesModal } from '@/components/ui/UnsavedChangesModal'

interface Props {
  project: any
  mode: 'edit' | 'view' | 'present'
  blockerStatus: string
  onBlockerClose: () => void
  onBlockerDiscard: () => void
  onBlockerConfirm: () => Promise<void>
}

export function ProjectLayout({ project, mode, blockerStatus, onBlockerClose, onBlockerDiscard, onBlockerConfirm }: Props) {
  const isPresenting = useEditorStore(s => s.isPresenting)
  const isPrototypeMode = useEditorStore(s => s.isPrototypeMode)
  const startPresentation = useEditorStore(s => s.startPresentation)

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
        {isViewOnly && !isPresenting && (
          <ViewerOverlay startPresentation={startPresentation} />
        )}

        <UnsavedChangesModal
          isOpen={blockerStatus === 'blocked'}
          onClose={onBlockerClose}
          onDiscard={onBlockerDiscard}
          onConfirm={onBlockerConfirm}
        />
      </div>
    </PermissionProvider>
  )
}
```

`ProjectLayout` is now a **pure presentational component** — no `useEffect`, no store writes, easily snapshot-tested.

---

## Summary of principles applied

| Before | After |
|---|---|
| One file owns loader, hydration, access, sync, presentation, layout | Each concern lives in one file |
| Retry loop inline in route loader | Extracted to `projectLoader.ts`, independently testable |
| Three hooks' worth of logic inline in `ProjectPageInner` | `useProjectHydration`, `usePresentationAutostart`, `useProjectSync` |
| Layout JSX mixed with side-effect hooks | `ProjectLayout` is pure — no hooks with side effects |
| `project?.synced` checked inside blocker inline condition | Encapsulated with the rest of the sync concern |

The key mental model: **routes load data, hooks manage side effects, layout components render** — and none of those three should bleed into each other.