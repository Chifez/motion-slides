import { useCallback } from 'react'
import type { Slide, SlideTransition, PlaybackSettings, Project } from '@motionslides/shared'
import { PX_PER_SEC } from '@/components/editor/timeline/constants'
import type { SlideWithTiming } from '@/components/editor/timeline/types'
import { useEditorStore } from '@/store/editor-store'

interface Params {
  totalDuration: number
  timelineBodyRef: React.RefObject<HTMLDivElement>
  setCurrentTime: (v: number | ((prev: number) => number)) => void
  slides: Slide[]
  transitions: SlideTransition[]
  playbackSettings: PlaybackSettings
  activeProjectId: string | null
  updateProject: (id: string, updates: Partial<Project>) => void
  slidesWithTiming: SlideWithTiming[]
}

interface Result {
  handleRulerMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
  handleSlideResizeMouseDown: (
    e: React.MouseEvent,
    slideId: string,
    currentDuration: number,
  ) => void
}

/**
 * Provides mouse-driven interaction handlers for the timeline:
 * - Ruler click/drag to scrub the playhead
 * - Slide card right-edge drag to resize its duration
 */
export function useTimelineScrub({
  totalDuration,
  timelineBodyRef,
  setCurrentTime,
  slides,
  transitions,
  playbackSettings,
  activeProjectId,
  updateProject,
  slidesWithTiming,
}: Params): Result {
  const handleRulerMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const el = timelineBodyRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const updateTimeFromX = (clientX: number) => {
      const scrollLeft = el.scrollLeft
      const relativeX = clientX - rect.left + scrollLeft - 88 // 88px sidebar column
      const sec = Math.max(0, relativeX / PX_PER_SEC)
      setCurrentTime(Math.min(totalDuration, sec))
    }

    updateTimeFromX(e.clientX)

    const handleMouseMove = (ev: MouseEvent) => {
      updateTimeFromX(ev.clientX)
    }
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [totalDuration, timelineBodyRef, setCurrentTime])

  const handleSlideResizeMouseDown = useCallback((
    e: React.MouseEvent,
    slideId: string,
    currentDuration: number,
  ) => {
    e.stopPropagation()
    const startX = e.clientX
    
    // Find slide timing start/end in project
    const timingInfo = slidesWithTiming.find(s => s.slide.id === slideId)
    const originalSlideEndTime = timingInfo ? timingInfo.end : 0
    const project = useEditorStore.getState().activeProject()
    const originalCaptions = project?.captions ? [...project.captions] : []

    const handleMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startX
      const deltaSec = deltaX / PX_PER_SEC
      const targetDuration = Math.max(1, currentDuration + deltaSec)
      const actualDelta = targetDuration - currentDuration

      const slideIdx = slides.findIndex(s => s.id === slideId)
      if (slideIdx === -1) return
      const existingTransIdx = transitions.findIndex(t => t.fromSlideId === slideId)
      const updatedTransitions = [...transitions]
      if (existingTransIdx !== -1) {
        updatedTransitions[existingTransIdx] = {
          ...updatedTransitions[existingTransIdx],
          trigger: 'auto',
          autoDelay: Math.round(targetDuration * 1000),
        }
      } else {
        const nextSlideId = slides[slideIdx + 1]?.id || slides[0].id
        updatedTransitions.push({
          id: Math.random().toString(36).substring(2, 9),
          fromSlideId: slideId,
          toSlideId: nextSlideId,
          animation: 'fade',
          duration: playbackSettings.transitionDuration,
          ease: playbackSettings.transitionEase,
          trigger: 'auto',
          autoDelay: Math.round(targetDuration * 1000),
        })
      }

      // Ripple offset all captions starting after the current slide's end boundary
      const updatedCaptions = originalCaptions.map(c => {
        if (c.start >= originalSlideEndTime) {
          return {
            ...c,
            start: Math.max(0, c.start + actualDelta),
            end: Math.max(0.5, c.end + actualDelta),
          }
        }
        return c
      })

      if (activeProjectId) {
        updateProject(activeProjectId, {
          transitions: updatedTransitions,
          captions: updatedCaptions,
          synced: false,
        })
      }
    }
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [slides, transitions, playbackSettings.transitionDuration, playbackSettings.transitionEase, activeProjectId, updateProject, slidesWithTiming])

  return { handleRulerMouseDown, handleSlideResizeMouseDown }
}
