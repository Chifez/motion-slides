import type { StateCreator } from 'zustand'
import type { SceneElement } from '@/types'
import type { EditorState } from '@/store/editorStore'

export interface ElementSlice {
  selectedElementId: string | null
  setSelectedElement: (id: string | null) => void
  addElement: (element: SceneElement) => void
  updateElement: (id: string, updates: Partial<SceneElement>) => void
  deleteElement: (id: string) => void
  toggleElementLock: (id: string) => void
  duplicateElement: (id: string) => void
  groupElements: (ids: string[]) => void
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
  
  toggleElementLock: (id) => {
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
              el.id === id ? { ...el, locked: !el.locked } : el
            ),
          }
        })
        return { ...p, slides, updatedAt: Date.now() }
      }),
    }))
  },

  duplicateElement: (id) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    const project = get().projects.find(p => p.id === activeProjectId)
    const element = project?.slides[activeSlideIndex]?.elements.find(el => el.id === id)
    if (!element) return

    const newElement: SceneElement = {
      ...element,
      id: `el-${Math.random().toString(36).substr(2, 9)}`,
      position: { x: element.position.x + 20, y: element.position.y + 20 },
      zIndex: element.zIndex + 1,
    }
    get().addElement(newElement)
    get().setSelectedElement(newElement.id)
  },

  groupElements: (ids) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId || ids.length < 2) return
    const groupId = `group-${Math.random().toString(36).substr(2, 9)}`
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          return {
            ...sl,
            elements: sl.elements.map((el) =>
              ids.includes(el.id) ? { ...el, groupId } : el
            ),
          }
        })
        return { ...p, slides, updatedAt: Date.now() }
      }),
    }))
  },
})
