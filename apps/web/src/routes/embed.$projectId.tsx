import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { storeHydrationPromise } from '@/store/editorStore'
import { HydrationGuard } from '@/components/editor/HydrationGuard'
import { PermissionProvider } from '@/context/PermissionContext'
import { LoadingPage } from '@/components/ui/LoadingPage'
import { loadProjectForRoute } from '@/lib/loaders/projectLoader'
import { EmbedContainer } from '@/components/editor/embed/EmbedContainer'

const embedSearchSchema = z.object({
  theme: z.enum(['dark', 'light']).optional().catch('dark'),
  autoplay: z.string().optional().catch('false'),
  loop: z.string().optional().catch('true'),
  controls: z.string().optional().catch('true'),
  key: z.string().optional(),
})

export const Route = createFileRoute('/embed/$projectId')({
  validateSearch: (search) => embedSearchSchema.parse(search),
  loaderDeps: ({ search: { key } }) => ({ key }),
  loader: async ({ params, deps }) => {
    await storeHydrationPromise
    return loadProjectForRoute(params.projectId, deps.key)
  },
  head: ({ loaderData }) => {
    const data = loaderData as { project?: any | null }
    const project = data?.project
    const title = project ? `Embed: ${project.name} - MotionSlides` : 'Embed - MotionSlides'
    const desc = project 
      ? `Embedded presentation player for "${project.name}" on MotionSlides.` 
      : 'Embedded presentation player on MotionSlides.'
      
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
  component: EmbedPage,
})

// Specific read-only permissions for embeds
const EMBED_ACCESS = {
  mode: 'present' as const,
  canEdit: false,
  isReadOnly: true,
  autoplay: false, // Driven internally by autoplay settings
  isAuthenticated: true,
  isDenied: false,
  isPending: false,
}

function EmbedPage() {
  const loaderData = Route.useLoaderData() as unknown as { project?: any | null }
  const project = loaderData?.project
  const title = project ? `Embed: ${project.name} - MotionSlides` : 'Embed - MotionSlides'

  return (
    <HydrationGuard>
      <title>{title}</title>
      <PermissionProvider value={EMBED_ACCESS}>
        <EmbedContainer />
      </PermissionProvider>
    </HydrationGuard>
  )
}
