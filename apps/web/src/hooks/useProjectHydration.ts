import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import type { Project } from '@motionslides/shared'

interface Options {
  projectId: string
  loaderProject: Project | null
}

/**
 * Imports a project from loader data into the store when it isn't
 * already present (guest / incognito access pattern).
 */
export function useProjectHydration({ projectId, loaderProject }: Options) {
  const project = useEditorStore(state => state.projects.find(projectItem => projectItem.id === projectId))
  const importProject = useEditorStore(state => state.importProject)
  const loadProject = useEditorStore(state => state.loadProject)

  useEffect(() => {
    if (loaderProject) {
      importProject(loaderProject)
    }
    loadProject(projectId)
  }, [projectId, loaderProject, importProject, loadProject])

  return project
}
