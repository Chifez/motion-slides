import { useRef, useMemo, useCallback, useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useShallow } from 'zustand/react/shallow'
import { usePermissions } from '@/context/PermissionContext'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useTimelinePlayback } from '@/hooks/useTimelinePlayback'
import { useTimelineTiming } from '@/hooks/useTimelineTiming'
import { useTimelineAudio } from '@/hooks/useTimelineAudio'
import { useTimelineScrub } from '@/hooks/useTimelineScrub'
import { TimelineToolbar } from './timeline/TimelineToolbar'
import { TimelinePreview } from './timeline/TimelinePreview'
import { TimelineTracks } from './timeline/TimelineTracks'
import type { SlideWithTiming } from './timeline/types'
import type { SlideTransition } from '@motionslides/shared'
import { TimelineRefsContext } from './timeline/TimelineRefsContext'

export function TimelinePanel() {
  usePermissions()
  const isMobile = useIsMobile()

  const timelineTracksVisible = useEditorStore(s => s.timelineTracksVisible ?? true)
  const setTimelineTracksVisible = useEditorStore(s => s.setTimelineTracksVisible)
  const activeSlideIndex = useEditorStore(s => s.activeSlideIndex)
  const setActiveSlide = useEditorStore(s => s.setActiveSlide)
  const playbackSettings = useEditorStore(s => s.playbackSettings)
  const activeProjectId = useEditorStore(s => s.activeProjectId)
  const updateProject = useEditorStore(s => s.updateProject)

  const project = useEditorStore(
    useShallow(s => s.projects.find(p => p.id === s.activeProjectId) ?? null),
  )
  const slides = project?.slides ?? []
  const transitions: SlideTransition[] = project?.transitions ?? []

  const totalDurationRef = useRef<number>(0)
  const slidesWithTimingRef = useRef<SlideWithTiming[]>([])
  const getSlideIndexAtTimeRef = useRef<(t: number) => number>(() => 0)

  const playback = useTimelinePlayback({
    totalDurationRef,
    slidesWithTimingRef,
    getSlideIndexAtTimeRef,
    playbackSettings,
    setActiveSlide,
    project,
  })

  const timing = useTimelineTiming({
    slides,
    transitions,
    playbackSettings,
    activeSlideIndex,
    isPlaying: playback.isPlaying,
    currentTime: playback.currentTime,
  })

  // Synchronize slide scripts with timeline captions track row
  useEffect(() => {
    if (!project || !activeProjectId) return
    let needsUpdate = false
    const currentCaptions = project.captions ? [...project.captions] : []

    // Calculate start/end of each slide based on computed slides timing
    const slidesWithTiming = timing.slidesWithTiming

    slidesWithTiming.forEach(({ slide, start, end }) => {
      if (slide.script && slide.script.trim()) {
        const id = `slide-script-${slide.id}`
        const existingIndex = currentCaptions.findIndex(c => c.id === id)
        
        if (existingIndex !== -1) {
          // If text changed in inspector, sync to timeline caption clip
          if (currentCaptions[existingIndex].text !== slide.script) {
            currentCaptions[existingIndex] = {
              ...currentCaptions[existingIndex],
              text: slide.script
            }
            needsUpdate = true
          }
        } else {
          // Verify if there is already an overlapping caption clip to avoid duplicate/conflict
          const overlap = currentCaptions.some(c => c.start >= start - 0.05 && c.start <= end + 0.05)
          if (!overlap) {
            currentCaptions.push({
              id,
              text: slide.script,
              start,
              end,
            })
            needsUpdate = true
          }
        }
      }
    })

    if (needsUpdate) {
      updateProject(activeProjectId, { captions: currentCaptions, synced: false })
    }
  }, [project, timing.slidesWithTiming, activeProjectId, updateProject])

  totalDurationRef.current = timing.totalDuration
  slidesWithTimingRef.current = timing.slidesWithTiming
  getSlideIndexAtTimeRef.current = timing.getSlideIndexAtTime

  const audio = useTimelineAudio({
    slides,
    playbackSettings,
    activeProjectId: activeProjectId ?? null,
    updateProject,
    liveSlideIndex: timing.liveSlideIndex,
  })

  const scrub = useTimelineScrub({
    totalDuration: timing.totalDuration,
    timelineBodyRef: playback.timelineBodyRef,
    setCurrentTime: playback.setCurrentTime,
    slides,
    transitions,
    playbackSettings,
    activeProjectId: activeProjectId ?? null,
    updateProject,
    slidesWithTiming: timing.slidesWithTiming,
  })

  const refsValue = useMemo(() => ({
    playheadRef: playback.playheadRef,
    timecodeRef: playback.timecodeRef
  }), [playback.playheadRef, playback.timecodeRef])
  const stableAudio = useMemo(() => audio, [
    audio.selectedAudioKey,
    audio.setSelectedAudioKey,
    audio.inspectorOpen,
    audio.setInspectorOpen,
    audio.selectedAudioInfo,
    audio.audioDrawer,
    audio.setAudioDrawer,
    audio.saveVoiceover,
    audio.saveBgm,
    audio.updateSelectedAudio,
    audio.deleteSelectedAudio,
  ])

  const handleSlideClick = useCallback((idx: number, start: number) => {
    setActiveSlide(idx)
    playback.setCurrentTime(start)
  }, [setActiveSlide, playback.setCurrentTime])

  return (
    <TimelineRefsContext value={refsValue}>
      <div className="flex flex-col w-full h-full bg-(--ms-bg-base) text-(--ms-text-primary) overflow-hidden select-none">

        <TimelineToolbar
          isPlaying={playback.isPlaying}
          setIsPlaying={playback.setIsPlaying}
          currentTime={playback.currentTime}
          setCurrentTime={playback.setCurrentTime}
          totalDuration={timing.totalDuration}
          playbackSettings={playbackSettings}
          activeProjectId={activeProjectId ?? null}
          updateProject={updateProject}
          timelineTracksVisible={timelineTracksVisible}
          setTimelineTracksVisible={setTimelineTracksVisible}
          isMobile={isMobile}
        />

        <TimelinePreview
          liveSlide={timing.liveSlide}
          livePrevSlide={timing.livePrevSlide}
          playbackSettings={playbackSettings}
          activeTransition={timing.liveActiveTransition}
          liveSlideIndex={timing.liveSlideIndex}
          slides={slides}
          slidesWithTiming={timing.slidesWithTiming}
          setActiveSlide={setActiveSlide}
          setCurrentTime={playback.setCurrentTime}
          isMobile={isMobile}
          timelineTracksVisible={timelineTracksVisible}
          setTimelineTracksVisible={setTimelineTracksVisible}
          activeProjectId={activeProjectId ?? null}
          updateProject={updateProject}
          currentTime={playback.currentTime}
        />

        {timelineTracksVisible && (
          <TimelineTracks
            timelineBodyRef={playback.timelineBodyRef}
            slidesWithTiming={timing.slidesWithTiming}
            totalDuration={timing.totalDuration}
            currentTime={playback.currentTime}
            liveSlideIndex={timing.liveSlideIndex}
            slides={slides}
            playbackSettings={playbackSettings}
            activeProjectId={activeProjectId ?? null}
            updateProject={updateProject}
            setActiveSlide={setActiveSlide}
            setCurrentTime={playback.setCurrentTime}
            audio={stableAudio}
            handleRulerMouseDown={scrub.handleRulerMouseDown}
            handleSlideResizeMouseDown={scrub.handleSlideResizeMouseDown}
            handleSlideClick={handleSlideClick}
          />

        )}

      </div>
    </TimelineRefsContext>
  )
}
