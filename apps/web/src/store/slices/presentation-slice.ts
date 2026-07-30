import type { StateCreator } from 'zustand'
import { type PlaybackSettings, type AspectRatioKey, getCanvasDimensions } from '@motionslides/shared'
import { DEFAULT_PLAYBACK_SETTINGS } from '@/constants/export'
import type { EditorState } from '@/store/editor-store'

export interface PresentationSlice {
  isPresenting: boolean
  playbackSettings: PlaybackSettings
  mobileSlidesOpen: boolean
  mobileInspectorOpen: boolean
  startPresentation: (options?: { autoplay?: boolean }) => void
  stopPresentation: () => void
  updatePlaybackSettings: (updates: Partial<PlaybackSettings>) => void
  setMobileSlidesOpen: (open: boolean) => void
  setMobileInspectorOpen: (open: boolean) => void
  getPlaybackTransitions: () => {
    activeTransition: any | null
    clickTransition: any | null
    autoTransition: any | null
  }
}

export const createPresentationSlice: StateCreator<EditorState, [], [], PresentationSlice> = (set, get) => ({
  isPresenting: false,
  mobileSlidesOpen: false,
  mobileInspectorOpen: false,
  playbackSettings: { ...DEFAULT_PLAYBACK_SETTINGS },

  startPresentation: (options?: { autoplay?: boolean }) => {
    set({ isPresenting: true, selectedElementIds: [], activeSlideIndex: 0, previousSlideIndex: null })
    if (options?.autoplay !== undefined) {
      get().updatePlaybackSettings({ autoplay: options.autoplay })
    }
  },

  stopPresentation: () => {
    set({ isPresenting: false })
  },

  updatePlaybackSettings: (updates) => {
    set((s) => {
      const newSettings = { ...s.playbackSettings, ...updates }
      const activeId = s.activeProjectId
      let updatedProjects = s.projects
      if (activeId) {
        updatedProjects = s.projects.map((p) => {
          if (p.id !== activeId) return p

          const oldRatio = s.playbackSettings.aspectRatio
          const newRatio = updates.aspectRatio
          const ratioChanged = newRatio && oldRatio !== newRatio

          let slides = p.slides
          if (ratioChanged) {
            const oldDims = getCanvasDimensions(oldRatio as AspectRatioKey)
            const newDims = getCanvasDimensions(newRatio as AspectRatioKey)
            const scaleX = newDims.width / oldDims.width
            const scaleY = newDims.height / oldDims.height

            slides = p.slides.map((slide) => {
              const scaledElements = slide.elements.map((el) => {
                if (el.type === 'line') {
                  const content = el.content as any
                  return {
                    ...el,
                    position: {
                      x: Math.round(el.position.x * scaleX),
                      y: Math.round(el.position.y * scaleY),
                    },
                    size: {
                      width: Math.max(1, Math.round(el.size.width * scaleX)),
                      height: Math.max(1, Math.round(el.size.height * scaleY)),
                    },
                    content: {
                      ...content,
                      customPath: undefined, // Clear static server path to trigger client re-route
                    }
                  }
                }
                return {
                  ...el,
                  position: {
                    x: Math.round(el.position.x * scaleX),
                    y: Math.round(el.position.y * scaleY),
                  },
                  size: {
                    width: Math.max(1, Math.round(el.size.width * scaleX)),
                    height: Math.max(1, Math.round(el.size.height * scaleY)),
                  }
                }
              })
              return { ...slide, elements: scaledElements }
            })
          }

          return {
            ...p,
            slides,
            playbackSettings: newSettings,
            synced: false,
            updatedAt: Math.max(Date.now(), (p.updatedAt ?? 0) + 1),
          }
        })
      }
      return {
        playbackSettings: newSettings,
        projects: updatedProjects,
      }
    })
  },

  setMobileSlidesOpen: (open) => {
    set({ mobileSlidesOpen: open })
  },

  setMobileInspectorOpen: (open) => {
    set({ mobileInspectorOpen: open })
  },

  getPlaybackTransitions: () => {
    const { activeProject, activeSlideIndex, previousSlideIndex } = get()
    const project = activeProject()
    if (!project) return { activeTransition: null, clickTransition: null, autoTransition: null }

    const currentSlide = project.slides[activeSlideIndex]
    const prevSlide = previousSlideIndex !== null ? project.slides[previousSlideIndex] : null
    
    if (!currentSlide) return { activeTransition: null, clickTransition: null, autoTransition: null }

    const transitions = project.transitions ?? []
    const activeTransition = prevSlide 
      ? transitions.find(t => t.fromSlideId === prevSlide.id && t.toSlideId === currentSlide.id) ?? null
      : null
    
    const outgoing = transitions.filter(t => t.fromSlideId === currentSlide.id)
    
    return {
      activeTransition,
      clickTransition: outgoing.find(t => t.trigger === 'click') ?? null,
      autoTransition: outgoing.find(t => t.trigger === 'auto') ?? null
    }
  }
})
