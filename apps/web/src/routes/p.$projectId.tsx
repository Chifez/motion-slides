import { createFileRoute } from '@tanstack/react-router'
import { storeHydrationPromise } from '@/store/editorStore'
import { HydrationGuard } from '@/components/editor/HydrationGuard'
import { PermissionProvider } from '@/context/PermissionContext'
import { LoadingPage } from '@/components/ui/LoadingPage'
import { loadProjectForRoute } from '@/lib/loaders/projectLoader'
import { ProjectContainer } from '@/components/editor/ProjectContainer'
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
    return loadProjectForRoute(params.projectId, deps.key)
  },
  pendingComponent: LoadingPage,
  component: ProjectPage,
})

/**
 * Outer shell — owns only the SSR hydration guard.
 */
function ProjectPage() {
  return (
    <HydrationGuard>
      <PermissionProvider>
        <ProjectContainer />
      </PermissionProvider>
    </HydrationGuard>
  )
}
