import type { StateCreator } from 'zustand'
import type { SceneElement } from '@/types'
import type { EditorState } from '@/store/editorStore'

export interface ElementSlice {
  selectedElementId: string | null
  setSelectedElement: (id: string | null) => void
  addElement: (element: SceneElement) => void
  updateElement: (id: string, updates: Partial<SceneElement>) => void
  deleteElement: (id: string) => void
}

export const createElementSlice: StateCreator<EditorState, [], [], ElementSlice> = (set, get) => ({
  selectedElementId: null,

  setSelectedElement: (id) => set({ selectedElementId: id }),

  addElement: (element) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          return { ...sl, elements: [...sl.elements, element] }
        })
        return { ...p, slides, updatedAt: Date.now() }
      }),
    }))
  },

  updateElement: (id, updates) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          return {
            ...sl,
            elements: sl.elements.map((el) =>
              el.id === id ? ({ ...el, ...updates } as SceneElement) : el,
            ),
          }
        })
        return { ...p, slides, updatedAt: Date.now() }
      }),
    }))
  },

  deleteElement: (id) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          return { ...sl, elements: sl.elements.filter((el) => el.id !== id) }
        })
        return { ...p, slides, updatedAt: Date.now() }
      }),
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
    }))
  },
})
