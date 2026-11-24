import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type {
  SlideAudio,
  Slide,
  Project,
  PlaybackSettings,
  TransitionAnimation,
} from '@motionslides/shared'
import {
  formatTime,
  AUDIO_TYPE_BGM,
  AUDIO_TYPE_VOICEOVER,
  BGM_LABEL,
  VO_LABEL_PREFIX,
  BGM_ACCENT_COLOR,
  VO_ACCENT_COLOR,
  TRANSITION_LABELS,
} from './constants'
import type {
  AudioKey,
  AudioDrawer,
  MutedTracks,
  ResizingSlideState,
  ScrubState,
  SlideWithTiming,
} from './types'
import { AudioInspector } from './audio-inspector'
import { AudioDrawerModal } from './audio-drawer-modal'
import { TrackLabelColumn } from './track-label-column'
import { RulerRow } from './ruler-row'
import { SlideTrackRow, type TransitionSeamTarget } from './slide-track-row'
import { CaptionTrackRow } from './caption-track-row'
import { VoiceoverTrackRow } from './voiceover-track-row'
import { BgmTrackRow } from './bgm-track-row'
import { useTimelineRefs } from './timeline-refs-context'

interface AudioState {
  selectedAudioKey: AudioKey | null
  setSelectedAudioKey: (key: AudioKey | null) => void
  inspectorOpen: boolean
  setInspectorOpen: (open: boolean) => void
  selectedAudioInfo: SlideAudio | null
  audioDrawer: AudioDrawer
  setAudioDrawer: (drawer: AudioDrawer) => void
  saveVoiceover: (audio: SlideAudio) => void
  saveBgm: (audio: SlideAudio) => void
  updateSelectedAudio: (updates: Partial<SlideAudio>) => void
  deleteSelectedAudio: () => void
}

interface Props {
  dockHeight: number
  timelineBodyRef: React.RefObject<HTMLDivElement>
  slidesWithTiming: SlideWithTiming[]
  totalDuration: number
  currentTime: number
  pxPerSec: number
  onZoomChange: (px: number) => void
  snapEnabled: boolean
  captionsVisible: boolean
  onToggleCaptionsVisible: () => void
  mutedTracks: MutedTracks
  onToggleMuteTrack: (track: 'vo' | 'bgm') => void
  scrubState: ScrubState
  snapGuideTime: number | null
  onSnapGuideChange: (time: number | null) => void
  resizingSlide: ResizingSlideState | null
  liveSlideIndex: number
  slides: Slide[]
  playbackSettings: PlaybackSettings
  activeProjectId: string | null
  updateProject: (id: string, updates: Partial<Project>) => void
  audio: AudioState
  onAddCaptionAtPlayhead: () => void
  onDropBgmFile: (file: File) => void
  onUpdateTransition: (
    fromSlideId: string,
    toSlideId: string,
    animation: TransitionAnimation,
    duration: number,
  ) => void
  handleRulerMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
  handleSlideResizeMouseDown: (e: React.MouseEvent, slideId: string, duration: number) => void
  handleSlideClick: (idx: number, start: number) => void
}

const POPOVER_ANIMATIONS: TransitionAnimation[] = [
  'magic-move',
  'fade',
  'slide-left',
  'slide-right',
  'zoom',
  'flip',
]

const POPOVER_DURATIONS = [300, 500, 800, 1200] as const

/**
 * Full-bleed multi-track timeline dock housing the track header rail, scrollable ruler + lanes,
 * interactive playhead & snap guide, transition seam popover, and right-docked AudioInspector.
 */
export function TimelineTracks({
  dockHeight,
  timelineBodyRef,
  slidesWithTiming,
  totalDuration,
  currentTime,
  pxPerSec,
  onZoomChange,
  snapEnabled,
  captionsVisible,
  onToggleCaptionsVisible,
  mutedTracks,
  onToggleMuteTrack,
  scrubState,
  snapGuideTime,
  onSnapGuideChange,
  resizingSlide,
  liveSlideIndex,
  slides,
  playbackSettings,
  activeProjectId,
  updateProject,
  audio,
  onAddCaptionAtPlayhead,
  onDropBgmFile,
  onUpdateTransition,
  handleRulerMouseDown,
  handleSlideResizeMouseDown,
  handleSlideClick,
}: Props) {
  const { playheadRef } = useTimelineRefs()
  const [activeSeam, setActiveSeam] = useState<TransitionSeamTarget | null>(null)

  const timelineWidth = Math.max(900, Math.ceil(totalDuration + 2) * pxPerSec)

  // Ctrl / Cmd + Wheel zoom directly inside the tracks viewport
  useEffect(() => {
    const el = timelineBodyRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY < 0 ? 12 : -12
        onZoomChange(pxPerSec + delta)
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [timelineBodyRef, pxPerSec, onZoomChange])

  // Dismiss transition seam popover on Escape or outside click
  useEffect(() => {
    if (!activeSeam) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveSeam(null)
    }
    const onPointerDown = () => setActiveSeam(null)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [activeSeam])

  const selectedAudioIsBgm = audio.selectedAudioKey?.type === AUDIO_TYPE_BGM
  const selectedVoSlideNumber =
    slides.findIndex(
      s =>
        s.id ===
        (audio.selectedAudioKey?.type === AUDIO_TYPE_VOICEOVER
          ? audio.selectedAudioKey.slideId
          : ''),
    ) + 1

  const currentSeamAnimation: TransitionAnimation =
    activeSeam?.transition?.animation ?? 'fade'
  const currentSeamDuration =
    activeSeam?.transition?.duration ?? playbackSettings.transitionDuration ?? 500

  return (
    <div
      className="shrink-0 overflow-hidden relative"
      style={{
        height: dockHeight,
        backgroundColor: 'var(--ms-tl-bg)',
      }}
    >
      <div className="flex h-full w-full">
        {/* Left: Track Header Column */}
        <div className="h-full overflow-y-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
          <TrackLabelColumn
            audioDrawer={audio.audioDrawer}
            setAudioDrawer={audio.setAudioDrawer}
            liveSlideIndex={liveSlideIndex}
            slidesCount={slides.length}
            onAddCaption={onAddCaptionAtPlayhead}
            captionsVisible={captionsVisible}
            onToggleCaptionsVisible={onToggleCaptionsVisible}
            mutedTracks={mutedTracks}
            onToggleMuteTrack={onToggleMuteTrack}
          />
        </div>

        {/* Center: Horizontally & Vertically Scrollable Track Viewport */}
        <div className="flex-1 min-w-0 overflow-hidden relative">
          <div
            ref={timelineBodyRef}
            className="w-full h-full overflow-x-auto overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--ms-tl-border-strong) transparent',
            }}
          >
            <div
              className="relative flex flex-col min-h-full"
              style={{ width: timelineWidth }}
            >
              {/* Playhead vertical hairline + interactive cap */}
              <div
                ref={playheadRef}
                className="absolute top-0 bottom-0 z-30 pointer-events-none"
                style={{
                  left: `${currentTime * pxPerSec}px`,
                  width: '1px',
                  backgroundColor: 'var(--ms-tl-playhead)',
                }}
              >
                <div
                  onMouseDown={handleRulerMouseDown}
                  title="Drag to scrub timeline (hold Alt to disable snap)"
                  className="pointer-events-auto cursor-ew-resize absolute top-0 -left-[6px] w-[13px] h-[16px] flex items-center justify-center"
                >
                  <svg width="11" height="14" viewBox="0 0 11 14" aria-hidden="true">
                    <path
                      d="M1 1.5C1 0.95 1.45 0.5 2 0.5H9C9.55 0.5 10 0.95 10 1.5V8.2L5.5 13.2L1 8.2V1.5Z"
                      fill="var(--ms-tl-playhead)"
                    />
                  </svg>
                </div>

                {scrubState.active && (
                  <div
                    className="absolute top-5 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-semibold whitespace-nowrap shadow-md bg-(--ms-text-primary) text-(--ms-bg-elevated)"
                  >
                    {formatTime(scrubState.time)}
                  </div>
                )}
              </div>

              {/* Magnetic snap guide line */}
              {snapGuideTime !== null && (
                <div
                  className="absolute top-0 bottom-0 z-25 pointer-events-none border-l border-dashed"
                  style={{
                    left: `${snapGuideTime * pxPerSec}px`,
                    borderColor: 'var(--ms-tl-snap)',
                  }}
                />
              )}

              <RulerRow
                totalDuration={totalDuration}
                pxPerSec={pxPerSec}
                onMouseDown={handleRulerMouseDown}
              />

              <SlideTrackRow
                slidesWithTiming={slidesWithTiming}
                liveSlideIndex={liveSlideIndex}
                pxPerSec={pxPerSec}
                resizingSlide={resizingSlide}
                onSlideResizeMouseDown={handleSlideResizeMouseDown}
                onSlideClick={handleSlideClick}
                onTransitionSeamClick={target => setActiveSeam(target)}
              />

              <CaptionTrackRow
                currentTime={currentTime}
                totalDuration={totalDuration}
                pxPerSec={pxPerSec}
                slidesWithTiming={slidesWithTiming}
                snapEnabled={snapEnabled}
                captionsVisible={captionsVisible}
                onSnapGuideChange={onSnapGuideChange}
              />

              <VoiceoverTrackRow
                slidesWithTiming={slidesWithTiming}
                slides={slides}
                pxPerSec={pxPerSec}
                isMuted={mutedTracks.vo}
                liveSlideIndex={liveSlideIndex}
                selectedAudioKey={audio.selectedAudioKey}
                setSelectedAudioKey={audio.setSelectedAudioKey}
                setInspectorOpen={audio.setInspectorOpen}
                onOpenVoDrawer={() => audio.setAudioDrawer('vo')}
                activeProjectId={activeProjectId}
                updateProject={updateProject}
              />

              <BgmTrackRow
                backgroundMusic={playbackSettings.backgroundMusic ?? null}
                totalDuration={totalDuration}
                pxPerSec={pxPerSec}
                isMuted={mutedTracks.bgm}
                selectedAudioKey={audio.selectedAudioKey}
                setSelectedAudioKey={audio.setSelectedAudioKey}
                setInspectorOpen={audio.setInspectorOpen}
                onOpenBgmDrawer={() => audio.setAudioDrawer('bgm')}
                onDropBgmFile={onDropBgmFile}
              />
            </div>
          </div>
        </div>

        {/* Right: Docked Audio Inspector */}
        {audio.inspectorOpen && audio.selectedAudioInfo && (
          <AudioInspector
            audioInfo={audio.selectedAudioInfo}
            label={
              selectedAudioIsBgm
                ? BGM_LABEL
                : `${VO_LABEL_PREFIX} ${Math.max(1, selectedVoSlideNumber)}`
            }
            accentColor={selectedAudioIsBgm ? BGM_ACCENT_COLOR : VO_ACCENT_COLOR}
            isBgm={selectedAudioIsBgm}
            duckBackgroundMusic={playbackSettings.duckBackgroundMusic}
            onToggleDuck={duck => {
              if (!activeProjectId) return
              updateProject(activeProjectId, {
                playbackSettings: { ...playbackSettings, duckBackgroundMusic: duck },
                synced: false,
              })
            }}
            onUpdate={audio.updateSelectedAudio}
            onDelete={() => {
              audio.deleteSelectedAudio()
              audio.setInspectorOpen(false)
            }}
            onClose={() => audio.setInspectorOpen(false)}
          />
        )}
      </div>

      {/* Add Voiceover / BGM Drawer Modal */}
      <AudioDrawerModal
        audioDrawer={audio.audioDrawer}
        liveSlideIndex={liveSlideIndex}
        existingVoiceover={slides[liveSlideIndex]?.audio ?? null}
        slideScript={slides[liveSlideIndex]?.script ?? ''}
        onSaveVoiceover={audio.saveVoiceover}
        onSaveBgm={audio.saveBgm}
        onClose={() => audio.setAudioDrawer(null)}
      />

      {/* Transition Seam Quick Popover */}
      {activeSeam && (
        <div
          onPointerDown={e => e.stopPropagation()}
          className="fixed z-(--z-overlay) w-56 rounded-xl border p-3 shadow-2xl"
          style={{
            left: `${Math.max(
              12,
              Math.min(
                typeof window !== 'undefined' ? window.innerWidth - 236 : 400,
                activeSeam.anchorRect.left + activeSeam.anchorRect.width / 2 - 112,
              ),
            )}px`,
            top: `${Math.max(12, activeSeam.anchorRect.top - 172)}px`,
            backgroundColor: 'var(--ms-bg-elevated)',
            borderColor: 'var(--ms-tl-border-strong)',
            boxShadow: 'var(--ms-shadow)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-(--ms-text-primary)">
              Slide Transition
            </span>
            <button
              type="button"
              onClick={() => setActiveSeam(null)}
              aria-label="Close transition editor"
              className="w-5 h-5 rounded flex items-center justify-center border-none bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary) cursor-pointer"
            >
              <X size={11} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1 mb-2.5">
            {POPOVER_ANIMATIONS.map(anim => {
              const selected = currentSeamAnimation === anim
              return (
                <button
                  key={anim}
                  type="button"
                  onClick={() =>
                    onUpdateTransition(
                      activeSeam.fromSlideId,
                      activeSeam.toSlideId,
                      anim,
                      currentSeamDuration,
                    )
                  }
                  className={`py-1 px-1.5 rounded text-[10px] font-medium border cursor-pointer transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] ${
                    selected
                      ? 'border-(--ms-accent) bg-(--ms-accent)/12 text-(--ms-accent) font-semibold'
                      : 'border-(--ms-tl-border) bg-(--ms-bg-surface) text-(--ms-text-muted) hover:text-(--ms-text-primary)'
                  }`}
                >
                  {TRANSITION_LABELS[anim]}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between gap-1">
            {POPOVER_DURATIONS.map(dur => {
              const selected = currentSeamDuration === dur
              return (
                <button
                  key={dur}
                  type="button"
                  onClick={() =>
                    onUpdateTransition(
                      activeSeam.fromSlideId,
                      activeSeam.toSlideId,
                      currentSeamAnimation,
                      dur,
                    )
                  }
                  className={`flex-1 py-1 rounded text-[10px] font-mono tabular-nums border cursor-pointer transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] ${
                    selected
                      ? 'border-(--ms-accent) bg-(--ms-accent)/12 text-(--ms-accent) font-semibold'
                      : 'border-(--ms-tl-border) bg-(--ms-bg-surface) text-(--ms-text-muted) hover:text-(--ms-text-primary)'
                  }`}
                >
                  {dur}ms
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
