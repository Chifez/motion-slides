import type { StateCreator } from 'zustand'
import type { PlaybackSettings } from '@/types'
import { DEFAULT_PLAYBACK_SETTINGS } from '@/constants/export'
import type { EditorState } from '@/store/editorStore'

export interface PresentationSlice {
  isPresenting: boolean
  playbackSettings: PlaybackSettings
  mobileSlidesOpen: boolean
  startPresentation: () => void
  stopPresentation: () => void
  updatePlaybackSettings: (updates: Partial<PlaybackSettings>) => void
  setMobileSlidesOpen: (open: boolean) => void
}

export const createPresentationSlice: StateCreator<EditorState, [], [], PresentationSlice> = (set) => ({
  isPresenting: false,
  mobileSlidesOpen: false,
  playbackSettings: { ...DEFAULT_PLAYBACK_SETTINGS },

  startPresentation: () => {
    set({ isPresenting: true, selectedElementId: null, activeSlideIndex: 0 })
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
})
