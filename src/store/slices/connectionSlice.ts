import type { StateCreator } from 'zustand'
import type { Connection, AnchorPosition } from '@/types'
import type { EditorState } from '@/store/editorStore'

export interface ConnectionSlice {
  // Connection drawing mode
  connectMode: boolean
  connectSourceId: string | null
  connectSourceAnchor: AnchorPosition | null
  selectedConnectionId: string | null

  setConnectMode: (active: boolean) => void
  setConnectSource: (elementId: string, anchor: AnchorPosition) => void
  clearConnectSource: () => void
  setSelectedConnection: (id: string | null) => void

  addConnection: (connection: Connection) => void
  updateConnection: (id: string, updates: Partial<Connection>) => void
  deleteConnection: (id: string) => void
}

export const createConnectionSlice: StateCreator<EditorState, [], [], ConnectionSlice> = (set, get) => ({
  connectMode: false,
  connectSourceId: null,
  connectSourceAnchor: null,
  selectedConnectionId: null,

  setConnectMode: (active) => {
    set({
      connectMode: active,
      connectSourceId: null,
      connectSourceAnchor: null,
      selectedConnectionId: null,
      selectedElementId: null,
    })
  },

  setConnectSource: (elementId, anchor) => {
    set({ connectSourceId: elementId, connectSourceAnchor: anchor })
  },

  clearConnectSource: () => {
    set({ connectSourceId: null, connectSourceAnchor: null })
  },

  setSelectedConnection: (id) => {
    set({ selectedConnectionId: id, selectedElementId: null })
  },

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
      connectSourceId: null,
      connectSourceAnchor: null,
    }))
  },

  updateConnection: (id, updates) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          return {
            ...sl,
            connections: sl.connections.map((c) =>
              c.id === id ? { ...c, ...updates } : c,
            ),
          }
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
      selectedConnectionId: s.selectedConnectionId === id ? null : s.selectedConnectionId,
    }))
  },
})
