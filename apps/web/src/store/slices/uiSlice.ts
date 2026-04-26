import type { StateCreator } from 'zustand'
import type { EditorState } from '@/store/editorStore'

export interface UISlice {
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void
  toggleTheme: () => void
}

export const createUISlice: StateCreator<EditorState, [], [], UISlice> = (set) => ({
  theme: 'dark',

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
})
