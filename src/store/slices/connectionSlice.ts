import type { StateCreator } from 'zustand'
import type { Connection } from '@/types'
import type { EditorState } from '@/store/editorStore'

export interface ConnectionSlice {
  addConnection: (connection: Connection) => void
  deleteConnection: (id: string) => void
}

export const createConnectionSlice: StateCreator<EditorState, [], [], ConnectionSlice> = (set, get) => ({
  addConnection: (connection) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          return { ...sl, connections: [...sl.connections, connection] }
        })
        return { ...p, slides, updatedAt: Date.now() }
      }),
    }))
  },

  deleteConnection: (id) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          return { ...sl, connections: sl.connections.filter((c) => c.id !== id) }
        })
        return { ...p, slides, updatedAt: Date.now() }
      }),
    }))
  },
})
