import type { Slide, SlideTransition, PlaybackSettings, Project } from '@motionslides/shared'
import type { ResizingSlideState, ScrubState, SlideWithTiming } from '@/components/editor/timeline/types'
import { useEditorStore } from '@/store/editor-store'

interface Params {
  totalDuration: number
  pxPerSec: number
  snapEnabled: boolean
  timelineBodyRef: React.RefObject<HTMLDivElement>
  setCurrentTime: (v: number | ((prev: number) => number)) => void
  slides: Slide[]
  transitions: SlideTransition[]
  playbackSettings: PlaybackSettings
  activeProjectId: string | null
  updateProject: (id: string, updates: Partial<Project>) => void
  slidesWithTiming: SlideWithTiming[]
  onScrubStateChange?: (state: ScrubState) => void
  onSnapGuideChange?: (time: number | null) => void
  onResizeTooltipChange?: (state: ResizingSlideState | null) => void
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
 * - Ruler & playhead cap click/drag to scrub the playhead with optional magnetic snap
 * - Slide card right-edge drag to resize its duration with live readout & caption ripple
 */
export function useTimelineScrub({
  totalDuration,
  pxPerSec,
  snapEnabled,
  timelineBodyRef,
  setCurrentTime,
  slides,
  transitions,
  playbackSettings,
  activeProjectId,
  updateProject,
  slidesWithTiming,
  onScrubStateChange,
  onSnapGuideChange,
  onResizeTooltipChange,
}: Params): Result {
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const el = timelineBodyRef.current
    if (!el) return

    const snapPoints = Array.from(
      new Set(slidesWithTiming.flatMap(item => [item.start, item.end])),
    )
    const snapThresholdSec = 6 / Math.max(1, pxPerSec)
    let lastTime = 0

    const resolveTime = (clientX: number, allowSnap: boolean): number => {
      const rect = el.getBoundingClientRect()
      const relativeX = clientX - rect.left + el.scrollLeft
      const rawSec = Math.max(0, Math.min(totalDuration, relativeX / pxPerSec))

      if (allowSnap) {
        let bestPt: number | null = null
        let bestDist = snapThresholdSec
        for (const pt of snapPoints) {
          const dist = Math.abs(rawSec - pt)
          if (dist < bestDist) {
            bestDist = dist
            bestPt = pt
          }
        }
        if (bestPt !== null) {
          onSnapGuideChange?.(bestPt)
          return bestPt
        }
      }
      onSnapGuideChange?.(null)
      return rawSec
    }

    const updateFromPointer = (clientX: number, altKey: boolean) => {
      const next = resolveTime(clientX, snapEnabled && !altKey)
      lastTime = next
      setCurrentTime(next)
      onScrubStateChange?.({ active: true, time: next })
    }

    updateFromPointer(e.clientX, e.altKey)

    const handleMouseMove = (ev: MouseEvent) => {
      updateFromPointer(ev.clientX, ev.altKey)
    }
    const handleMouseUp = () => {
      onScrubStateChange?.({ active: false, time: lastTime })
      onSnapGuideChange?.(null)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleSlideResizeMouseDown = (
    e: React.MouseEvent,
    slideId: string,
    currentDuration: number,
  ) => {
    e.stopPropagation()
    const startX = e.clientX

    const timingInfo = slidesWithTiming.find(s => s.slide.id === slideId)
    const originalSlideEndTime = timingInfo ? timingInfo.end : 0
    const project = useEditorStore.getState().activeProject()
    const originalCaptions = project?.captions ? [...project.captions] : []

    onResizeTooltipChange?.({ slideId, duration: currentDuration })

    const handleMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startX
      const deltaSec = deltaX / pxPerSec
      const rawDuration = Math.max(1, currentDuration + deltaSec)
      const step = ev.shiftKey ? 0.5 : 0.1
      const targetDuration = Math.max(1, Math.round(rawDuration / step) * step)
      const actualDelta = targetDuration - currentDuration

      onResizeTooltipChange?.({ slideId, duration: targetDuration })

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
      onResizeTooltipChange?.(null)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return { handleRulerMouseDown, handleSlideResizeMouseDown }
}
