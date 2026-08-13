import type { StateCreator } from 'zustand'
import type { EditorState } from '../editor-store'
import type { Project } from '@motionslides/shared'
import { uuid } from '@/lib/uuid'

export interface SnapshotSlice {
  snapshots: Record<string, { projects: Project[]; activeProjectId: string | null }>
  snapshotIds: string[]
  pushSnapshot: () => string
  restoreSnapshot: (id: string) => void
  discardSnapshot: (id: string) => void
}

export const createSnapshotSlice: StateCreator<EditorState, [], [], SnapshotSlice> = (set, get) => ({
  snapshots: {},
  snapshotIds: [],

  pushSnapshot: () => {
    const id = uuid()
    const { projects, activeProjectId, snapshotIds } = get()
    
    // Deep clone projects to prevent mutation of the snapshot
    const clonedProjects = JSON.parse(JSON.stringify(projects)) as Project[]
    
    set((state) => {
      const newSnapshots = {
        ...state.snapshots,
        [id]: { projects: clonedProjects, activeProjectId },
      }
      const newIds = [...state.snapshotIds, id]
      
      // Enforce 50-item limit to prevent memory bloat
      if (newIds.length > 50) {
        const oldestId = newIds.shift()!
        delete newSnapshots[oldestId]
      }
      
      return { snapshots: newSnapshots, snapshotIds: newIds }
    })
    
    return id
  },

  restoreSnapshot: (id: string) => {
    const snapshot = get().snapshots[id]
    if (!snapshot) return
    
    // Deep clone again to prevent accidental mutation of the snapshot in store
    const clonedProjects = JSON.parse(JSON.stringify(snapshot.projects)) as Project[]
    
    set((state) => {
      return {
        projects: clonedProjects,
        activeProjectId: snapshot.activeProjectId,
      }
    })
  },

  discardSnapshot: (id: string) => {
    set((state) => {
      const newSnapshots = { ...state.snapshots }
      delete newSnapshots[id]
      const newIds = state.snapshotIds.filter(sid => sid !== id)
      return { snapshots: newSnapshots, snapshotIds: newIds }
    })
  },
})
