import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import type { Project } from '@motionslides/shared'

interface UseEmbedProjectParams {
  projectId?: string
  propProject?: Project
  loaderProject?: Project | null
}

export function useEmbedProject({
  projectId,
  propProject,
  loaderProject
}: UseEmbedProjectParams) {
  const storeProject = useEditorStore(state => state.projects.find(p => p.id === projectId))
  const project = propProject ?? storeProject
  const importProject = useEditorStore(state => state.importProject)
  const loadProject = useEditorStore(state => state.loadProject)

  const activeSlideIndex = useEditorStore(s => s.activeSlideIndex)
  const previousSlideIndex = useEditorStore(s => s.previousSlideIndex)
  const playbackSettings = useEditorStore(s => s.playbackSettings)
  const setActiveSlide = useEditorStore(s => s.setActiveSlide)

  const initializedProjectIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (propProject) return
    if (projectId && initializedProjectIdRef.current === projectId) return

    if (loaderProject) {
      importProject(loaderProject)
    }
    if (projectId) {
      loadProject(projectId)
      initializedProjectIdRef.current = projectId
    }
  }, [projectId, loaderProject, importProject, loadProject, propProject])

  useEffect(() => {
    setActiveSlide(0)
  }, [setActiveSlide])

  return {
    project,
    activeSlideIndex,
    previousSlideIndex,
    playbackSettings,
    setActiveSlide
  }
}
