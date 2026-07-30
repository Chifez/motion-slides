import { createContext, useContext } from 'react'

export interface TimelineRefs {
  playheadRef: React.RefObject<HTMLDivElement | null>
  timecodeRef: React.RefObject<HTMLSpanElement | null>
}

export const TimelineRefsContext = createContext<TimelineRefs | null>(null)

export function useTimelineRefs() {
  const ctx = useContext(TimelineRefsContext)
  if (!ctx) {
    throw new Error('useTimelineRefs must be used within TimelineRefsContext')
  }
  return ctx
}
