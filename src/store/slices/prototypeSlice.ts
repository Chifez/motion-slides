import type { StateCreator } from 'zustand'
import type { SlideTransition } from '@/types'
import { nanoid } from '@/lib/nanoid'
import type { EditorState } from '@/store/editorStore'

export interface PrototypeSlice {
  isPrototypeMode: boolean
  selectedTransitionId: string | null

  setPrototypeMode: (active: boolean) => void
  addTransition: (transition: Omit<SlideTransition, 'id'>) => void
  updateTransition: (id: string, updates: Partial<SlideTransition>) => void
  deleteTransition: (id: string) => void
  setSelectedTransition: (id: string | null) => void
  updateSlidePosition: (slideId: string, pos: { x: number; y: number }) => void
}

export const createPrototypeSlice: StateCreator<EditorState, [], [], PrototypeSlice> = (set, get) => ({
  isPrototypeMode: false,
  selectedTransitionId: null,

  setPrototypeMode: (active) => {
    set({ isPrototypeMode: active, selectedElementId: null, selectedTransitionId: null })
  },

  addTransition: (data) => {
    const { activeProjectId } = get()
    if (!activeProjectId) return
    const transition: SlideTransition = { ...data, id: nanoid() }
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id !== activeProjectId
          ? p
          : { ...p, transitions: [...p.transitions, transition], updatedAt: Date.now() },
      ),
    }))
  },

  updateTransition: (id, updates) => {
    const { activeProjectId } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id !== activeProjectId
          ? p
          : {
              ...p,
              transitions: p.transitions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
              updatedAt: Date.now(),
            },
      ),
    }))
  },

  deleteTransition: (id) => {
    const { activeProjectId } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id !== activeProjectId
          ? p
          : { ...p, transitions: p.transitions.filter((t) => t.id !== id), updatedAt: Date.now() },
      ),
      selectedTransitionId: s.selectedTransitionId === id ? null : s.selectedTransitionId,
    }))
  },

  setSelectedTransition: (id) => {
    set({ selectedTransitionId: id })
  },

  updateSlidePosition: (slideId, pos) => {
    const { activeProjectId } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id !== activeProjectId
          ? p
          : {
              ...p,
              prototypeLayout: { ...p.prototypeLayout, [slideId]: pos },
              updatedAt: Date.now(),
            },
      ),
    }))
  },
})
