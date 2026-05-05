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
  const project = useEditorStore(s => s.projects.find(p => p.id === projectId))
  const importProject = useEditorStore(s => s.importProject)
  const loadProject = useEditorStore(s => s.loadProject)

  useEffect(() => {
    if (loaderProject && !project) {
      importProject(loaderProject)
      loadProject(loaderProject.id)
    }
  }, [loaderProject, project, importProject, loadProject])

  return project
}
