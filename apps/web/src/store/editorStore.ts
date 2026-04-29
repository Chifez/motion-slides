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
// Zustand Store with Optimized IndexedDB persistence
// ─────────────────────────────────────────────

/**
 * Optimized Storage Wrapper
 * 
 * Version-2 Smoothness Replicator:
 * Instead of serializing the state on every frame (which blocks the main thread),
 * we debounce the serialization itself. During a drag, we skip all persistence
 * overhead.
 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const optimizedStorage = {
  getItem: async (name: string): Promise<any | null> => {
    const raw = await get(name)
    if (!raw) return null
    // We store the data as a string in IDB for compatibility
    return JSON.parse(raw)
  },
  setItem: async (name: string, value: any): Promise<void> => {
    // 1. Skip all work if we are actively dragging
    if (useEditorStore.getState()?.isDragging) return

    // 2. Clear any pending save
    if (debounceTimer) clearTimeout(debounceTimer)

    // 3. Debounce the serialization AND the write
    debounceTimer = setTimeout(async () => {
      try {
        // Serialization happens here, outside the high-frequency loop
        const serialized = JSON.stringify(value)
        await set(name, serialized)
      } catch (e) {
        console.error('[Storage] Failed to persist state:', e)
      } finally {
        debounceTimer = null
      }
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
      // We don't use createJSONStorage here because we want the raw object 
      // in setItem to debounce the serialization itself.
      storage: typeof window !== 'undefined' ? optimizedStorage : undefined,
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        activeSlideIndex: state.activeSlideIndex,
        playbackSettings: state.playbackSettings,
        theme: state.theme,
        localAuthorId: state.localAuthorId,
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
