import {
  SkipBack,
  ChevronLeft,
  Play,
  Pause,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Repeat,
  Magnet,
  ZoomOut,
  ZoomIn,
  Maximize2,
  Type,
  Mic,
} from 'lucide-react'
import type { PlaybackSettings, Project } from '@motionslides/shared'
import { formatTime, MIN_PX_PER_SEC, MAX_PX_PER_SEC } from './constants'
import { useTimelineRefs } from './timeline-refs-context'

interface Props {
  isPlaying: boolean
  setIsPlaying: (v: boolean) => void
  currentTime: number
  setCurrentTime: (v: number) => void
  totalDuration: number
  liveSlideIndex: number
  slidesCount: number
  liveSlideName: string
  onPrevSlide: () => void
  onNextSlide: () => void
  onAddCaption: () => void
  onOpenVoDrawer: () => void
  playbackSettings: PlaybackSettings
  activeProjectId: string | null
  updateProject: (id: string, updates: Partial<Project>) => void
  playbackSpeed: number
  onCyclePlaybackSpeed: () => void
  pxPerSec: number
  onZoomChange: (px: number) => void
  onFitToView: () => void
  snapEnabled: boolean
  onToggleSnap: () => void
  timelineTracksVisible: boolean
  setTimelineTracksVisible: (v: boolean) => void
  isMobile: boolean
}

/**
 * 3-zone NLE transport bar bridging the preview stage and multi-track timeline dock:
 * Left: active slide indicator & quick-add actions
 * Center: transport controls + tabular timecode
 * Right: loop, speed, magnetic snap, zoom/fit, and dock collapse
 */
export function TimelineToolbar({
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
  totalDuration,
  liveSlideIndex,
  slidesCount,
  liveSlideName,
  onPrevSlide,
  onNextSlide,
  onAddCaption,
  onOpenVoDrawer,
  playbackSettings,
  activeProjectId,
  updateProject,
  playbackSpeed,
  onCyclePlaybackSpeed,
  pxPerSec,
  onZoomChange,
  onFitToView,
  snapEnabled,
  onToggleSnap,
  timelineTracksVisible,
  setTimelineTracksVisible,
  isMobile,
}: Props) {
  const { timecodeRef } = useTimelineRefs()

  const toggleLoop = () => {
    if (!activeProjectId) return
    updateProject(activeProjectId, {
      playbackSettings: { ...playbackSettings, loop: !playbackSettings.loop },
    })
  }

  return (
    <div
      className="h-11 shrink-0 flex items-center justify-between gap-2 px-3 border-y z-20"
      style={{ backgroundColor: 'var(--ms-tl-surface)', borderColor: 'var(--ms-tl-border)' }}
    >
      {/* Left Zone: Slide context + quick actions */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <div
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border min-w-0 max-w-[190px]"
          style={{
            backgroundColor: 'var(--ms-tl-bg)',
            borderColor: 'var(--ms-tl-border)',
          }}
          title={liveSlideName || 'Untitled Slide'}
        >
          <span className="text-[10px] font-mono tabular-nums font-semibold text-(--ms-accent) shrink-0">
            {slidesCount > 0 ? String(liveSlideIndex + 1).padStart(2, '0') : '00'}
          </span>
          <span className="text-[11px] font-medium text-(--ms-text-secondary) truncate">
            {liveSlideName || 'Untitled Slide'}
          </span>
        </div>

        {!isMobile && (
          <div className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={onAddCaption}
              title="Add caption clip at playhead"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border-none bg-transparent cursor-pointer transition-[background-color,color,transform] duration-150 active:scale-[0.97]"
            >
              <Type size={12} />
              <span>Caption</span>
            </button>
            <button
              type="button"
              onClick={onOpenVoDrawer}
              title={`Add voiceover to slide ${liveSlideIndex + 1}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border-none bg-transparent cursor-pointer transition-[background-color,color,transform] duration-150 active:scale-[0.97]"
            >
              <Mic size={12} />
              <span>VO</span>
            </button>
          </div>
        )}
      </div>

      {/* Center Zone: Transport + Tabular Timecode */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => { setCurrentTime(0); setIsPlaying(false) }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) hover:bg-black/[0.06] dark:hover:bg-white/[0.07] transition-[background-color,color,transform] duration-150 active:scale-[0.95] cursor-pointer border-none bg-transparent"
            title="Return to start (Home)"
            aria-label="Return to start"
          >
            <SkipBack size={13} />
          </button>
          <button
            type="button"
            onClick={onPrevSlide}
            disabled={liveSlideIndex <= 0}
            className="w-7 h-7 flex items-center justify-center rounded-md text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) hover:bg-black/[0.06] dark:hover:bg-white/[0.07] disabled:opacity-30 disabled:pointer-events-none transition-[background-color,color,transform] duration-150 active:scale-[0.95] cursor-pointer border-none bg-transparent"
            title="Previous slide (←)"
            aria-label="Previous slide"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            aria-label={isPlaying ? 'Pause timeline' : 'Play timeline'}
            className={`flex items-center justify-center w-7 h-7 mx-0.5 rounded-full border-none cursor-pointer transition-[transform,box-shadow,opacity] duration-150 active:scale-[0.94] bg-(--ms-text-primary) text-(--ms-bg-elevated) hover:opacity-90 ${
              isPlaying ? 'ring-2 ring-(--ms-accent)/50' : ''
            }`}
          >
            {isPlaying
              ? <Pause size={12} fill="currentColor" />
              : <Play size={12} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={onNextSlide}
            disabled={liveSlideIndex >= slidesCount - 1}
            className="w-7 h-7 flex items-center justify-center rounded-md text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) hover:bg-black/[0.06] dark:hover:bg-white/[0.07] disabled:opacity-30 disabled:pointer-events-none transition-[background-color,color,transform] duration-150 active:scale-[0.95] cursor-pointer border-none bg-transparent"
            title="Next slide (→)"
            aria-label="Next slide"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div
          className="flex items-center gap-1 px-2 py-1 rounded-md border font-mono text-[11px] tabular-nums"
          style={{
            backgroundColor: 'var(--ms-tl-bg)',
            borderColor: 'var(--ms-tl-border)',
          }}
        >
          <span
            ref={timecodeRef}
            className="text-(--ms-text-primary) font-medium"
          >
            {formatTime(currentTime)}
          </span>
          <span style={{ color: 'var(--ms-tl-text-dim)' }}>/</span>
          <span style={{ color: 'var(--ms-tl-text-muted)' }}>
            {formatTime(totalDuration)}
          </span>
        </div>
      </div>

      {/* Right Zone: Loop, Speed, Snap, Zoom, Collapse */}
      {!isMobile ? (
        <div className="flex items-center justify-end gap-1.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={toggleLoop}
            title="Toggle loop playback (L)"
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-semibold cursor-pointer transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] ${
              playbackSettings.loop
                ? 'border-(--ms-accent)/50 bg-(--ms-accent)/12 text-(--ms-accent)'
                : 'bg-transparent border-(--ms-tl-border-strong) text-(--ms-tl-text-muted) hover:text-(--ms-text-primary)'
            }`}
          >
            <Repeat size={11} />
            <span className="hidden xl:inline">Loop</span>
          </button>

          <button
            type="button"
            onClick={onCyclePlaybackSpeed}
            title="Cycle playback speed"
            className={`px-2 py-1 rounded-md border font-mono tabular-nums text-[10px] font-semibold cursor-pointer transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] ${
              playbackSpeed !== 1
                ? 'border-(--ms-accent)/50 bg-(--ms-accent)/12 text-(--ms-accent)'
                : 'bg-transparent border-(--ms-tl-border-strong) text-(--ms-tl-text-muted) hover:text-(--ms-text-primary)'
            }`}
          >
            {playbackSpeed}x
          </button>

          <button
            type="button"
            onClick={onToggleSnap}
            title="Toggle magnetic snap (hold Alt while dragging to bypass)"
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-semibold cursor-pointer transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] ${
              snapEnabled
                ? 'border-(--ms-accent)/50 bg-(--ms-accent)/12 text-(--ms-accent)'
                : 'bg-transparent border-(--ms-tl-border-strong) text-(--ms-tl-text-muted) hover:text-(--ms-text-primary)'
            }`}
          >
            <Magnet size={11} />
            <span className="hidden xl:inline">Snap</span>
          </button>

          <div className="hidden lg:block w-px h-4 mx-0.5" style={{ backgroundColor: 'var(--ms-tl-border-strong)' }} />

          <div className="hidden lg:flex items-center gap-1">
            <button
              type="button"
              onClick={() => onZoomChange(pxPerSec - 16)}
              title="Zoom out timeline"
              aria-label="Zoom out timeline"
              className="w-6 h-6 flex items-center justify-center rounded text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border-none bg-transparent cursor-pointer transition-[background-color,color,transform] duration-150 active:scale-[0.95]"
            >
              <ZoomOut size={12} />
            </button>
            <input
              type="range"
              min={MIN_PX_PER_SEC}
              max={MAX_PX_PER_SEC}
              step={4}
              value={pxPerSec}
              onChange={e => onZoomChange(Number(e.target.value))}
              aria-label="Timeline zoom"
              className="w-16 xl:w-20 h-1 cursor-pointer accent-(--ms-accent)"
            />
            <button
              type="button"
              onClick={() => onZoomChange(pxPerSec + 16)}
              title="Zoom in timeline"
              aria-label="Zoom in timeline"
              className="w-6 h-6 flex items-center justify-center rounded text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border-none bg-transparent cursor-pointer transition-[background-color,color,transform] duration-150 active:scale-[0.95]"
            >
              <ZoomIn size={12} />
            </button>
            <button
              type="button"
              onClick={onFitToView}
              title="Fit whole timeline to view"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-(--ms-tl-border-strong) text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) bg-transparent text-[10px] font-semibold cursor-pointer transition-[color,transform] duration-150 active:scale-[0.97]"
            >
              <Maximize2 size={10} />
              <span>Fit</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setTimelineTracksVisible(!timelineTracksVisible)}
            title={timelineTracksVisible ? 'Collapse tracks' : 'Expand tracks'}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-(--ms-tl-border-strong) text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) bg-transparent text-[10px] font-semibold cursor-pointer transition-[color,transform] duration-150 active:scale-[0.97]"
          >
            {timelineTracksVisible ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            <span className="hidden xl:inline">{timelineTracksVisible ? 'Hide' : 'Tracks'}</span>
          </button>
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  )
}
