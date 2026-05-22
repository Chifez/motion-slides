import { useEditorStore } from '@/store/editorStore'
import { getRemoteProjectAction } from '@/lib/actions/project'
import type { Project } from '@motionslides/shared'

const MAX_ATTEMPTS = 3

export async function loadProjectForRoute(projectId: string, shareKey?: string) {
  const store = useEditorStore.getState()
  const isServer = typeof window === 'undefined'
  
  const localProject = !isServer && store.projects.find(projectItem => projectItem.id === projectId)
  const isOwner = localProject && store.user && localProject.ownerId === store.user.id
  const isLocalAuthor = localProject && store.localAuthorId && localProject.localAuthorId === store.localAuthorId

  // Only bypass the remote fetch if:
  // 1. The project exists locally.
  // 2. The user is the cloud owner or local creator.
  // 3. No share key is provided (meaning they aren't testing/accessing via a shareable link).
  const canLoadLocallyWithoutFetch = localProject && (isOwner || isLocalAuthor) && !shareKey

  if (canLoadLocallyWithoutFetch) {
    store.loadProject(projectId)
    if (store.user) store.syncProjects()
    return { project: null }
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const remoteProject = await getRemoteProjectAction({
        data: { projectId, shareKey }
      })
      
      if (remoteProject) {
        const projectWithKey: Project = {
          ...remoteProject,
          shareKey: shareKey ?? remoteProject.shareKey
        }

        store.importProject(projectWithKey)
        store.loadProject(projectId)
        return { project: projectWithKey }
      }
    } catch (error: unknown) {
      // If it's an explicit access denial, don't bother retrying
      const isAccessDenied = (error instanceof Error ? error.message : String(error)).includes('Access Denied')
      
      if (isAccessDenied && !isServer) {
        // Clean up the local project cache if we are now denied access
        store.removeLocalProject(projectId)
      }

      if (isServer || isAccessDenied) {
        // On the server, we never throw. We return null and let the client hydrate.
        // On client access denial, we return accessDenied flag to trigger error UI immediately.
        return { project: null, accessDenied: isAccessDenied }
      }

      if (attempt === MAX_ATTEMPTS) throw error 
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }

  store.loadProject(projectId) 
  return { project: null }
}
