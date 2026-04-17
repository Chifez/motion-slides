import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createProjectSlice, type ProjectSlice } from './slices/projectSlice'
import { createSlideSlice, type SlideSlice } from './slices/slideSlice'
import { createElementSlice, type ElementSlice } from './slices/elementSlice'
import { createConnectionSlice, type ConnectionSlice } from './slices/connectionSlice'
import { createPresentationSlice, type PresentationSlice } from './slices/presentationSlice'

// ─────────────────────────────────────────────
// Combined Store Type
// ─────────────────────────────────────────────

export type EditorState =
  & ProjectSlice
  & SlideSlice
  & ElementSlice
  & ConnectionSlice
  & PresentationSlice

// ─────────────────────────────────────────────
// Zustand Store with SessionStorage persistence
// ─────────────────────────────────────────────

export const useEditorStore = create<EditorState>()(
  persist(
    (...a) => ({
      ...createProjectSlice(...a),
      ...createSlideSlice(...a),
      ...createElementSlice(...a),
      ...createConnectionSlice(...a),
      ...createPresentationSlice(...a),
    }),
    {
      name: 'motionslides-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        activeSlideIndex: state.activeSlideIndex,
        playbackSettings: state.playbackSettings,
      }),
    },
  ),
)
