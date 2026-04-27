import type { StateCreator } from 'zustand'
import type { PlaybackSettings } from '@motionslides/shared'
import { DEFAULT_PLAYBACK_SETTINGS } from '@/constants/export'
import type { EditorState } from '@/store/editorStore'

export interface PresentationSlice {
  isPresenting: boolean
  playbackSettings: PlaybackSettings
  mobileSlidesOpen: boolean
  mobileInspectorOpen: boolean
  startPresentation: (options?: { autoplay?: boolean }) => void
  stopPresentation: () => void
  updatePlaybackSettings: (updates: Partial<PlaybackSettings>) => void
  setMobileSlidesOpen: (open: boolean) => void
  setMobileInspectorOpen: (open: boolean) => void
  getPlaybackTransitions: () => {
    activeTransition: any | null
    clickTransition: any | null
    autoTransition: any | null
  }
}

export const createPresentationSlice: StateCreator<EditorState, [], [], PresentationSlice> = (set, get) => ({
  isPresenting: false,
  mobileSlidesOpen: false,
  mobileInspectorOpen: false,
  playbackSettings: { ...DEFAULT_PLAYBACK_SETTINGS },

  startPresentation: (options?: { autoplay?: boolean }) => {
    set({ isPresenting: true, selectedElementIds: [], activeSlideIndex: 0, previousSlideIndex: null })
    if (options?.autoplay !== undefined) {
      get().updatePlaybackSettings({ autoplay: options.autoplay })
    }
  },

  stopPresentation: () => {
    set({ isPresenting: false })
  },

  updatePlaybackSettings: (updates) => {
    set((s) => ({ playbackSettings: { ...s.playbackSettings, ...updates } }))
  },

  setMobileSlidesOpen: (open) => {
    set({ mobileSlidesOpen: open })
  },

  setMobileInspectorOpen: (open) => {
    set({ mobileInspectorOpen: open })
  },

  getPlaybackTransitions: () => {
    const { activeProject, activeSlideIndex, previousSlideIndex } = get()
    const project = activeProject()
    if (!project) return { activeTransition: null, clickTransition: null, autoTransition: null }

    const currentSlide = project.slides[activeSlideIndex]
    const prevSlide = previousSlideIndex !== null ? project.slides[previousSlideIndex] : null
    
    if (!currentSlide) return { activeTransition: null, clickTransition: null, autoTransition: null }

    const transitions = project.transitions ?? []
    const activeTransition = prevSlide 
      ? transitions.find(t => t.fromSlideId === prevSlide.id && t.toSlideId === currentSlide.id) ?? null
      : null
    
    const outgoing = transitions.filter(t => t.fromSlideId === currentSlide.id)
    
    return {
      activeTransition,
      clickTransition: outgoing.find(t => t.trigger === 'click') ?? null,
      autoTransition: outgoing.find(t => t.trigger === 'auto') ?? null
    }
  }
})
