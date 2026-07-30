import type { StateCreator } from 'zustand'
import type { EditorState } from '../editor-store'
import type { Project } from '@motionslides/shared'
import { uuid } from '@/lib/uuid'

export interface SnapshotSlice {
  snapshots: Record<string, { projects: Project[]; activeProjectId: string | null }>
  pushSnapshot: () => string
  restoreSnapshot: (id: string) => void
  discardSnapshot: (id: string) => void
}

export const createSnapshotSlice: StateCreator<EditorState, [], [], SnapshotSlice> = (set, get) => ({
  snapshots: {},

  pushSnapshot: () => {
    const id = uuid()
    const { projects, activeProjectId } = get()
    
    // Deep clone projects to prevent mutation of the snapshot
    const clonedProjects = JSON.parse(JSON.stringify(projects)) as Project[]
    
    set((state) => ({
      snapshots: {
        ...state.snapshots,
        [id]: { projects: clonedProjects, activeProjectId },
      },
    }))
    
    return id
  },

  restoreSnapshot: (id: string) => {
    const snapshot = get().snapshots[id]
    if (!snapshot) return
    
    // Deep clone again to prevent accidental mutation of the snapshot in store
    const clonedProjects = JSON.parse(JSON.stringify(snapshot.projects)) as Project[]
    
    set((state) => {
      const newSnapshots = { ...state.snapshots }
      delete newSnapshots[id]
      
      return {
        projects: clonedProjects,
        activeProjectId: snapshot.activeProjectId,
        snapshots: newSnapshots,
      }
    })
  },

  discardSnapshot: (id: string) => {
    set((state) => {
      const newSnapshots = { ...state.snapshots }
      delete newSnapshots[id]
      return { snapshots: newSnapshots }
    })
  },
})
