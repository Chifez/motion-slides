import { useParams, useLoaderData, Link } from '@tanstack/react-router'
import { EditorShell } from '@/components/editor/EditorShell'
import { usePermissions } from '@/context/PermissionContext'
import { useEditorShortcuts } from '@/hooks/useEditorShortcuts'
import { LoadingPage } from '@/components/ui/LoadingPage'
import { useProjectHydration } from '@/hooks/useProjectHydration'
import { usePresentationAutostart } from '@/hooks/usePresentationAutostart'
import { useProjectSync } from '@/hooks/useProjectSync'

export function ProjectContainer() {
  const loaderData = useLoaderData({ from: '/p/$projectId' }) as any
  const loaderProject = loaderData?.project
  const { projectId } = useParams({ from: '/p/$projectId' })
  
  // 1. Hydrate store from loader data (guest/incognito path)
  const project = useProjectHydration({ projectId, loaderProject })

  // 2. Permission orchestration
  const { mode, autoplay, isDenied, isPending } = usePermissions()

  // 3. Auto-start presentation if URL requests it
  usePresentationAutostart({ mode, autoplay: !!autoplay, isPending })

  // 4. Navigation blocker for unsaved changes
  const { proceed, reset, status, syncProjects } = useProjectSync({
    isPending,
    isSynced: project?.synced ?? true
  })

  // 5. Global keyboard shortcuts
  useEditorShortcuts()

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

  return (
    <EditorShell 
      project={project} 
      blocker={{ proceed, reset, status, syncProjects }}
    />
  )
}
