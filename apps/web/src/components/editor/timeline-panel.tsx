import { useState, useRef, useEffect } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { useShallow } from 'zustand/react/shallow'
import { usePermissions } from '@/context/permission-context'
import { useIsMobile } from '@/hooks/use-media-query'
import { useTimelinePlayback } from '@/hooks/use-timeline-playback'
import { useTimelineTiming } from '@/hooks/use-timeline-timing'
import { useTimelineAudio } from '@/hooks/use-timeline-audio'
import { useTimelineScrub } from '@/hooks/use-timeline-scrub'
import { TimelineToolbar } from './timeline/timeline-toolbar'
import { TimelinePreview } from './timeline/timeline-preview'
import { TimelineTracks } from './timeline/timeline-tracks'
import {
  DEFAULT_PX_PER_SEC,
  MIN_PX_PER_SEC,
  MAX_PX_PER_SEC,
  PLAYBACK_SPEEDS,
  computeFitPxPerSec,
} from './timeline/constants'
import { uploadTimelineAudioFile } from './timeline/upload-audio'
import type {
  MutedTracks,
  ResizingSlideState,
  ScrubState,
  SlideWithTiming,
} from './timeline/types'
import type { SlideTransition, TransitionAnimation } from '@motionslides/shared'
import { TimelineRefsContext } from './timeline/timeline-refs-context'

const DEFAULT_DOCK_HEIGHT = 244
const MIN_DOCK_HEIGHT = 168

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

  // Studio timeline UI controls
  const [pxPerSec, setPxPerSec] = useState(DEFAULT_PX_PER_SEC)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [captionsVisible, setCaptionsVisible] = useState(true)
  const [mutedTracks, setMutedTracks] = useState<MutedTracks>({ vo: false, bgm: false })
  const [dockHeight, setDockHeight] = useState(DEFAULT_DOCK_HEIGHT)
  const [scrubState, setScrubState] = useState<ScrubState>({ active: false, time: 0 })
  const [snapGuideTime, setSnapGuideTime] = useState<number | null>(null)
  const [resizingSlide, setResizingSlide] = useState<ResizingSlideState | null>(null)

  const totalDurationRef = useRef<number>(0)
  const slidesWithTimingRef = useRef<SlideWithTiming[]>([])
  const getSlideIndexAtTimeRef = useRef<(t: number) => number>(() => 0)
  const pxPerSecRef = useRef(pxPerSec)
  const playbackSpeedRef = useRef(playbackSpeed)
  const mutedTracksRef = useRef(mutedTracks)

  pxPerSecRef.current = pxPerSec
  playbackSpeedRef.current = playbackSpeed
  mutedTracksRef.current = mutedTracks

  const playback = useTimelinePlayback({
    totalDurationRef,
    slidesWithTimingRef,
    getSlideIndexAtTimeRef,
    pxPerSecRef,
    playbackSpeedRef,
    mutedTracksRef,
    playbackSpeed,
    mutedTracks,
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

  // Keep slide script notes synchronized with timeline caption clips
  useEffect(() => {
    if (!project || !activeProjectId) return
    let needsUpdate = false
    const currentCaptions = project.captions ? [...project.captions] : []

    timing.slidesWithTiming.forEach(({ slide, start, end }) => {
      if (slide.script && slide.script.trim()) {
        const id = `slide-script-${slide.id}`
        const existingIndex = currentCaptions.findIndex(c => c.id === id)

        if (existingIndex !== -1) {
          if (currentCaptions[existingIndex].text !== slide.script) {
            currentCaptions[existingIndex] = {
              ...currentCaptions[existingIndex],
              text: slide.script,
            }
            needsUpdate = true
          }
        } else {
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
    pxPerSec,
    snapEnabled,
    timelineBodyRef: playback.timelineBodyRef,
    setCurrentTime: playback.setCurrentTime,
    slides,
    transitions,
    playbackSettings,
    activeProjectId: activeProjectId ?? null,
    updateProject,
    slidesWithTiming: timing.slidesWithTiming,
    onScrubStateChange: setScrubState,
    onSnapGuideChange: setSnapGuideTime,
    onResizeTooltipChange: setResizingSlide,
  })

  const refsValue = {
    playheadRef: playback.playheadRef,
    timecodeRef: playback.timecodeRef,
  }

  const handleZoomChange = (nextPx: number) => {
    const clamped = Math.round(Math.min(MAX_PX_PER_SEC, Math.max(MIN_PX_PER_SEC, nextPx)))
    pxPerSecRef.current = clamped
    if (playback.playheadRef.current) {
      playback.playheadRef.current.style.left = `${playback.currentTimeRef.current * clamped}px`
    }
    setPxPerSec(clamped)
  }

  const handleFitToView = () => {
    const viewportW = playback.timelineBodyRef.current?.clientWidth ?? 900
    const nextPx = computeFitPxPerSec(timing.totalDuration, viewportW)
    handleZoomChange(nextPx)
    if (playback.timelineBodyRef.current) {
      playback.timelineBodyRef.current.scrollLeft = 0
    }
  }

  const handleCyclePlaybackSpeed = () => {
    const idx = PLAYBACK_SPEEDS.indexOf(playbackSpeed as (typeof PLAYBACK_SPEEDS)[number])
    const next = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length]
    setPlaybackSpeed(next)
  }

  const handleSlideClick = (idx: number, start: number) => {
    setActiveSlide(idx)
    playback.setCurrentTime(start)
  }

  const handlePrevSlide = () => {
    const targetIdx = Math.max(0, timing.liveSlideIndex - 1)
    const targetTiming = timing.slidesWithTiming[targetIdx]
    if (targetTiming) handleSlideClick(targetIdx, targetTiming.start)
  }

  const handleNextSlide = () => {
    const targetIdx = Math.min(slides.length - 1, timing.liveSlideIndex + 1)
    const targetTiming = timing.slidesWithTiming[targetIdx]
    if (targetTiming) handleSlideClick(targetIdx, targetTiming.start)
  }

  const handleAddCaptionAtPlayhead = () => {
    const proj = useEditorStore.getState().activeProject()
    if (!proj || !activeProjectId) return
    const start = playback.currentTimeRef.current
    const newCaption = {
      id: Math.random().toString(36).substring(2, 9),
      text: 'New Subtitle...',
      start,
      end: start + 2.5,
    }
    updateProject(activeProjectId, {
      captions: [...(proj.captions ?? []), newCaption],
      synced: false,
    })
  }

  const handleDropBgmFile = async (file: File) => {
    try {
      const uploaded = await uploadTimelineAudioFile(file, { volume: 0.7, loop: true })
      audio.saveBgm(uploaded)
    } catch {
      // Fallback: open modal so user can see upload error feedback
      audio.setAudioDrawer('bgm')
    }
  }

  const handleUpdateTransition = (
    fromSlideId: string,
    toSlideId: string,
    animation: TransitionAnimation,
    duration: number,
  ) => {
    if (!activeProjectId) return
    const existingIdx = transitions.findIndex(
      t => t.fromSlideId === fromSlideId && t.toSlideId === toSlideId,
    )
    const nextTransitions = [...transitions]
    if (existingIdx !== -1) {
      nextTransitions[existingIdx] = {
        ...nextTransitions[existingIdx],
        animation,
        duration,
      }
    } else {
      nextTransitions.push({
        id: Math.random().toString(36).substring(2, 9),
        fromSlideId,
        toSlideId,
        animation,
        duration,
        ease: playbackSettings.transitionEase,
        trigger: 'click',
      })
    }
    updateProject(activeProjectId, { transitions: nextTransitions, synced: false })
  }

  const handleSplitterMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = dockHeight
    const maxH = Math.min(460, Math.round(window.innerHeight * 0.58))

    const onMove = (ev: MouseEvent) => {
      const deltaY = startY - ev.clientY
      setDockHeight(Math.max(MIN_DOCK_HEIGHT, Math.min(maxH, startH + deltaY)))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Timeline keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable
      ) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        playback.setIsPlaying(!playback.isPlaying)
      } else if (e.key === 'Home') {
        e.preventDefault()
        playback.setCurrentTime(0)
        playback.setIsPlaying(false)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const targetIdx = Math.max(0, timing.liveSlideIndex - 1)
        const targetTiming = timing.slidesWithTiming[targetIdx]
        if (targetTiming) {
          setActiveSlide(targetIdx)
          playback.setCurrentTime(targetTiming.start)
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        const targetIdx = Math.min(slides.length - 1, timing.liveSlideIndex + 1)
        const targetTiming = timing.slidesWithTiming[targetIdx]
        if (targetTiming) {
          setActiveSlide(targetIdx)
          playback.setCurrentTime(targetTiming.start)
        }
      } else if (e.key === 'l' || e.key === 'L') {
        if (!activeProjectId) return
        updateProject(activeProjectId, {
          playbackSettings: { ...playbackSettings, loop: !playbackSettings.loop },
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    playback.isPlaying,
    playback.setIsPlaying,
    playback.setCurrentTime,
    timing.liveSlideIndex,
    timing.slidesWithTiming,
    slides.length,
    setActiveSlide,
    activeProjectId,
    playbackSettings,
    updateProject,
  ])

  return (
    <TimelineRefsContext value={refsValue}>
      <div className="flex flex-col w-full h-full bg-(--ms-bg-base) text-(--ms-text-primary) overflow-hidden select-none">
        <TimelinePreview
          liveSlide={timing.liveSlide}
          livePrevSlide={timing.livePrevSlide}
          playbackSettings={playbackSettings}
          activeTransition={timing.liveActiveTransition}
          liveSlideIndex={timing.liveSlideIndex}
          slides={slides}
          captionsVisible={captionsVisible}
          isMobile={isMobile}
          timelineTracksVisible={timelineTracksVisible}
          setTimelineTracksVisible={setTimelineTracksVisible}
          activeProjectId={activeProjectId ?? null}
          updateProject={updateProject}
          currentTime={playback.currentTime}
        />

        {/* Draggable horizontal splitter between preview stage and transport/tracks dock */}
        {timelineTracksVisible && !isMobile && (
          <div
            onMouseDown={handleSplitterMouseDown}
            title="Drag to resize timeline dock"
            className="h-1.5 shrink-0 cursor-row-resize flex items-center justify-center group hover:bg-(--ms-accent)/15 transition-colors duration-150"
            style={{ backgroundColor: 'var(--ms-tl-bg)' }}
          >
            <div className="w-10 h-0.5 rounded-full bg-(--ms-tl-border-strong) group-hover:bg-(--ms-accent) transition-colors duration-150" />
          </div>
        )}

        <TimelineToolbar
          isPlaying={playback.isPlaying}
          setIsPlaying={playback.setIsPlaying}
          currentTime={playback.currentTime}
          setCurrentTime={playback.setCurrentTime}
          totalDuration={timing.totalDuration}
          liveSlideIndex={timing.liveSlideIndex}
          slidesCount={slides.length}
          liveSlideName={timing.liveSlide?.name ?? ''}
          onPrevSlide={handlePrevSlide}
          onNextSlide={handleNextSlide}
          onAddCaption={handleAddCaptionAtPlayhead}
          onOpenVoDrawer={() => audio.setAudioDrawer('vo')}
          playbackSettings={playbackSettings}
          activeProjectId={activeProjectId ?? null}
          updateProject={updateProject}
          playbackSpeed={playbackSpeed}
          onCyclePlaybackSpeed={handleCyclePlaybackSpeed}
          pxPerSec={pxPerSec}
          onZoomChange={handleZoomChange}
          onFitToView={handleFitToView}
          snapEnabled={snapEnabled}
          onToggleSnap={() => setSnapEnabled(prev => !prev)}
          timelineTracksVisible={timelineTracksVisible}
          setTimelineTracksVisible={setTimelineTracksVisible}
          isMobile={isMobile}
        />

        {timelineTracksVisible && (
          <TimelineTracks
            dockHeight={dockHeight}
            timelineBodyRef={playback.timelineBodyRef}
            slidesWithTiming={timing.slidesWithTiming}
            totalDuration={timing.totalDuration}
            currentTime={playback.currentTime}
            pxPerSec={pxPerSec}
            onZoomChange={handleZoomChange}
            snapEnabled={snapEnabled}
            captionsVisible={captionsVisible}
            onToggleCaptionsVisible={() => setCaptionsVisible(prev => !prev)}
            mutedTracks={mutedTracks}
            onToggleMuteTrack={track =>
              setMutedTracks(prev => ({ ...prev, [track]: !prev[track] }))
            }
            scrubState={scrubState}
            snapGuideTime={snapGuideTime}
            onSnapGuideChange={setSnapGuideTime}
            resizingSlide={resizingSlide}
            liveSlideIndex={timing.liveSlideIndex}
            slides={slides}
            playbackSettings={playbackSettings}
            activeProjectId={activeProjectId ?? null}
            updateProject={updateProject}
            audio={audio}
            onAddCaptionAtPlayhead={handleAddCaptionAtPlayhead}
            onDropBgmFile={handleDropBgmFile}
            onUpdateTransition={handleUpdateTransition}
            handleRulerMouseDown={scrub.handleRulerMouseDown}
            handleSlideResizeMouseDown={scrub.handleSlideResizeMouseDown}
            handleSlideClick={handleSlideClick}
          />
        )}
      </div>
    </TimelineRefsContext>
  )
}
