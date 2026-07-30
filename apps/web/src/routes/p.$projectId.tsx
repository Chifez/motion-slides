import { createFileRoute } from '@tanstack/react-router'
import { storeHydrationPromise } from '@/store/editor-store'
import { HydrationGuard } from '@/components/editor/hydration-guard'
import { PermissionProvider } from '@/context/permission-context'
import { LoadingPage } from '@/components/ui/loading-page'
import { loadProjectForRoute } from '@/lib/loaders/project-loader'
import { ProjectContainer } from '@/components/editor/project-container'
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
  head: ({ loaderData }) => {
    const data = loaderData as { project?: any | null }
    const project = data?.project
    const title = project ? `${project.name} - MotionSlides` : 'Presentation - MotionSlides'
    const desc = project 
      ? `View "${project.name}" on MotionSlides. A cinematic, motion-first presentation deck.` 
      : 'Cinematic, motion-first presentations for developers and designers.'
      
    return {
      meta: [
        { title },
        { name: 'description', content: desc },
        { property: 'og:title', content: title },
        { property: 'og:description', content: desc },
        { property: 'og:image', content: '/og-image.png' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: desc },
        { name: 'twitter:image', content: '/og-image.png' },
      ]
    }
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
