import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { type Project, type Slide, type SceneElement, type Connection } from '../types'
import { nanoid } from '../lib/nanoid'

// ─────────────────────────────────────────────
// Default seeded data for a new project
// ─────────────────────────────────────────────

function createDefaultSlide(overrides?: Partial<Slide>): Slide {
  return {
    id: nanoid(),
    elements: [],
    connections: [],
    background: '#0a0a0a',
    ...overrides,
  }
}

function createDefaultProject(name = 'Untitled Deck'): Project {
  const slide1 = createDefaultSlide({
    elements: [
      {
        id: 'el-title',
        type: 'text',
        position: { x: 80, y: 80 },
        size: { width: 640, height: 80 },
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        content: {
          value: 'My First Slide',
          fontSize: 48,
          fontWeight: 'bold',
          color: '#ffffff',
          align: 'left',
        },
      },
      {
        id: 'el-code',
        type: 'code',
        position: { x: 80, y: 200 },
        size: { width: 640, height: 120 },
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        content: {
          value: `const greet = () => {\n}`,
          language: 'javascript',
        },
      },
    ],
  })

  const slide2 = createDefaultSlide({
    elements: [
      {
        id: 'el-title',
        type: 'text',
        position: { x: 80, y: 40 },
        size: { width: 640, height: 80 },
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        content: {
          value: 'My First Slide',
          fontSize: 48,
          fontWeight: 'bold',
          color: '#ffffff',
          align: 'left',
        },
      },
      {
        id: 'el-code',
        type: 'code',
        position: { x: 80, y: 160 },
        size: { width: 640, height: 160 },
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        content: {
          value: `const greet = () => {\n  console.log('Hello, World!')\n  return true\n}`,
          language: 'javascript',
        },
      },
    ],
  })

  return {
    id: nanoid(),
    name,
    description: '',
    slides: [slide1, slide2],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    synced: false,
  }
}

// ─────────────────────────────────────────────
// Store Interface
// ─────────────────────────────────────────────

interface EditorState {
  projects: Project[]
  activeProjectId: string | null
  activeSlideIndex: number
  selectedElementId: string | null

  // Project actions
  createProject: (name?: string) => Project
  deleteProject: (id: string) => void
  loadProject: (id: string) => void
  updateProjectName: (id: string, name: string) => void

  // Slide actions
  addSlide: () => void
  deleteSlide: (index: number) => void
  duplicateSlide: (index: number) => void
  setActiveSlide: (index: number) => void

  // Element actions
  setSelectedElement: (id: string | null) => void
  addElement: (element: SceneElement) => void
  updateElement: (id: string, updates: Partial<SceneElement>) => void
  deleteElement: (id: string) => void

  // Connection actions
  addConnection: (connection: Connection) => void
  deleteConnection: (id: string) => void

  // Derived helpers
  activeProject: () => Project | null
  activeSlide: () => Slide | null
}

// ─────────────────────────────────────────────
// Zustand Store with SessionStorage persistence
// ─────────────────────────────────────────────

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      activeSlideIndex: 0,
      selectedElementId: null,

      // ── Derived ──────────────────────────────
      activeProject: () => {
        const { projects, activeProjectId } = get()
        return projects.find((p) => p.id === activeProjectId) ?? null
      },
      activeSlide: () => {
        const { activeSlideIndex } = get()
        const project = get().activeProject()
        if (!project) return null
        return project.slides[activeSlideIndex] ?? null
      },

      // ── Projects ─────────────────────────────
      createProject: (name) => {
        const project = createDefaultProject(name)
        set((s) => ({
          projects: [...s.projects, project],
          activeProjectId: project.id,
          activeSlideIndex: 0,
          selectedElementId: null,
        }))
        return project
      },
      deleteProject: (id) => {
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
        }))
      },
      loadProject: (id) => {
        set({ activeProjectId: id, activeSlideIndex: 0, selectedElementId: null })
      },
      updateProjectName: (id, name) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, name, updatedAt: Date.now() } : p,
          ),
        }))
      },

      // ── Slides ───────────────────────────────
      addSlide: () => {
        const { activeProjectId, activeSlideIndex } = get()
        if (!activeProjectId) return
        const newSlide = createDefaultSlide()
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id !== activeProjectId
              ? p
              : {
                  ...p,
                  slides: [...p.slides, newSlide],
                  updatedAt: Date.now(),
                },
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
            elements: original.elements.map((el) => ({ ...el, id: nanoid() })),
            connections: original.connections.map((c) => ({ ...c, id: nanoid() })),
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
      setActiveSlide: (index) => {
        set({ activeSlideIndex: index, selectedElementId: null })
      },

      // ── Elements ─────────────────────────────
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

      // ── Connections ──────────────────────────
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
    }),
    {
      name: 'motionslides-session',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
