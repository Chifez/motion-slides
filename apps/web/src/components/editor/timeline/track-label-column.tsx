import { Eye, EyeOff, Layers, Mic, Music, Plus, Type, Volume2, VolumeX } from 'lucide-react'
import {
  RULER_H,
  SLIDE_TRACK_H,
  CAPTION_TRACK_H,
  VO_TRACK_H,
  BGM_TRACK_H,
  TRACK_HEADER_W,
  AUDIO_DRAWER_VO,
  AUDIO_DRAWER_BGM,
} from './constants'
import type { AudioDrawer, MutedTracks } from './types'

interface Props {
  audioDrawer: AudioDrawer
  setAudioDrawer: (drawer: AudioDrawer) => void
  liveSlideIndex: number
  slidesCount: number
  onAddCaption: () => void
  captionsVisible: boolean
  onToggleCaptionsVisible: () => void
  mutedTracks: MutedTracks
  onToggleMuteTrack: (track: 'vo' | 'bgm') => void
}

/**
 * Sticky left-hand studio track header column aligned row-for-row with timeline lanes.
 * Keeps visibility, mute, and add controls permanently accessible without hover-only discovery.
 */
export function TrackLabelColumn({
  audioDrawer,
  setAudioDrawer,
  liveSlideIndex,
  slidesCount,
  onAddCaption,
  captionsVisible,
  onToggleCaptionsVisible,
  mutedTracks,
  onToggleMuteTrack,
}: Props) {
  return (
    <div
      className="shrink-0 border-r flex flex-col z-10 relative select-none"
      style={{
        width: TRACK_HEADER_W,
        backgroundColor: 'var(--ms-tl-surface)',
        borderColor: 'var(--ms-tl-border)',
      }}
    >
      {/* Ruler corner */}
      <div
        className="border-b px-3 flex items-center justify-between shrink-0"
        style={{ height: RULER_H, borderColor: 'var(--ms-tl-border)' }}
      >
        <span
          className="text-[10px] font-semibold tracking-wider uppercase"
          style={{ color: 'var(--ms-tl-text-muted)' }}
        >
          Tracks
        </span>
      </div>

      {/* Slides Header */}
      <div
        className="border-b px-3 flex items-center justify-between gap-2 shrink-0 relative"
        style={{ height: SLIDE_TRACK_H, borderColor: 'var(--ms-tl-border)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Layers size={13} className="shrink-0" style={{ color: 'var(--ms-tl-text-muted)' }} />
          <span className="text-[11px] font-medium text-(--ms-text-primary) truncate">Slides</span>
        </div>
        <span
          className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded border shrink-0"
          style={{
            backgroundColor: 'var(--ms-tl-bg)',
            borderColor: 'var(--ms-tl-border)',
            color: 'var(--ms-tl-text-muted)',
          }}
        >
          {slidesCount}
        </span>
      </div>

      {/* Captions Header */}
      <div
        className="border-b pl-3 pr-2 flex items-center justify-between gap-1 shrink-0 relative"
        style={{ height: CAPTION_TRACK_H, borderColor: 'var(--ms-tl-border)' }}
      >
        <span
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r"
          style={{ backgroundColor: 'var(--ms-tl-caption-accent)' }}
        />
        <div className="flex items-center gap-2 min-w-0">
          <Type size={13} className="shrink-0" style={{ color: 'var(--ms-tl-caption-accent)' }} />
          <span className="text-[11px] font-medium text-(--ms-text-primary) truncate">Captions</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onToggleCaptionsVisible}
            title={captionsVisible ? 'Hide captions in preview' : 'Show captions in preview'}
            aria-label={captionsVisible ? 'Hide captions' : 'Show captions'}
            className={`w-6 h-6 rounded flex items-center justify-center border-none cursor-pointer transition-[background-color,color,transform] duration-150 active:scale-[0.94] ${
              captionsVisible
                ? 'bg-transparent text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                : 'bg-black/[0.06] dark:bg-white/[0.08] text-(--ms-text-muted)'
            }`}
          >
            {captionsVisible ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
          <button
            type="button"
            onClick={onAddCaption}
            title="Add caption block at playhead"
            aria-label="Add caption"
            className="w-6 h-6 rounded flex items-center justify-center border-none bg-transparent text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer transition-[background-color,color,transform] duration-150 active:scale-[0.94]"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Voiceover Header */}
      <div
        className="border-b pl-3 pr-2 flex items-center justify-between gap-1 shrink-0 relative"
        style={{ height: VO_TRACK_H, borderColor: 'var(--ms-tl-border)' }}
      >
        <span
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r"
          style={{ backgroundColor: 'var(--ms-tl-vo-accent)' }}
        />
        <div className="flex items-center gap-2 min-w-0">
          <Mic size={13} className="shrink-0" style={{ color: 'var(--ms-tl-vo-accent)' }} />
          <span className="text-[11px] font-medium text-(--ms-text-primary) truncate">Voiceover</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onToggleMuteTrack('vo')}
            title={mutedTracks.vo ? 'Unmute voiceover track' : 'Mute voiceover track'}
            aria-label={mutedTracks.vo ? 'Unmute voiceover track' : 'Mute voiceover track'}
            className={`w-6 h-6 rounded flex items-center justify-center border-none cursor-pointer transition-[background-color,color,transform] duration-150 active:scale-[0.94] ${
              mutedTracks.vo
                ? 'bg-red-500/15 text-red-500 dark:text-red-400'
                : 'bg-transparent text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
            }`}
          >
            {mutedTracks.vo ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
          <button
            type="button"
            onClick={() => setAudioDrawer(audioDrawer === AUDIO_DRAWER_VO ? null : AUDIO_DRAWER_VO)}
            title={`Add voiceover to slide ${liveSlideIndex + 1}`}
            aria-label="Add voiceover"
            className={`w-6 h-6 rounded flex items-center justify-center border-none cursor-pointer transition-[background-color,color,transform] duration-150 active:scale-[0.94] ${
              audioDrawer === AUDIO_DRAWER_VO
                ? 'bg-(--ms-accent) text-white'
                : 'bg-transparent text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
            }`}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Music Header */}
      <div
        className="pl-3 pr-2 flex items-center justify-between gap-1 shrink-0 relative"
        style={{ height: BGM_TRACK_H }}
      >
        <span
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r"
          style={{ backgroundColor: 'var(--ms-tl-bgm-accent)' }}
        />
        <div className="flex items-center gap-2 min-w-0">
          <Music size={13} className="shrink-0" style={{ color: 'var(--ms-tl-bgm-accent)' }} />
          <span className="text-[11px] font-medium text-(--ms-text-primary) truncate">Music</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onToggleMuteTrack('bgm')}
            title={mutedTracks.bgm ? 'Unmute background music' : 'Mute background music'}
            aria-label={mutedTracks.bgm ? 'Unmute background music' : 'Mute background music'}
            className={`w-6 h-6 rounded flex items-center justify-center border-none cursor-pointer transition-[background-color,color,transform] duration-150 active:scale-[0.94] ${
              mutedTracks.bgm
                ? 'bg-red-500/15 text-red-500 dark:text-red-400'
                : 'bg-transparent text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
            }`}
          >
            {mutedTracks.bgm ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
          <button
            type="button"
            onClick={() => setAudioDrawer(audioDrawer === AUDIO_DRAWER_BGM ? null : AUDIO_DRAWER_BGM)}
            title="Add background music"
            aria-label="Add background music"
            className={`w-6 h-6 rounded flex items-center justify-center border-none cursor-pointer transition-[background-color,color,transform] duration-150 active:scale-[0.94] ${
              audioDrawer === AUDIO_DRAWER_BGM
                ? 'bg-(--ms-accent) text-white'
                : 'bg-transparent text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
            }`}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
