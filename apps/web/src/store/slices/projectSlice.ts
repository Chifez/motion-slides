import type { StateCreator } from 'zustand'
import type { Project, Slide } from '@motionslides/shared'
import { createDefaultProject } from '@/store/defaults'
import type { EditorState } from '@/store/editorStore'

export interface ProjectSlice {
  projects: Project[]
  activeProjectId: string | null

  createProject: (name?: string) => Project
  deleteProject: (id: string) => void
  loadProject: (id: string) => void
  updateProjectName: (id: string, name: string) => void
  addSlidesToProject: (projectId: string, slides: Slide[]) => void
  importProject: (project: Project) => void

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
    const isFirst = get().projects.length === 0
    const project = createDefaultProject(name, isFirst)
    set((s) => ({
      projects: [...s.projects, project],
      activeProjectId: project.id,
      activeSlideIndex: 0,
      selectedElementIds: [],
    }))
    return project
  },

  addSlidesToProject: (projectId, newSlides) => {
    set((s) => {
      const project = s.projects.find(p => p.id === projectId)
      if (!project) return s
      
      const startIndex = project.slides.length
      return {
        projects: s.projects.map((p) =>
          p.id === projectId ? { ...p, slides: [...p.slides, ...newSlides], updatedAt: Date.now() } : p,
        ),
        activeSlideIndex: startIndex, // Jump to the first newly added slide
      }
    })
  },

  deleteProject: (id) => {
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
    }))
  },

  importProject: (project) => {
    set((s) => {
      const exists = s.projects.some((p) => p.id === project.id)
      if (exists) {
        return {
          projects: s.projects.map((p) => (p.id === project.id ? { ...project, synced: true } : p)),
        }
      }
      return { projects: [...s.projects, { ...project, synced: true }] }
    })
  },

  loadProject: (id) => {
    // Migrate existing projects that might lack new fields
    set((s) => ({
      activeProjectId: id,
      activeSlideIndex: 0,
      selectedElementIds: [],
      projects: s.projects.map((p) => {
        if (p.id !== id) return p
        return {
          ...p,
          transitions: p.transitions ?? [],
          prototypeLayout: p.prototypeLayout ?? {},
          slides: p.slides.map((sl) => ({
            ...sl,
            name: sl.name ?? '',
          })),
        }
      }),
    }))
  },

  updateProjectName: (id, name) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, name, updatedAt: Date.now() } : p,
      ),
    }))
  },
})
