import { PX_PER_SEC } from '@/components/editor/timeline/constants'

interface Params {
  totalDuration: number
  timelineBodyRef: React.RefObject<HTMLDivElement>
  setCurrentTime: (v: number | ((prev: number) => number)) => void
  slides: any[]
  transitions: any[]
  playbackSettings: any
  activeProjectId: string | null
  updateProject: (id: string, updates: any) => void
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
}: Params): Result {
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const scrollLeft = timelineBodyRef.current?.scrollLeft ?? 0
    const clickX = e.clientX - rect.left + scrollLeft
    setCurrentTime(Math.max(0, Math.min(clickX / PX_PER_SEC, totalDuration)))

    const handleMouseMove = (ev: MouseEvent) => {
      const dragX = ev.clientX - rect.left + (timelineBodyRef.current?.scrollLeft ?? 0)
      setCurrentTime(Math.max(0, Math.min(dragX / PX_PER_SEC, totalDuration)))
    }
    const handleMouseUp = () => {
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
    const handleMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startX
      const targetDuration = Math.max(1, currentDuration + deltaX / PX_PER_SEC)
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
      if (activeProjectId) updateProject(activeProjectId, { transitions: updatedTransitions, synced: false })
    }
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return { handleRulerMouseDown, handleSlideResizeMouseDown }
}
