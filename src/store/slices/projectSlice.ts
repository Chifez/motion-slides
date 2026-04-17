import type { StateCreator } from 'zustand'
import type { Project } from '@/types'
import { createDefaultProject } from '@/store/defaults'
import type { EditorState } from '@/store/editorStore'

export interface ProjectSlice {
  projects: Project[]
  activeProjectId: string | null

  createProject: (name?: string) => Project
  deleteProject: (id: string) => void
  loadProject: (id: string) => void
  updateProjectName: (id: string, name: string) => void

  activeProject: () => Project | null
}

export const createProjectSlice: StateCreator<EditorState, [], [], ProjectSlice> = (set, get) => ({
  projects: [],
  activeProjectId: null,

  activeProject: () => {
    const { projects, activeProjectId } = get()
    return projects.find((p) => p.id === activeProjectId) ?? null
  },

  createProject: (name) => {
    const project = createDefaultProject(name)
    set((s) => ({
      projects: [...s.projects, project],
      activeProjectId: project.id,
      activeSlideIndex: 0,
      selectedElementId: null,
    }))
    return project
  },

  deleteProject: (id) => {
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
    }))
  },

  loadProject: (id) => {
    set({ activeProjectId: id, activeSlideIndex: 0, selectedElementId: null })
  },

  updateProjectName: (id, name) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, name, updatedAt: Date.now() } : p,
      ),
    }))
  },
})
