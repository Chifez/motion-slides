import type { StateCreator } from 'zustand'
import type { EditorState } from '../editorStore'
import { uuid } from '@/lib/uuid'

export interface IdentitySlice {
  /**
   * The stable, persistent identity of this browser/device.
   * Generated once on the first run and stored in IndexedDB.
   * Used to identify 'Local Authorship' even when signed out.
   */
  localAuthorId: string
  initializeIdentity: () => void
}

export const createIdentitySlice: StateCreator<
  EditorState,
  [['zustand/persist', unknown]],
  [],
  IdentitySlice
> = (set, get) => ({
  // Note: Initial value will be overwritten by hydration if it exists
  localAuthorId: uuid(),

  initializeIdentity: () => {
    const { localAuthorId } = get()
    if (!localAuthorId) {
      set({ localAuthorId: uuid() })
    }
  },
})
