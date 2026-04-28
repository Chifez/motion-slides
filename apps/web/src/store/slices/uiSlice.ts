import type { StateCreator } from 'zustand'
import type { EditorState } from '@/store/editorStore'

export interface UISlice {
  theme: 'dark' | 'light'
  isEditingId: string | null
  isReadOnly: boolean
  setTheme: (theme: 'dark' | 'light') => void
  toggleTheme: () => void
  setEditingId: (id: string | null) => void
  setReadOnly: (readOnly: boolean) => void
  hasHydrated: boolean
  setHydrated: (hydrated: boolean) => void
}

export const createUISlice: StateCreator<EditorState, [], [], UISlice> = (set) => ({
  theme: 'dark',
  isEditingId: null,
  isReadOnly: false,

  setTheme: (theme) => {
    set({ theme })
    if (typeof document !== 'undefined') {
      if (theme === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }
  },

  toggleTheme: () => {
    set((s) => {
      const newTheme = s.theme === 'dark' ? 'light' : 'dark'
      if (typeof document !== 'undefined') {
        if (newTheme === 'dark') document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
      }
      return { theme: newTheme }
    })
  },

  setEditingId: (id) => set({ isEditingId: id }),
  setReadOnly: (readOnly) => set({ isReadOnly: readOnly }),
  hasHydrated: false,
  setHydrated: (hydrated) => set({ hasHydrated: hydrated }),
})
