import { create } from 'zustand'
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware'
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
import { createIdentitySlice, type IdentitySlice } from './slices/identitySlice'

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
  & IdentitySlice

type PersistedState = Pick<
  EditorState,
  'projects' | 'activeProjectId' | 'activeSlideIndex' | 'playbackSettings' | 'localAuthorId'
>

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

const optimizedStorage: PersistStorage<PersistedState> = {
  getItem: async (name: string): Promise<StorageValue<PersistedState> | null> => {
    const raw = await get(name)
    if (!raw) return null
    // We store the data as a string in IDB for compatibility
    return JSON.parse(raw) as StorageValue<PersistedState>
  },
  setItem: async (name: string, value: StorageValue<PersistedState>): Promise<void> => {
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
      } catch (error) {
        console.error('[Storage] Failed to persist state:', error)
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
  persist<EditorState, [], [], PersistedState>(
    (...args) => ({
      ...createProjectSlice(...args),
      ...createSlideSlice(...args),
      ...createElementSlice(...args),
      ...createPresentationSlice(...args),
      ...createPrototypeSlice(...args),
      ...createCanvasSlice(...args),
      ...createAISlice(...args),
      ...createUISlice(...args),
      ...createAuthSlice(...args),
      ...createIdentitySlice(...args),
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
        localAuthorId: state.localAuthorId,
      }),
    },
  ),
)

// Expose store for headless renderer injection (export pipeline only)
if (typeof window !== 'undefined') {
  (window as unknown as { __motionslides_store__: typeof useEditorStore }).__motionslides_store__ = useEditorStore
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
    const unsubscribe = useEditorStore.persist.onFinishHydration(() => {
      resolve()
      if (unsubscribe) unsubscribe()
    })
  }
})
