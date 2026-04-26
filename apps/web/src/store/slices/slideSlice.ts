import type { StateCreator } from 'zustand'
import type { Slide } from '@motionslides/shared'
import { nanoid } from '@/lib/nanoid'
import { createDefaultSlide } from '@/store/defaults'
import type { EditorState } from '@/store/editorStore'

export interface SlideSlice {
  activeSlideIndex: number
  addSlide: () => void
  deleteSlide: (index: number) => void
  duplicateSlide: (index: number) => void
  setActiveSlide: (index: number) => void
  updateSlide: (updates: Partial<Pick<Slide, 'name' | 'background'>>) => void
  activeSlide: () => Slide | null
}

export const createSlideSlice: StateCreator<EditorState, [], [], SlideSlice> = (set, get) => ({
  activeSlideIndex: 0,

  activeSlide: () => {
    const { activeSlideIndex } = get()
    const project = get().activeProject()
    if (!project) return null
    return project.slides[activeSlideIndex] ?? null
  },

  addSlide: () => {
    const { activeProjectId } = get()
    if (!activeProjectId) return
    const project = get().activeProject()
    const slideNum = (project?.slides.length ?? 0) + 1
    const newSlide = createDefaultSlide({ name: `Slide ${slideNum}` })
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id !== activeProjectId
          ? p
          : { ...p, slides: [...p.slides, newSlide], updatedAt: Date.now() },
      ),
      activeSlideIndex: get().activeProject()!.slides.length,
    }))
  },

  deleteSlide: (index) => {
    const { activeProjectId } = get()
    if (!activeProjectId) return
    set((s) => {
      const project = s.projects.find((p) => p.id === activeProjectId)!
      const newSlides = project.slides.filter((_, i) => i !== index)
      return {
        projects: s.projects.map((p) =>
          p.id !== activeProjectId ? p : { ...p, slides: newSlides, updatedAt: Date.now() },
        ),
        activeSlideIndex: Math.min(s.activeSlideIndex, newSlides.length - 1),
      }
    })
  },

  duplicateSlide: (index) => {
    const { activeProjectId } = get()
    if (!activeProjectId) return
    
    const project = get().projects.find((p) => p.id === activeProjectId)!
    const original = project.slides[index]
    const newSlideId = nanoid()

    const clone: Slide = {
      ...original,
      id: newSlideId,
      name: `${original.name || 'Slide'} (Copy)`,
      // SAME element IDs — enables Magic Move morphing between slides
      elements: original.elements.map((el) => ({ ...el })),
    }

    const newSlides = [
      ...project.slides.slice(0, index + 1),
      clone,
      ...project.slides.slice(index + 1),
    ]

    set((s) => ({
      projects: s.projects.map((p) =>
        p.id !== activeProjectId ? p : { ...p, slides: newSlides, updatedAt: Date.now() },
      ),
      activeSlideIndex: index + 1,
    }))

    // Automatically add a Magic Move transition from the original to the clone
    get().addTransition({
      fromSlideId: original.id,
      toSlideId: newSlideId,
      animation: 'magic-move',
      duration: 0.8,
      ease: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 },
      trigger: 'click'
    })
  },

  updateSlide: (updates) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          return { ...sl, ...updates }
        })
        return { ...p, slides, updatedAt: Date.now() }
      }),
    }))
  },

  setActiveSlide: (index) => {
    set({ activeSlideIndex: index, selectedElementIds: [] })
  },
})
