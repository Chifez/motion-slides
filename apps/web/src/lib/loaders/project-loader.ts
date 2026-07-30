import { useEditorStore } from '@/store/editor-store'
import { getRemoteProjectAction } from '@/lib/actions/project'
import type { Project } from '@motionslides/shared'

const MAX_ATTEMPTS = 3

export async function loadProjectForRoute(projectId: string, shareKey?: string) {
  const store = useEditorStore.getState()
  const isServer = typeof window === 'undefined'
  
  const localProject = !isServer && store.projects.find(projectItem => projectItem.id === projectId)
  const isOwner = localProject && store.user && localProject.ownerId === store.user.id
  const isLocalAuthor = localProject && store.localAuthorId && localProject.localAuthorId === store.localAuthorId

  const activeShareKey = shareKey ?? (localProject && localProject.shareKey ? localProject.shareKey : undefined)

  // Avoid redundant network requests when the current client is the verified owner or local author of the project copy.
  const canLoadLocallyWithoutFetch = localProject && (isOwner || isLocalAuthor) && !shareKey
  const isOffline = !isServer && !window.navigator.onLine

  if (canLoadLocallyWithoutFetch || (isOffline && localProject)) {
    store.loadProject(projectId)
    if (store.user && !isOffline) store.syncProjects()
    return { project: null }
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const remoteProject = await getRemoteProjectAction({
        data: { projectId, shareKey: activeShareKey }
      })
      
      if (remoteProject) {
        const projectWithKey: Project = {
          ...remoteProject,
          shareKey: activeShareKey ?? remoteProject.shareKey
        }

        store.importProject(projectWithKey)
        store.loadProject(projectId)
        return { project: projectWithKey }
      } else {
        // Project not found in remote DB — do not retry
        break
      }
    } catch (error: unknown) {
      const isAccessDenied = (error instanceof Error ? error.message : String(error)).includes('Access Denied')
      
      if (isAccessDenied && !isServer) {
        store.removeLocalProject(projectId)
      }

      if (isServer || isAccessDenied) {
        return { project: null, accessDenied: isAccessDenied }
      }

      if (attempt === MAX_ATTEMPTS) {
        // Prevent connection dropouts from locking users out of their active local work session.
        if (localProject) {
          store.loadProject(projectId)
          return { project: null }
        }
        throw error 
      }
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }

  store.loadProject(projectId) 
  return { project: null }
}

