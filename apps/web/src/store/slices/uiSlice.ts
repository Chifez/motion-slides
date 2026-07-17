import type { StateCreator } from 'zustand'
import type { EditorState } from '@/store/editorStore'
import type { Slide, SlideTransition } from '@motionslides/shared'
import type { ProjectSuggestion } from '@/lib/actions/suggestions'
import { getStorageItem, setStorageItem } from '@/lib/safeStorage'

export interface ToastInfo {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export interface UISlice {
  theme: 'dark' | 'light'
  isEditingId: string | null
  reviewingSuggestionId: string | null
  reviewMode: 'original' | 'suggested'
  suggestions: ProjectSuggestion[]
  originalProjectBackup: { slides: Slide[], transitions: SlideTransition[], prototypeLayout: Record<string, { x: number; y: number }> } | null
  suggestedProjectBackup: { slides: Slide[], transitions: SlideTransition[], prototypeLayout: Record<string, { x: number; y: number }> } | null
  toasts: ToastInfo[]
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
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  dismissToast: (id: string) => void
  editorMode: 'design' | 'prototype' | 'timeline'
  timelineTracksVisible: boolean
  isGitPanelOpen: boolean
  setEditorMode: (mode: 'design' | 'prototype' | 'timeline') => void
  setTimelineTracksVisible: (visible: boolean) => void
  toggleGitPanel: () => void
}

const getInitialTheme = (): 'dark' | 'light' => {
  const saved = getStorageItem('ms-theme') as 'dark' | 'light' | null
  if (saved) return saved
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const createUISlice: StateCreator<EditorState, [], [], UISlice> = (set, get) => ({
  toasts: [],
  showToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }))
  },
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }))
  },
  theme: getInitialTheme(),
  isEditingId: null,
  reviewingSuggestionId: null,
  reviewMode: 'suggested',
  suggestions: [],
  originalProjectBackup: null,
  suggestedProjectBackup: null,
  editorMode: 'design',
  timelineTracksVisible: true,
  isGitPanelOpen: false,
  toggleGitPanel: () => {
    const { isGitPanelOpen, activeProjectId, projects, user } = get()
    const willOpen = !isGitPanelOpen
    set({ isGitPanelOpen: willOpen })

    if (willOpen && activeProjectId) {
      const project = projects.find(p => p.id === activeProjectId)
      const isBranchOwner = !!project?.forkedFromId && project?.ownerId === user?.id

      get().loadGitHistory(activeProjectId)
      get().loadPRs(activeProjectId, isBranchOwner ? 'outgoing' : 'incoming')
    }
  },

  setTheme: (theme) => {
    set({ theme })
    setStorageItem('ms-theme', theme)
    if (typeof window !== 'undefined') {
      if (theme === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }
  },

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark'
      setStorageItem('ms-theme', newTheme)
      if (typeof window !== 'undefined') {
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
  setEditorMode: (mode) => {
    set({ editorMode: mode })
    if (mode === 'prototype') {
      get().setPrototypeMode(true)
    } else {
      get().setPrototypeMode(false)
    }
  },
  setTimelineTracksVisible: (visible) => set({ timelineTracksVisible: visible }),
})
