import { X, Mic, Music } from 'lucide-react'
import type { SlideAudio } from '@motionslides/shared'
import type { AudioDrawer } from './types'
import { VOQuickAdd } from './VOQuickAdd'
import { BgmUploader } from './BgmUploader'
import {
  AUDIO_DRAWER_VO,
  AUDIO_DRAWER_BGM,
  BGM_LABEL,
  VO_ADD_LABEL,
  BGM_SUBTITLE,
} from './constants'

interface Props {
  audioDrawer: AudioDrawer
  liveSlideIndex: number
  existingVoiceover: SlideAudio | null
  onSaveVoiceover: (audio: SlideAudio) => void
  onSaveBgm: (audio: SlideAudio) => void
  onClose: () => void
}

/**
 * Centred modal overlay shown when the user clicks the + button on a track label.
 * Houses the VOQuickAdd or BgmUploader widget depending on which track was clicked.
 */
export function AudioDrawerModal({
  audioDrawer,
  liveSlideIndex,
  existingVoiceover,
  onSaveVoiceover,
  onSaveBgm,
  onClose,
}: Props) {
  if (!audioDrawer) return null

  return (
    <div
      className="fixed inset-0 z-(--z-overlay) flex items-end justify-center sm:items-center sm:justify-end sm:p-2 pointer-events-none"
    >
      <div
        className="pointer-events-auto rounded-t-2xl sm:rounded-xl w-full sm:w-96 flex flex-col overflow-hidden border shadow-2xl"
        style={{
          maxHeight: '60vh',
          backgroundColor: 'var(--ms-bg-elevated)',
          borderColor: 'var(--ms-border)',
          boxShadow: 'var(--ms-shadow)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--ms-border)' }}>
          <div className="flex items-center gap-2">
            {audioDrawer === AUDIO_DRAWER_VO ? (
              <>
                <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                  <Mic size={13} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white">{VO_ADD_LABEL}</p>
                  <p className="text-[10px] text-white/35">Slide {liveSlideIndex + 1}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-7 h-7 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center">
                  <Music size={13} className="text-sky-400" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white">{BGM_LABEL}</p>
                  <p className="text-[10px] text-white/35">{BGM_SUBTITLE}</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/30 hover:text-white hover:bg-white/8 rounded-lg border-none bg-transparent cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="h-px bg-white/[0.06]" />

        {audioDrawer === AUDIO_DRAWER_VO && (
          <VOQuickAdd
            existingAudio={existingVoiceover}
            onSave={onSaveVoiceover}
            onClose={onClose}
          />
        )}
        {audioDrawer === AUDIO_DRAWER_BGM && (
          <BgmUploader onSave={onSaveBgm} onClose={onClose} />
        )}
      </div>
    </div>
  )
}
