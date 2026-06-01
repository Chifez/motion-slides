import { Volume2 } from 'lucide-react'
import { PX_PER_SEC, VO_TRACK_H, AUDIO_TYPE_VOICEOVER } from './constants'
import type { AudioKey, SlideWithTiming } from './types'
import { WaveformDecoration } from './WaveformDecoration'

interface Props {
  slidesWithTiming: SlideWithTiming[]
  slides: any[]
  selectedAudioKey: AudioKey | null
  setSelectedAudioKey: (key: AudioKey | null) => void
  setInspectorOpen: (open: boolean) => void
  activeProjectId: string | null
  updateProject: (id: string, updates: any) => void
}

export function VoiceoverTrackRow({
  slidesWithTiming,
  slides,
  selectedAudioKey,
  setSelectedAudioKey,
  setInspectorOpen,
  activeProjectId,
  updateProject,
}: Props) {
  return (
    <div
      className="flex-shrink-0 border-b border-white/[0.06] relative"
      style={{ height: VO_TRACK_H }}
    >
      <div className="absolute inset-0 bg-[#0b0b0f]" />
      {slidesWithTiming.map(item => {
        const audio = item.slide.audio
        if (!audio) return null
        const isSelected =
          selectedAudioKey?.type === AUDIO_TYPE_VOICEOVER && selectedAudioKey.slideId === item.slide.id
        const activeWidth = ((audio.trimEnd - audio.trimStart) / audio.playbackRate) * PX_PER_SEC

        const handleClick = () => {
          if (isSelected) {
            setSelectedAudioKey(null)
            setInspectorOpen(false)
          } else {
            setSelectedAudioKey({ type: AUDIO_TYPE_VOICEOVER, slideId: item.slide.id })
            setInspectorOpen(false)
          }
        }

        const handleDoubleClick = () => {
          setSelectedAudioKey({ type: AUDIO_TYPE_VOICEOVER, slideId: item.slide.id })
          setInspectorOpen(true)
        }

        const handleTrimDrag = (e: React.MouseEvent) => {
          e.stopPropagation()
          const startX = e.clientX
          const startTrimEnd = audio.trimEnd
          const onMove = (mv: MouseEvent) => {
            const newTrimEnd = Math.min(
              audio.duration,
              Math.max(audio.trimStart + 0.5, startTrimEnd + (mv.clientX - startX) / PX_PER_SEC),
            )
            if (activeProjectId) {
              updateProject(activeProjectId, {
                slides: slides.map(s =>
                  s.id === item.slide.id ? { ...s, audio: { ...audio, trimEnd: newTrimEnd } } : s,
                ),
                synced: false,
              })
            }
          }
          const onUp = () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
          }
          window.addEventListener('mousemove', onMove)
          window.addEventListener('mouseup', onUp)
        }

        return (
          <div
            key={`vo-${item.slide.id}`}
            className="absolute top-2 group"
            style={{
              left: `${item.start * PX_PER_SEC + 2}px`,
              width: `${Math.max(32, activeWidth - 4)}px`,
              height: `${VO_TRACK_H - 16}px`,
            }}
          >
            <div
              onClick={handleClick}
              onDoubleClick={handleDoubleClick}
              className={`w-full h-full rounded-lg cursor-pointer relative overflow-hidden transition-all ${
                isSelected
                  ? 'bg-violet-600/25 border-2 border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                  : 'bg-violet-900/20 border border-violet-700/30 hover:border-violet-600/50'
              }`}
            >
              <WaveformDecoration color={isSelected ? 'rgba(167,139,250,0.45)' : 'rgba(139,92,246,0.25)'} />
              <div className="absolute inset-x-2 top-0.5 flex items-center gap-1 pointer-events-none">
                <Volume2 size={8} className="text-violet-400/70 shrink-0" />
                <span className="text-[8px] font-medium text-violet-300/60 truncate">{audio.fileName}</span>
              </div>
              {isSelected && (
                <div className="absolute inset-x-2 bottom-0.5 text-[7px] font-mono text-violet-400/50 pointer-events-none">
                  dbl-click for settings
                </div>
              )}
            </div>
            <div
              className={`absolute right-0 top-0 h-full w-2 cursor-ew-resize z-20 flex items-center justify-center transition-opacity ${
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              onMouseDown={handleTrimDrag}
            >
              <div className="w-0.5 h-4 bg-violet-400/50 rounded-full" />
            </div>
          </div>
        )
      })}
      {slides.every(s => !s.audio) && (
        <div className="absolute inset-0 flex items-center px-4 text-[9px] text-white/15 font-medium">
          No voiceovers — hover V.O. label and click +
        </div>
      )}
    </div>
  )
}
