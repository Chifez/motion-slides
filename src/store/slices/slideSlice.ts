import type { StateCreator } from 'zustand'
import type { Slide } from '@/types'
import { nanoid } from '@/lib/nanoid'
import { createDefaultSlide } from '@/store/defaults'
import type { EditorState } from '@/store/editorStore'

export interface SlideSlice {
  activeSlideIndex: number
  addSlide: () => void
  deleteSlide: (index: number) => void
  /**
   * Duplicate a slide with NEW element IDs.
   * Elements will NOT Magic Move between the original and the clone.
   * Use this when you want a fully independent slide.
   */
  duplicateSlide: (index: number) => void
  /**
   * Duplicate a slide PRESERVING all element IDs.
   * Elements will Magic Move between the original and the clone —
   * ideal for creating a "before/after" animation where items shift/morph.
   */
  duplicateSlideKeepIds: (index: number) => void
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
    set((s) => {
      const project = s.projects.find((p) => p.id === activeProjectId)!
      const original = project.slides[index]
      const clone: Slide = {
        ...original,
        id: nanoid(),
        name: `${original.name || 'Slide'} copy`,
        // NEW IDs — no Magic Move between original and clone
        elements: original.elements.map((el) => ({ ...el, id: nanoid() })),
      }
      const newSlides = [
        ...project.slides.slice(0, index + 1),
        clone,
        ...project.slides.slice(index + 1),
      ]
      return {
        projects: s.projects.map((p) =>
          p.id !== activeProjectId ? p : { ...p, slides: newSlides, updatedAt: Date.now() },
        ),
        activeSlideIndex: index + 1,
      }
    })
  },

  duplicateSlideKeepIds: (index) => {
    const { activeProjectId } = get()
    if (!activeProjectId) return
    set((s) => {
      const project = s.projects.find((p) => p.id === activeProjectId)!
      const original = project.slides[index]
      const clone: Slide = {
        ...original,
        id: nanoid(),
        name: `${original.name || 'Slide'} (Magic Move)`,
        // SAME element IDs — enables Magic Move morphing between slides
        elements: original.elements.map((el) => ({ ...el })),
      }
      const newSlides = [
        ...project.slides.slice(0, index + 1),
        clone,
        ...project.slides.slice(index + 1),
      ]
      return {
        projects: s.projects.map((p) =>
          p.id !== activeProjectId ? p : { ...p, slides: newSlides, updatedAt: Date.now() },
        ),
        activeSlideIndex: index + 1,
      }
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
    set({ activeSlideIndex: index, selectedElementId: null })
  },
})
