import { useParams, useLoaderData, Link } from '@tanstack/react-router'
import { EditorShell } from '@/components/editor/EditorShell'
import { usePermissions } from '@/context/PermissionContext'
import { useEditorShortcuts } from '@/hooks/useEditorShortcuts'
import { LoadingPage } from '@/components/ui/LoadingPage'
import { useProjectHydration } from '@/hooks/useProjectHydration'
import { usePresentationAutostart } from '@/hooks/usePresentationAutostart'
import { useProjectSync } from '@/hooks/useProjectSync'
import type { Project } from '@motionslides/shared'

interface LoaderData {
  project: Project | null
  accessDenied?: boolean
}

export function ProjectContainer() {
  const loaderData = useLoaderData({ from: '/p/$projectId' }) as unknown as LoaderData
  const loaderProject = loaderData?.project
  const { projectId } = useParams({ from: '/p/$projectId' })
  

  const project = useProjectHydration({ projectId, loaderProject })


  const { mode, autoplay, isDenied, isPending } = usePermissions()


  usePresentationAutostart({ mode, autoplay: !!autoplay, isPending })


  const { proceed, reset, status, syncProjects } = useProjectSync({
    isPending,
    isSynced: project?.synced ?? true
  })


  useEditorShortcuts()


  const blocker = {
    proceed,
    reset,
    status,
    syncProjects
  }

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
      projectId={projectId} 
      blocker={blocker}
    />
  )
}

