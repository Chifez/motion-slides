import type { StateCreator } from 'zustand'
import type { Project, Slide } from '@motionslides/shared'
import { createDefaultProject } from '@/store/defaults'
import type { EditorState } from '@/store/editorStore'
import { deleteRemoteProjectAction } from '@/lib/actions/project'

export interface ProjectSlice {
  projects: Project[]
  activeProjectId: string | null

  createProject: (name?: string) => Project
  deleteProject: (id: string) => void
  removeLocalProject: (id: string) => void
  loadProject: (id: string) => void
  updateProjectName: (id: string, name: string) => void
  updateProjectVisibility: (id: string, visibility: Project['visibility']) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  updateAllSlidesBackground: (projectId: string, background: string) => void
  addSlidesToProject: (projectId: string, slides: Slide[]) => void
  importProject: (project: Project) => void

  activeProject: () => Project | null
}

export const createProjectSlice: StateCreator<EditorState, [], [], ProjectSlice> = (set, get) => ({
  projects: [],
  activeProjectId: null,

  activeProject: () => {
    const { projects, activeProjectId } = get()
    return projects.find((projectItem) => projectItem.id === activeProjectId) ?? null
  },

  createProject: (name) => {
    const isFirst = get().projects.length === 0
    const user = get().user
    const localAuthorId = get().localAuthorId
    const project = createDefaultProject(name, isFirst, user?.id, localAuthorId)
    set((state) => ({
      projects: [...state.projects, project],
      activeProjectId: project.id,
      activeSlideIndex: 0,
      selectedElementIds: [],
    }))
    return project
  },

  addSlidesToProject: (projectId, newSlides) => {
    set((state) => {
      const project = state.projects.find(projectItem => projectItem.id === projectId)
      if (!project) return state
      
      const startIndex = project.slides.length
      return {
        projects: state.projects.map((projectItem) =>
          projectItem.id === projectId ? { ...projectItem, slides: [...projectItem.slides, ...newSlides], updatedAt: Date.now(), synced: false } : projectItem,
        ),
        activeSlideIndex: startIndex,
      }
    })
  },

  deleteProject: (id) => {
    set((state) => {
      const project = state.projects.find(projectItem => projectItem.id === id)
      
      // If the project was synced/remote, we must explicitly delete it from the server
      // because our bulk-sync only handles upserts, not deletions.
      if (project?.synced) {
        deleteRemoteProjectAction({ data: { projectId: id } })
          .catch(error => console.error('Failed to delete remote project:', error))
      }

      return {
        projects: state.projects.filter((projectItem) => projectItem.id !== id),
        activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
      }
    })
  },

  removeLocalProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((projectItem) => projectItem.id !== id),
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
    }))
  },

  importProject: (remoteProject) => {
    set((state) => {
      const local = state.projects.find((projectItem) => projectItem.id === remoteProject.id)
      
      if (local && !local.synced) {
        // Retain local collaborator edits when merging remote updates to prevent losing unsynced progress.
        const reconciled: Project = {
          ...local,
          ownerId: remoteProject.ownerId,
          visibility: remoteProject.visibility,
          shareKey: remoteProject.shareKey ?? local.shareKey,
        }
        return {
          projects: state.projects.map((projectItem) => (projectItem.id === remoteProject.id ? reconciled : projectItem)),
        }
      }

      // Merge Strategy:
      // 1. Remote data is the source of truth for content (slides, transitions, etc.)
      // 2. Local data is preserved for device-specific metadata (localAuthorId)
      // 3. 'synced' is set to true because this project just came from the server
      const reconciled: Project = {
        ...remoteProject,
        localAuthorId: local?.localAuthorId ?? remoteProject.localAuthorId,
        parentUpdatedAt: local?.parentUpdatedAt ?? remoteProject.updatedAt,
        synced: true,
      }

      if (local) {
        return {
          projects: state.projects.map((projectItem) => (projectItem.id === remoteProject.id ? reconciled : projectItem)),
        }
      }
      return { projects: [...state.projects, reconciled] }
    })
  },

  loadProject: (id) => {
    set((state) => ({
      activeProjectId: id,
      activeSlideIndex: 0,
      selectedElementIds: [],
      projects: state.projects.map((projectItem) => {
        if (projectItem.id !== id) return projectItem
        return {
          ...projectItem,
          transitions: projectItem.transitions ?? [],
          prototypeLayout: projectItem.prototypeLayout ?? {},
          slides: projectItem.slides.map((slideItem) => ({
            ...slideItem,
            name: slideItem.name ?? '',
          })),
        }
      }),
    }))
  },

  updateProjectName: (id, name) => {
    set((state) => ({
      projects: state.projects.map((projectItem) => {
        if (projectItem.id !== id) return projectItem
        return { ...projectItem, name, updatedAt: Math.max(Date.now(), (projectItem.updatedAt ?? 0) + 1), synced: false }
      }),
    }))
  },
  
  updateProjectVisibility: (id, visibility) => {
    set((state) => ({
      projects: state.projects.map((projectItem) => {
        if (projectItem.id !== id) return projectItem
        return { ...projectItem, visibility, updatedAt: Math.max(Date.now(), (projectItem.updatedAt ?? 0) + 1), synced: false }
      }),
    }))
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((projectItem) => {
        if (projectItem.id !== id) return projectItem
        return {
          ...projectItem,
          ...updates,
          updatedAt: updates.updatedAt !== undefined ? updates.updatedAt : Math.max(Date.now(), (projectItem.updatedAt ?? 0) + 1),
          synced: updates.synced !== undefined ? updates.synced : false,
        }
      }),
    }))
  },

  updateAllSlidesBackground: (projectId, background) => {
    set((state) => ({
      projects: state.projects.map((projectItem) => {
        if (projectItem.id !== projectId) return projectItem
        return {
          ...projectItem,
          slides: projectItem.slides.map(slideItem => ({ ...slideItem, background })),
          updatedAt: Math.max(Date.now(), (projectItem.updatedAt ?? 0) + 1),
          synced: false
        }
      })
    }))
  },
})
