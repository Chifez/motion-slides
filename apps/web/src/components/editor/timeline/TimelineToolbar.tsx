import { Layers, SkipBack, Play, Pause, SkipForward, ChevronDown, ChevronUp } from 'lucide-react'
import type { PlaybackSettings, Project } from '@motionslides/shared'
import { formatTime } from './constants'

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

  return (
    <div className="h-10 shrink-0 flex items-center justify-between px-4 bg-[#111115] border-b border-white/[0.06] z-20">
      {/* Left: mode label + transport */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-white/30">
          <Layers size={12} />
          <span>Timeline</span>
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Transport controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => { setCurrentTime(0); setIsPlaying(false) }}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/8 rounded transition-colors cursor-pointer border-none bg-transparent"
            title="Return to start"
          >
            <SkipBack size={13} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause' : 'Play'}
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-all cursor-pointer border-none shadow-lg ${
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
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/8 rounded transition-colors cursor-pointer border-none bg-transparent"
            title="Go to end"
          >
            <SkipForward size={13} />
          </button>
        </div>

        {/* Timecode */}
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <span className="text-white/90 tabular-nums">{formatTime(currentTime)}</span>
          <span className="text-white/20">/</span>
          <span className="text-white/35 tabular-nums">{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Right: Loop + track toggle — desktop only */}
      {!isMobile && (
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLoop}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border cursor-pointer transition-all ${
              playbackSettings.loop
                ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                : 'bg-transparent border-white/10 text-white/30 hover:text-white/60'
            }`}
          >
            Loop
          </button>

          <button
            onClick={() => setTimelineTracksVisible(!timelineTracksVisible)}
            className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md border border-white/10 text-white/40 hover:text-white/80 hover:border-white/20 transition-all cursor-pointer bg-transparent"
          >
            {timelineTracksVisible ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            {timelineTracksVisible ? 'Hide Tracks' : 'Show Tracks'}
          </button>
        </div>
      )}
    </div>
  )
}
