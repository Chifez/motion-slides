import { create } from 'zustand'
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'
import { createProjectSlice, type ProjectSlice } from './slices/project-slice'
import { createSlideSlice, type SlideSlice } from './slices/slide-slice'
import { createElementSlice, type ElementSlice } from './slices/element-slice'
import { createPresentationSlice, type PresentationSlice } from './slices/presentation-slice'
import { createPrototypeSlice, type PrototypeSlice } from './slices/prototype-slice'
import { createCanvasSlice, type CanvasSlice } from './slices/canvas-slice'
import { createAISlice, type AISlice } from './slices/ai-slice'
import { createUISlice, type UISlice } from './slices/ui-slice'
import { createAuthSlice, type AuthSlice } from './slices/auth-slice'
import { createIdentitySlice, type IdentitySlice } from './slices/identity-slice'
import { createOnboardingSlice, type OnboardingSlice } from './slices/onboarding-slice'
import { createGitSlice, type GitSlice } from './slices/git-slice'
import { createSnapshotSlice, type SnapshotSlice } from './slices/snapshot-slice'

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
  & OnboardingSlice
  & GitSlice
  & SnapshotSlice

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
let pendingPersist: { name: string; value: StorageValue<PersistedState> } | null = null

const optimizedStorage: PersistStorage<PersistedState> = {
  getItem: async (name: string): Promise<StorageValue<PersistedState> | null> => {
    const raw = await get(name)
    if (!raw) return null

    return JSON.parse(raw) as StorageValue<PersistedState>
  },
  setItem: async (name: string, value: StorageValue<PersistedState>): Promise<void> => {
    pendingPersist = { name, value }

    if (useEditorStore.getState()?.isDragging) {
      // During active drags, hold pending state without disk I/O
      return
    }

    if (debounceTimer) clearTimeout(debounceTimer)

    debounceTimer = setTimeout(async () => {
      try {
        const toSave = pendingPersist ?? { name, value }
        const serialized = JSON.stringify(toSave.value)
        await set(toSave.name, serialized)
        pendingPersist = null
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
      ...createOnboardingSlice(...args),
      ...createGitSlice(...args),
      ...createSnapshotSlice(...args),
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
