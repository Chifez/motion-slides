import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createProjectSlice, type ProjectSlice } from './slices/projectSlice'
import { createSlideSlice, type SlideSlice } from './slices/slideSlice'
import { createElementSlice, type ElementSlice } from './slices/elementSlice'
import { createPresentationSlice, type PresentationSlice } from './slices/presentationSlice'
import { createPrototypeSlice, type PrototypeSlice } from './slices/prototypeSlice'
import { createCanvasSlice, type CanvasSlice } from './slices/canvasSlice'

// ─────────────────────────────────────────────
// Combined Store Type
// ─────────────────────────────────────────────

export type EditorState =
  & ProjectSlice
  & SlideSlice
  & ElementSlice
  & PresentationSlice
  & PrototypeSlice
  & CanvasSlice

// ─────────────────────────────────────────────
// Zustand Store with SessionStorage persistence
// ─────────────────────────────────────────────

export const useEditorStore = create<EditorState>()(
  persist(
    (...a) => ({
      ...createProjectSlice(...a),
      ...createSlideSlice(...a),
      ...createElementSlice(...a),
      ...createPresentationSlice(...a),
      ...createPrototypeSlice(...a),
      ...createCanvasSlice(...a),
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
