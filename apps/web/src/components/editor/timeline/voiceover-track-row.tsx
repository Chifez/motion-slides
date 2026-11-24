import { Volume2 } from 'lucide-react'
import type { Slide, Project } from '@motionslides/shared'
import { VO_TRACK_H, AUDIO_TYPE_VOICEOVER } from './constants'
import type { AudioKey, SlideWithTiming } from './types'
import { WaveformDecoration } from './waveform-decoration'

interface Props {
  slidesWithTiming: SlideWithTiming[]
  slides: Slide[]
  pxPerSec: number
  isMuted: boolean
  liveSlideIndex: number
  selectedAudioKey: AudioKey | null
  setSelectedAudioKey: (key: AudioKey | null) => void
  setInspectorOpen: (open: boolean) => void
  onOpenVoDrawer: () => void
  activeProjectId: string | null
  updateProject: (id: string, updates: Partial<Project>) => void
}

/**
 * Per-slide voiceover lane supporting single-click AudioInspector opening,
 * bi-directional trim handles (`trimStart` and `trimEnd`), and clickable empty state.
 */
export function VoiceoverTrackRow({
  slidesWithTiming,
  slides,
  pxPerSec,
  isMuted,
  liveSlideIndex,
  selectedAudioKey,
  setSelectedAudioKey,
  setInspectorOpen,
  onOpenVoDrawer,
  activeProjectId,
  updateProject,
}: Props) {
  const hasAnyVoiceover = slides.some(s => Boolean(s.audio))

  return (
    <div
      className="flex-shrink-0 border-b relative"
      style={{
        height: VO_TRACK_H,
        borderColor: 'var(--ms-tl-border)',
        backgroundColor: 'var(--ms-tl-track-bg)',
      }}
    >
      {slidesWithTiming.map(item => {
        const isSelected =
          selectedAudioKey?.type === AUDIO_TYPE_VOICEOVER && selectedAudioKey.slideId === item.slide.id
        return (
          <VoiceoverClip
            key={`vo-${item.slide.id}`}
            item={item}
            slides={slides}
            pxPerSec={pxPerSec}
            isMuted={isMuted}
            isSelected={isSelected}
            setSelectedAudioKey={setSelectedAudioKey}
            setInspectorOpen={setInspectorOpen}
            activeProjectId={activeProjectId}
            updateProject={updateProject}
          />
        )
      })}

      {!hasAnyVoiceover && (
        <button
          type="button"
          onClick={onOpenVoDrawer}
          className="absolute inset-0 w-full h-full flex items-center px-4 text-[11px] font-medium border-none bg-transparent text-left cursor-pointer hover:bg-black/[0.025] dark:hover:bg-white/[0.025] transition-colors duration-150"
          style={{ color: 'var(--ms-tl-text-dim)' }}
        >
          Click to add voiceover for Slide {liveSlideIndex + 1}
        </button>
      )}
    </div>
  )
}

interface VoiceoverClipProps {
  item: SlideWithTiming
  slides: Slide[]
  pxPerSec: number
  isMuted: boolean
  isSelected: boolean
  setSelectedAudioKey: (key: AudioKey | null) => void
  setInspectorOpen: (open: boolean) => void
  activeProjectId: string | null
  updateProject: (id: string, updates: Partial<Project>) => void
}

function VoiceoverClip({
  item,
  slides,
  pxPerSec,
  isMuted,
  isSelected,
  setSelectedAudioKey,
  setInspectorOpen,
  activeProjectId,
  updateProject,
}: VoiceoverClipProps) {
  const audio = item.slide.audio
  if (!audio) return null

  const activeWidth = ((audio.trimEnd - audio.trimStart) / audio.playbackRate) * pxPerSec
  const minWindow = Math.min(0.4, audio.duration)

  const handleClick = () => {
    if (isSelected) {
      setSelectedAudioKey(null)
      setInspectorOpen(false)
    } else {
      setSelectedAudioKey({ type: AUDIO_TYPE_VOICEOVER, slideId: item.slide.id })
      setInspectorOpen(true)
    }
  }

  const handleTrimStartDrag = (e: React.MouseEvent) => {
    e.stopPropagation()
    const startX = e.clientX
    const initialTrimStart = audio.trimStart

    const onMove = (mv: MouseEvent) => {
      const deltaAudioSec = ((mv.clientX - startX) / pxPerSec) * audio.playbackRate
      const newTrimStart = Math.max(
        0,
        Math.min(audio.trimEnd - minWindow, initialTrimStart + deltaAudioSec),
      )
      if (activeProjectId) {
        updateProject(activeProjectId, {
          slides: slides.map(s =>
            s.id === item.slide.id ? { ...s, audio: { ...audio, trimStart: newTrimStart } } : s,
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

  const handleTrimEndDrag = (e: React.MouseEvent) => {
    e.stopPropagation()
    const startX = e.clientX
    const initialTrimEnd = audio.trimEnd

    const onMove = (mv: MouseEvent) => {
      const deltaAudioSec = ((mv.clientX - startX) / pxPerSec) * audio.playbackRate
      const newTrimEnd = Math.min(
        audio.duration,
        Math.max(audio.trimStart + minWindow, initialTrimEnd + deltaAudioSec),
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
      className={`absolute top-1.5 group transition-opacity duration-150 ${isMuted ? 'opacity-40' : ''}`}
      style={{
        left: `${item.start * pxPerSec + 2}px`,
        width: `${Math.max(36, activeWidth - 4)}px`,
        height: `${VO_TRACK_H - 12}px`,
      }}
    >
      <div
        onClick={handleClick}
        className={`w-full h-full rounded-md cursor-pointer relative overflow-hidden border transition-[border-color,box-shadow] duration-150 ${
          isSelected
            ? 'border-(--ms-accent) ring-1 ring-(--ms-accent)/50'
            : 'border-(--ms-tl-border-strong) hover:border-(--ms-tl-vo-accent)'
        }`}
        style={{
          backgroundColor: 'color-mix(in srgb, var(--ms-tl-vo-accent) 10%, var(--ms-bg-elevated))',
        }}
      >
        <span
          className="absolute left-0 top-0 bottom-0 w-0.5 pointer-events-none z-10"
          style={{ backgroundColor: 'var(--ms-tl-vo-accent)' }}
        />

        <WaveformDecoration
          color={isSelected ? 'var(--ms-vo-fill-selected)' : 'var(--ms-vo-fill)'}
          audioUrl={audio.url}
          trimStart={audio.trimStart}
          trimEnd={audio.trimEnd}
          duration={audio.duration}
        />

        <div className="relative z-10 flex items-center gap-1 px-2 pt-1 pointer-events-none">
          <Volume2 size={10} className="shrink-0" style={{ color: 'var(--ms-tl-vo-accent)' }} />
          <span className="text-[10px] font-medium text-(--ms-text-primary) truncate leading-none">
            {audio.fileName}
          </span>
        </div>
      </div>

      {/* Left trim handle (trimStart) */}
      <div
        onMouseDown={handleTrimStartDrag}
        title="Drag to trim voiceover start"
        className={`absolute left-0 top-0 h-full w-2 cursor-ew-resize z-20 flex items-center justify-center transition-opacity duration-150 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <div className="w-0.5 h-4 rounded-full bg-(--ms-tl-vo-accent)" />
      </div>

      {/* Right trim handle (trimEnd) */}
      <div
        onMouseDown={handleTrimEndDrag}
        title="Drag to trim voiceover end"
        className={`absolute right-0 top-0 h-full w-2 cursor-ew-resize z-20 flex items-center justify-center transition-opacity duration-150 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <div className="w-0.5 h-4 rounded-full bg-(--ms-tl-vo-accent)" />
      </div>
    </div>
  )
}
