import type { StateCreator } from 'zustand'
import type { EditorState } from '@/store/editorStore'

export interface Camera {
  x: number
  y: number
  zoom: number
}

export interface CanvasSlice {
  camera: Camera
  setCamera: (camera: Partial<Camera>) => void
  resetCamera: () => void
  isMultiSelectMode: boolean
  setMultiSelectMode: (isMultiSelectMode: boolean) => void
  isDragging: boolean
  setIsDragging: (isDragging: boolean) => void
}

export const createCanvasSlice: StateCreator<EditorState, [], [], CanvasSlice> = (set) => ({
  camera: { x: 0, y: 0, zoom: 1 },

  setCamera: (updates) => set((s) => ({ camera: { ...s.camera, ...updates } })),

  resetCamera: () => set({ camera: { x: 0, y: 0, zoom: 1 } }),

  isMultiSelectMode: false,
  setMultiSelectMode: (isMultiSelectMode) => set({ isMultiSelectMode }),
  isDragging: false,
  setIsDragging: (isDragging) => set({ isDragging }),
})
