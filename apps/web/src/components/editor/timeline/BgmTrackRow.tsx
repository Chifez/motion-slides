import { Music } from 'lucide-react'
import type { SlideAudio } from '@motionslides/shared'
import { PX_PER_SEC, BGM_TRACK_H, AUDIO_TYPE_BGM } from './constants'
import type { AudioKey } from './types'
import { WaveformDecoration } from './WaveformDecoration'

interface Props {
  backgroundMusic: SlideAudio | null
  totalDuration: number
  selectedAudioKey: AudioKey | null
  setSelectedAudioKey: (key: AudioKey | null) => void
  setInspectorOpen: (open: boolean) => void
}

export function BgmTrackRow({
  backgroundMusic,
  totalDuration,
  selectedAudioKey,
  setSelectedAudioKey,
  setInspectorOpen,
}: Props) {
  const isSelected = selectedAudioKey?.type === AUDIO_TYPE_BGM

  const handleClick = () => {
    if (isSelected) {
      setSelectedAudioKey(null)
      setInspectorOpen(false)
    } else {
      setSelectedAudioKey({ type: AUDIO_TYPE_BGM })
      setInspectorOpen(false)
    }
  }

  const handleDoubleClick = () => {
    setSelectedAudioKey({ type: AUDIO_TYPE_BGM })
    setInspectorOpen(true)
  }

  return (
    <div className="flex-shrink-0 relative" style={{ height: BGM_TRACK_H }}>
      <div className="absolute inset-0 bg-[#0a0a0d]" />
      {backgroundMusic ? (
        <div
          className="absolute top-2 group"
          style={{
            left: '2px',
            width: `${Math.max(40, totalDuration * PX_PER_SEC - 4)}px`,
            height: `${BGM_TRACK_H - 16}px`,
          }}
        >
          <div
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            className={`w-full h-full rounded-lg cursor-pointer relative overflow-hidden transition-all ${
              isSelected
                ? 'bg-sky-600/25 border-2 border-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.2)]'
                : 'bg-sky-900/20 border border-sky-700/30 hover:border-sky-600/50'
            }`}
          >
            <WaveformDecoration color={isSelected ? 'rgba(125,211,252,0.4)' : 'rgba(56,189,248,0.2)'} />
            <div className="absolute inset-x-2 top-0.5 flex items-center gap-1 pointer-events-none">
              <Music size={8} className="text-sky-400/70 shrink-0" />
              <span className="text-[8px] font-medium text-sky-300/60 truncate">{backgroundMusic.fileName}</span>
            </div>
            {isSelected && (
              <div className="absolute inset-x-2 bottom-0.5 text-[7px] font-mono text-sky-400/50 pointer-events-none">
                dbl-click for settings
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center px-4 text-[9px] text-white/15 font-medium">
          No background music — hover Music label and click +
        </div>
      )}
    </div>
  )
}
