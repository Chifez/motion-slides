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
        data: { projectId, shareKey }
      })

      if (remoteProject) {
        const projectWithKey = {
          ...remoteProject,
          shareKey: shareKey || (remoteProject as any).shareKey
        }

        store.importProject(projectWithKey as any)
        store.loadProject(projectId)
        return { project: projectWithKey as any }
      }
    } catch (err: any) {
      // If it's an explicit access denial, don't bother retrying
      const isAccessDenied = err.message?.includes('Access Denied')
      
      if (isServer || isAccessDenied) {
        // On the server, we never throw. We return null and let the client hydrate.
        // This prevents crashing when a user has a private project locally but is signed out.
        return { project: null }
      }

      if (attempt === MAX_ATTEMPTS) throw err 
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise(r => setTimeout(r, 1000 * attempt))
    }
  }

  store.loadProject(projectId) 
  return { project: null }
}
