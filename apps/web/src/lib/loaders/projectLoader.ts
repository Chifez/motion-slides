import { useEditorStore } from '@/store/editorStore'
import { getRemoteProjectAction } from '@/lib/actions/project'

const MAX_ATTEMPTS = 3

export async function loadProjectForRoute(projectId: string, shareKey?: string) {
  console.log(`[loadProjectForRoute] STARTED: projectId=${projectId}, shareKey=${shareKey}`)
  const store = useEditorStore.getState()
  const isServer = typeof window === 'undefined'
  
  const localProject = !isServer && store.projects.find(p => p.id === projectId)
  const isOwner = localProject && store.user && localProject.ownerId === store.user.id
  const isLocalAuthor = localProject && store.localAuthorId && localProject.localAuthorId === store.localAuthorId

  console.log(`[loadProjectForRoute] LOCAL CHECK:`, {
    hasLocalProject: !!localProject,
    isOwner,
    isLocalAuthor,
    shareKey
  })

  // Only bypass the remote fetch if:
  // 1. The project exists locally.
  // 2. The user is the cloud owner or local creator.
  // 3. No share key is provided (meaning they aren't testing/accessing via a shareable link).
  const canLoadLocallyWithoutFetch = localProject && (isOwner || isLocalAuthor) && !shareKey

  if (canLoadLocallyWithoutFetch) {
    console.log(`[loadProjectForRoute] LOADING LOCALLY without remote fetch`)
    store.loadProject(projectId)
    if (store.user) store.syncProjects()
    return { project: null }
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[loadProjectForRoute] FETCH REMOTE ATTEMPT ${attempt} for: ${projectId}`)
      const remoteProject = await getRemoteProjectAction({
        data: { projectId, shareKey }
      })
      
      console.log(`[loadProjectForRoute] FETCH SUCCESS:`, remoteProject)

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
      console.error(`[loadProjectForRoute] FETCH ERROR:`, err)
      // If it's an explicit access denial, don't bother retrying
      const isAccessDenied = err.message?.includes('Access Denied')
      
      if (isAccessDenied && !isServer) {
        console.log(`[loadProjectForRoute] ACCESS DENIED - Removing local cache for: ${projectId}`)
        // Clean up the local project cache if we are now denied access
        store.removeLocalProject(projectId)
      }

      if (isServer || isAccessDenied) {
        // On the server, we never throw. We return null and let the client hydrate.
        // On client access denial, we return accessDenied flag to trigger error UI immediately.
        return { project: null, accessDenied: isAccessDenied }
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
