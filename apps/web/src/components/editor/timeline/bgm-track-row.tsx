import { useState } from 'react'
import { Music, Repeat } from 'lucide-react'
import type { SlideAudio } from '@motionslides/shared'
import { BGM_TRACK_H, AUDIO_TYPE_BGM } from './constants'
import type { AudioKey } from './types'
import { WaveformDecoration } from './waveform-decoration'

interface Props {
  backgroundMusic: SlideAudio | null
  totalDuration: number
  pxPerSec: number
  isMuted: boolean
  selectedAudioKey: AudioKey | null
  setSelectedAudioKey: (key: AudioKey | null) => void
  setInspectorOpen: (open: boolean) => void
  onOpenBgmDrawer: () => void
  onDropBgmFile: (file: File) => void
}

/**
 * Full-deck background music track with single-click AudioInspector integration,
 * mute dimming, clickable empty lane, and direct audio file drag-and-drop.
 */
export function BgmTrackRow({
  backgroundMusic,
  totalDuration,
  pxPerSec,
  isMuted,
  selectedAudioKey,
  setSelectedAudioKey,
  setInspectorOpen,
  onOpenBgmDrawer,
  onDropBgmFile,
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false)
  const isSelected = selectedAudioKey?.type === AUDIO_TYPE_BGM

  const handleClick = () => {
    if (isSelected) {
      setSelectedAudioKey(null)
      setInspectorOpen(false)
    } else {
      setSelectedAudioKey({ type: AUDIO_TYPE_BGM })
      setInspectorOpen(true)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      setIsDragOver(true)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      onDropBgmFile(file)
    }
  }

  return (
    <div
      className={`flex-shrink-0 relative transition-colors duration-150 ${
        isDragOver ? 'ring-1 ring-inset ring-(--ms-accent)' : ''
      }`}
      style={{
        height: BGM_TRACK_H,
        backgroundColor: isDragOver
          ? 'color-mix(in srgb, var(--ms-accent) 8%, var(--ms-tl-track-alt))'
          : 'var(--ms-tl-track-alt)',
      }}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {backgroundMusic ? (
        <div
          className={`absolute top-1.5 transition-opacity duration-150 ${isMuted ? 'opacity-40' : ''}`}
          style={{
            left: '2px',
            width: `${Math.max(40, totalDuration * pxPerSec - 4)}px`,
            height: `${BGM_TRACK_H - 12}px`,
          }}
        >
          <div
            onClick={handleClick}
            className={`w-full h-full rounded-md cursor-pointer relative overflow-hidden border transition-[border-color,box-shadow] duration-150 ${
              isSelected
                ? 'border-(--ms-accent) ring-1 ring-(--ms-accent)/50'
                : 'border-(--ms-tl-border-strong) hover:border-(--ms-tl-bgm-accent)'
            }`}
            style={{
              backgroundColor: 'color-mix(in srgb, var(--ms-tl-bgm-accent) 10%, var(--ms-bg-elevated))',
            }}
          >
            <span
              className="absolute left-0 top-0 bottom-0 w-0.5 pointer-events-none z-10"
              style={{ backgroundColor: 'var(--ms-tl-bgm-accent)' }}
            />

            <WaveformDecoration
              color={isSelected ? 'var(--ms-bgm-fill-selected)' : 'var(--ms-bgm-fill)'}
              audioUrl={backgroundMusic.url}
              trimStart={backgroundMusic.trimStart}
              trimEnd={backgroundMusic.trimEnd}
              duration={backgroundMusic.duration}
            />

            <div className="relative z-10 flex items-center gap-1.5 px-2 pt-1 pointer-events-none">
              <Music size={10} className="shrink-0" style={{ color: 'var(--ms-tl-bgm-accent)' }} />
              <span className="text-[10px] font-medium text-(--ms-text-primary) truncate leading-none">
                {backgroundMusic.fileName}
              </span>
              {backgroundMusic.loop && (
                <Repeat size={9} className="shrink-0 opacity-60" style={{ color: 'var(--ms-tl-bgm-accent)' }} />
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenBgmDrawer}
          className="absolute inset-0 w-full h-full flex items-center px-4 text-[11px] font-medium border-none bg-transparent text-left cursor-pointer hover:bg-black/[0.025] dark:hover:bg-white/[0.025] transition-colors duration-150"
          style={{ color: 'var(--ms-tl-text-dim)' }}
        >
          {isDragOver
            ? 'Drop audio file to set background music…'
            : 'Click or drop an audio file to add background music'}
        </button>
      )}
    </div>
  )
}
