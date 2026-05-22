import type { StateCreator } from 'zustand'
import type { EditorState } from '@/store/editorStore'
import type { Slide, SlideTransition } from '@motionslides/shared'
import type { ProjectSuggestion } from '@/lib/actions/suggestions'

export interface UISlice {
  theme: 'dark' | 'light'
  isEditingId: string | null
  reviewingSuggestionId: string | null
  reviewMode: 'original' | 'suggested'
  suggestions: ProjectSuggestion[]
  originalProjectBackup: { slides: Slide[], transitions: SlideTransition[], prototypeLayout: Record<string, { x: number; y: number }> } | null
  suggestedProjectBackup: { slides: Slide[], transitions: SlideTransition[], prototypeLayout: Record<string, { x: number; y: number }> } | null
  setTheme: (theme: 'dark' | 'light') => void
  toggleTheme: () => void
  setEditingId: (id: string | null) => void
  setReviewingSuggestionId: (id: string | null) => void
  setReviewMode: (mode: 'original' | 'suggested') => void
  setSuggestions: (suggestions: ProjectSuggestion[]) => void
  startReview: (suggestionId: string) => void
  toggleReviewMode: (mode: 'original' | 'suggested') => void
  cancelReview: () => void
  finishReview: () => void
}

const getInitialTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark'
  const saved = localStorage.getItem('ms-theme') as 'dark' | 'light' | null
  if (saved) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const createUISlice: StateCreator<EditorState, [], [], UISlice> = (set, get) => ({
  theme: getInitialTheme(),
  isEditingId: null,
  reviewingSuggestionId: null,
  reviewMode: 'suggested',
  suggestions: [],
  originalProjectBackup: null,
  suggestedProjectBackup: null,

  setTheme: (theme) => {
    set({ theme })
    if (typeof window !== 'undefined') {
      localStorage.setItem('ms-theme', theme)
      if (theme === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }
  },

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark'
      if (typeof window !== 'undefined') {
        localStorage.setItem('ms-theme', newTheme)
        if (newTheme === 'dark') document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
      }
      return { theme: newTheme }
    })
  },

  setEditingId: (id) => set({ isEditingId: id }),
  setReviewingSuggestionId: (id) => set({ reviewingSuggestionId: id }),
  setReviewMode: (mode) => set({ reviewMode: mode }),
  setSuggestions: (suggestions) => set({ suggestions }),

  startReview: (suggestionId) => {
    const { projects, activeProjectId, suggestions } = get()
    const project = projects.find(project => project.id === activeProjectId)
    const suggestion = suggestions.find(suggestion => suggestion.id === suggestionId)
    if (!project || !suggestion) return

    set({
      reviewingSuggestionId: suggestionId,
      reviewMode: 'suggested',
      originalProjectBackup: {
        slides: project.slides,
        transitions: project.transitions ?? [],
        prototypeLayout: project.prototypeLayout ?? {},
      },
      suggestedProjectBackup: {
        slides: suggestion.slides,
        transitions: suggestion.transitions ?? [],
        prototypeLayout: suggestion.prototypeLayout ?? {},
      }
    })

    // Load suggestion content into the active project in the store
    get().updateProject(project.id, {
      slides: suggestion.slides,
      transitions: suggestion.transitions ?? [],
      prototypeLayout: suggestion.prototypeLayout ?? {},
      synced: false,
    })
  },

  toggleReviewMode: (mode) => {
    const { activeProjectId, originalProjectBackup, suggestedProjectBackup, reviewMode } = get()
    if (!activeProjectId || !originalProjectBackup || !suggestedProjectBackup || reviewMode === mode) return

    const currentProject = get().projects.find(project => project.id === activeProjectId)
    if (!currentProject) return

    const currentContent = {
      slides: currentProject.slides,
      transitions: currentProject.transitions ?? [],
      prototypeLayout: currentProject.prototypeLayout ?? {},
    }

    if (reviewMode === 'suggested') {
      set({ suggestedProjectBackup: currentContent })
    } else {
      set({ originalProjectBackup: currentContent })
    }

    set({ reviewMode: mode })

    const targetContent = mode === 'suggested' ? suggestedProjectBackup : originalProjectBackup
    get().updateProject(activeProjectId, {
      ...targetContent,
      synced: false,
    })
  },

  cancelReview: () => {
    const { activeProjectId, originalProjectBackup } = get()
    if (!activeProjectId || !originalProjectBackup) {
      set({
        reviewingSuggestionId: null,
        reviewMode: 'suggested',
        originalProjectBackup: null,
        suggestedProjectBackup: null,
      })
      return
    }

    get().updateProject(activeProjectId, {
      slides: originalProjectBackup.slides,
      transitions: originalProjectBackup.transitions,
      prototypeLayout: originalProjectBackup.prototypeLayout,
      synced: true,
    })

    set({
      reviewingSuggestionId: null,
      reviewMode: 'suggested',
      originalProjectBackup: null,
      suggestedProjectBackup: null,
    })
  },

  finishReview: () => {
    set({
      reviewingSuggestionId: null,
      reviewMode: 'suggested',
      originalProjectBackup: null,
      suggestedProjectBackup: null,
    })
  },
})
