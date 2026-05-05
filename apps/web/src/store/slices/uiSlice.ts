import type { StateCreator } from 'zustand'
import type { EditorState } from '@/store/editorStore'

export interface UISlice {
  theme: 'dark' | 'light'
  isEditingId: string | null
  setTheme: (theme: 'dark' | 'light') => void
  toggleTheme: () => void
  setEditingId: (id: string | null) => void
}

const getInitialTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark'
  const saved = localStorage.getItem('ms-theme') as 'dark' | 'light' | null
  if (saved) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const createUISlice: StateCreator<EditorState, [], [], UISlice> = (set) => ({
  theme: getInitialTheme(),
  isEditingId: null,

  setTheme: (theme) => {
    set({ theme })
    if (typeof window !== 'undefined') {
      localStorage.setItem('ms-theme', theme)
      if (theme === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }
  },

  toggleTheme: () => {
    set((s) => {
      const newTheme = s.theme === 'dark' ? 'light' : 'dark'
      if (typeof window !== 'undefined') {
        localStorage.setItem('ms-theme', newTheme)
        if (newTheme === 'dark') document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
      }
      return { theme: newTheme }
    })
  },

  setEditingId: (id) => set({ isEditingId: id }),
})
