import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'
import { createProjectSlice, type ProjectSlice } from './slices/projectSlice'
import { createSlideSlice, type SlideSlice } from './slices/slideSlice'
import { createElementSlice, type ElementSlice } from './slices/elementSlice'
import { createPresentationSlice, type PresentationSlice } from './slices/presentationSlice'
import { createPrototypeSlice, type PrototypeSlice } from './slices/prototypeSlice'
import { createCanvasSlice, type CanvasSlice } from './slices/canvasSlice'
import { createAISlice, type AISlice } from './slices/aiSlice'
import { createUISlice, type UISlice } from './slices/uiSlice'
import { createAuthSlice, type AuthSlice } from './slices/authSlice'

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
  & AISlice
  & UISlice
  & AuthSlice

// ─────────────────────────────────────────────
// Zustand Store with IndexedDB persistence
// ─────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // Clear any existing timer
    if (debounceTimer) clearTimeout(debounceTimer)

    // Debounce the write operation. 
    // 500ms is enough to bridge high-frequency drag events.
    debounceTimer = setTimeout(async () => {
      await set(name, value)
      debounceTimer = null
    }, 500)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

export const useEditorStore = create<EditorState>()(
  persist(
    (...a) => ({
      ...createProjectSlice(...a),
      ...createSlideSlice(...a),
      ...createElementSlice(...a),
      ...createPresentationSlice(...a),
      ...createPrototypeSlice(...a),
      ...createCanvasSlice(...a),
      ...createAISlice(...a),
      ...createUISlice(...a),
      ...createAuthSlice(...a),
    }),
    {
      name: 'motionslides-session',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return idbStorage
        return { getItem: () => null, setItem: () => {}, removeItem: () => {} } as any
      }),
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        activeSlideIndex: state.activeSlideIndex,
        playbackSettings: state.playbackSettings,
        theme: state.theme,
      }),
    },
  ),
)

// Expose store for headless renderer injection (export pipeline only)
if (typeof window !== 'undefined') {
  (window as any).__motionslides_store__ = useEditorStore
}

// ─────────────────────────────────────────────
// Async Hydration Helper
// ─────────────────────────────────────────────
export const storeHydrationPromise = new Promise<void>((resolve) => {
  if (typeof window === 'undefined') {
    resolve()
    return
  }
  
  if (useEditorStore.persist.hasHydrated()) {
    resolve()
  } else {
    const unsub = useEditorStore.persist.onFinishHydration(() => {
      resolve()
      if (unsub) unsub()
    })
  }
})
