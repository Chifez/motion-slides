import type { StateCreator } from 'zustand'
import type { EditorState } from '@/store/editor-store'

export interface Camera {
  x: number
  y: number
  zoom: number
}

export interface AlignmentGuide {
  type: 'h' | 'v'
  coord: number
  start: number
  end: number
}

export type EditorTool = 'select' | 'section' | 'hand'

export interface CanvasSlice {
  camera: Camera
  setCamera: (camera: Partial<Camera>) => void
  resetCamera: () => void
  isMultiSelectMode: boolean
  setMultiSelectMode: (isMultiSelectMode: boolean) => void
  isDragging: boolean
  setIsDragging: (isDragging: boolean) => void
  activeTool: EditorTool
  setActiveTool: (tool: EditorTool) => void
  customCanvasWidth: number | null
  customCanvasHeight: number | null
  setCustomCanvasDimensions: (w: number | null, h: number | null) => void
  alignmentGuides: AlignmentGuide[]
  setAlignmentGuides: (guides: AlignmentGuide[]) => void
}

export const createCanvasSlice: StateCreator<EditorState, [], [], CanvasSlice> = (set) => ({
  camera: { x: 0, y: 0, zoom: 1 },

  setCamera: (updates) => set((s) => ({ camera: { ...s.camera, ...updates } })),

  resetCamera: () => set({ camera: { x: 0, y: 0, zoom: 1 } }),

  isMultiSelectMode: false,
  setMultiSelectMode: (isMultiSelectMode) => set({ isMultiSelectMode }),
  isDragging: false,
  setIsDragging: (isDragging) => set({ isDragging }),
  activeTool: 'select',
  setActiveTool: (activeTool) => set({ activeTool }),
  customCanvasWidth: null,
  customCanvasHeight: null,
  alignmentGuides: [],
  setAlignmentGuides: (alignmentGuides) => set({ alignmentGuides }),
  setCustomCanvasDimensions: (w, h) => set((s) => {
    const { activeProjectId, activeSlideIndex } = s
    if (!activeProjectId) return { customCanvasWidth: w, customCanvasHeight: h }
    return {
      customCanvasWidth: w,
      customCanvasHeight: h,
      projects: s.projects.map((p) =>
        p.id !== activeProjectId
          ? p
          : {
              ...p,
              slides: p.slides.map((slide, idx) =>
                idx !== activeSlideIndex
                  ? slide
                  : { ...slide, customWidth: w ?? undefined, customHeight: h ?? undefined }
              ),
              updatedAt: Date.now(),
              synced: false,
            }
      ),
    }
  }),
})
