import { Layers, SkipBack, Play, Pause, SkipForward, ChevronDown, ChevronUp } from 'lucide-react'
import type { PlaybackSettings, Project } from '@motionslides/shared'
import { formatTime } from './constants'
import { useTimelineRefs } from './timeline-refs-context'

interface Props {
  isPlaying: boolean
  setIsPlaying: (v: boolean) => void
  currentTime: number
  setCurrentTime: (v: number) => void
  totalDuration: number
  playbackSettings: PlaybackSettings
  activeProjectId: string | null
  updateProject: (id: string, updates: Partial<Project>) => void
  timelineTracksVisible: boolean
  setTimelineTracksVisible: (v: boolean) => void
  isMobile: boolean
}

/**
 * The fixed-height transport bar at the top of the Timeline view.
 * Contains: mode label, skip-back, play/pause, skip-forward, timecode,
 * and on desktop: Loop toggle + Hide/Show Tracks button.
 */
export function TimelineToolbar({
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
  totalDuration,
  playbackSettings,
  activeProjectId,
  updateProject,
  timelineTracksVisible,
  setTimelineTracksVisible,
  isMobile,
}: Props) {
  const toggleLoop = () => {
    if (!activeProjectId) return
    updateProject(activeProjectId, {
      playbackSettings: { ...playbackSettings, loop: !playbackSettings.loop },
    })
  }

  const { timecodeRef } = useTimelineRefs()

  return (
    <div
      className="h-10 shrink-0 flex items-center justify-between px-4 border-b z-20"
      style={{ backgroundColor: 'var(--ms-tl-surface)', borderColor: 'var(--ms-tl-border)' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--ms-tl-text-muted)' }}>
          <Layers size={12} />
          <span>Timeline</span>
        </div>

        <div className="w-px h-4" style={{ backgroundColor: 'var(--ms-tl-border-strong)' }} />

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => { setCurrentTime(0); setIsPlaying(false) }}
            className="p-1.5 rounded transition-colors cursor-pointer border-none bg-transparent"
            style={{ color: 'var(--ms-tl-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--ms-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--ms-tl-text-muted)')}
            title="Return to start"
          >
            <SkipBack size={13} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause' : 'Play'}
            className={`flex items-center justify-center w-7 h-7 rounded-full transition cursor-pointer border-none shadow-lg ${
              isPlaying
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-violet-600 text-white hover:bg-violet-500'
            }`}
          >
            {isPlaying
              ? <Pause size={12} fill="currentColor" />
              : <Play size={12} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            onClick={() => { setCurrentTime(totalDuration); setIsPlaying(false) }}
            className="p-1.5 rounded transition-colors cursor-pointer border-none bg-transparent"
            style={{ color: 'var(--ms-tl-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--ms-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--ms-tl-text-muted)')}
            title="Go to end"
          >
            <SkipForward size={13} />
          </button>
        </div>

        <div className="flex items-center gap-1 font-mono text-[11px]">
          <span
            ref={timecodeRef}
            className="tabular-nums"
            style={{ color: 'var(--ms-text-primary)' }}
          >
            {formatTime(currentTime)}
          </span>
          <span style={{ color: 'var(--ms-tl-text-dim)' }}>/</span>
          <span className="tabular-nums" style={{ color: 'var(--ms-tl-text-muted)' }}>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {!isMobile && (
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLoop}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border cursor-pointer transition ${
              playbackSettings.loop
                ? 'bg-violet-600/20 border-violet-500/50 text-violet-500'
                : ''
            }`}
            style={!playbackSettings.loop ? {
              background: 'transparent',
              borderColor: 'var(--ms-tl-border-strong)',
              color: 'var(--ms-tl-text-muted)',
            } : {}}
          >
            Loop
          </button>

          <button
            onClick={() => setTimelineTracksVisible(!timelineTracksVisible)}
            className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md border transition cursor-pointer bg-transparent"
            style={{ borderColor: 'var(--ms-tl-border-strong)', color: 'var(--ms-tl-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--ms-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--ms-tl-text-muted)')}
          >
            {timelineTracksVisible ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            {timelineTracksVisible ? 'Hide Tracks' : 'Show Tracks'}
          </button>
        </div>
      )}
    </div>
  )
}
