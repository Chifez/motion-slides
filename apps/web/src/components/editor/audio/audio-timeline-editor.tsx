import { Volume2, Gauge, RotateCw, Play, Pause, Loader2, Scissors } from 'lucide-react'
import type { SlideAudio } from '@motionslides/shared'
import { useAudioPreview } from '@/hooks/use-audio-preview'
import { TrimWaveformCanvas } from './trim-waveform-canvas'

interface AudioTimelineEditorProps {
  audio: SlideAudio
  onUpdate: (updates: Partial<SlideAudio>) => void
}

export function AudioTimelineEditor({ audio, onUpdate }: AudioTimelineEditorProps) {
  const {
    peaks,
    isLoading,
    isPlaying,
    playbackTime,
    togglePlay,
    seekToPercent,
  } = useAudioPreview(audio)

  const handleTrimStartChange = (val: number) => {
    const start = Math.max(0, Math.min(val, audio.trimEnd - 0.2))
    onUpdate({ trimStart: start })
  }

  const handleTrimEndChange = (val: number) => {
    const end = Math.min(audio.duration, Math.max(val, audio.trimStart + 0.2))
    onUpdate({ trimEnd: end })
  }

  return (
    <div className="flex flex-col gap-4 p-3 bg-(--ms-bg-surface) border border-(--ms-border) rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Scissors size={14} className="text-(--ms-accent)" />
          <span className="text-xs font-semibold text-(--ms-text-primary)">
            Trim & Audio Settings
          </span>
        </div>
        <button
          onClick={togglePlay}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-(--ms-bg-base) hover:bg-(--ms-border) text-(--ms-text-primary) transition border border-(--ms-border) cursor-pointer"
          title={isPlaying ? 'Pause preview' : 'Play preview'}
        >
          {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>

      <div className="relative h-16 bg-(--ms-bg-base)/30 border border-(--ms-border)/50 rounded-md overflow-hidden flex items-center justify-center">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-(--ms-accent)" />
            <span className="text-[10px] text-(--ms-text-muted)">Generating Waveform...</span>
          </div>
        ) : (
          <TrimWaveformCanvas
            peaks={peaks}
            trimStart={audio.trimStart}
            trimEnd={audio.trimEnd}
            duration={audio.duration}
            playbackTime={playbackTime}
            isPlaying={isPlaying}
            onClick={seekToPercent}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] text-(--ms-text-muted)">
          <span>Trim Start: {audio.trimStart.toFixed(2)}s</span>
          <span>Trim End: {audio.trimEnd.toFixed(2)}s</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-medium text-(--ms-text-muted)">Start Point</span>
            <input
              type="range"
              min={0}
              max={audio.duration}
              step={0.05}
              value={audio.trimStart}
              onChange={(e) => handleTrimStartChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-(--ms-border) rounded-lg appearance-none cursor-pointer accent-(--ms-accent)"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-medium text-(--ms-text-muted)">End Point</span>
            <input
              type="range"
              min={0}
              max={audio.duration}
              step={0.05}
              value={audio.trimEnd}
              onChange={(e) => handleTrimEndChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-(--ms-border) rounded-lg appearance-none cursor-pointer accent-(--ms-accent)"
            />
          </div>
        </div>
      </div>

      <hr className="border-(--ms-border) my-1" />

      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-2.5">
          <Volume2 size={14} className="text-(--ms-text-muted) shrink-0" />
          <div className="flex-1 flex items-center justify-between gap-3">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audio.volume}
              onChange={(e) => onUpdate({ volume: parseFloat(e.target.value) })}
              className="flex-1 h-1 bg-(--ms-border) rounded-lg appearance-none cursor-pointer accent-(--ms-accent)"
            />
            <span className="text-[10px] font-mono text-(--ms-text-secondary) w-8 text-right">
              {Math.round(audio.volume * 100)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Gauge size={14} className="text-(--ms-text-muted) shrink-0" />
          <div className="flex-1 flex items-center justify-between gap-3">
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={audio.playbackRate}
              onChange={(e) => onUpdate({ playbackRate: parseFloat(e.target.value) })}
              className="flex-1 h-1 bg-(--ms-border) rounded-lg appearance-none cursor-pointer accent-(--ms-accent)"
            />
            <span className="text-[10px] font-mono text-(--ms-text-secondary) w-8 text-right">
              {audio.playbackRate.toFixed(1)}x
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pl-0.5">
          <div className="flex items-center gap-2.5">
            <RotateCw size={14} className="text-(--ms-text-muted)" />
            <span className="text-xs text-(--ms-text-secondary)">Loop Playback</span>
          </div>
          <button
            onClick={() => onUpdate({ loop: !audio.loop })}
            className={`w-7 h-4 rounded-full p-0.5 transition-colors cursor-pointer border-none ${
              audio.loop ? 'bg-(--ms-accent)' : 'bg-(--ms-border)'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform ${
                audio.loop ? 'translate-x-3' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
