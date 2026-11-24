import { useEffect } from 'react'
import { X, Mic, Music } from 'lucide-react'
import type { SlideAudio } from '@motionslides/shared'
import type { AudioDrawer } from './types'
import { VOQuickAdd } from './vo-quick-add'
import { BgmUploader } from './bgm-uploader'
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
  slideScript?: string
  onSaveVoiceover: (audio: SlideAudio) => void
  onSaveBgm: (audio: SlideAudio) => void
  onClose: () => void
}

/**
 * Dismissible modal overlay for adding or replacing slide voiceovers and background music.
 */
export function AudioDrawerModal({
  audioDrawer,
  liveSlideIndex,
  existingVoiceover,
  slideScript,
  onSaveVoiceover,
  onSaveBgm,
  onClose,
}: Props) {
  useEffect(() => {
    if (!audioDrawer) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [audioDrawer, onClose])

  if (!audioDrawer) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-(--z-overlay) bg-black/25 dark:bg-black/50 backdrop-blur-[1px] flex items-end justify-center sm:items-center sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={audioDrawer === AUDIO_DRAWER_VO ? VO_ADD_LABEL : BGM_LABEL}
        className="rounded-t-2xl sm:rounded-xl w-full sm:w-[400px] flex flex-col overflow-hidden border shadow-2xl"
        style={{
          maxHeight: '75vh',
          backgroundColor: 'var(--ms-bg-elevated)',
          borderColor: 'var(--ms-tl-border-strong)',
          boxShadow: 'var(--ms-shadow)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--ms-tl-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--ms-bg-surface)',
                borderColor: 'var(--ms-tl-border-strong)',
              }}
            >
              {audioDrawer === AUDIO_DRAWER_VO ? (
                <Mic size={13} style={{ color: 'var(--ms-tl-vo-accent)' }} />
              ) : (
                <Music size={13} style={{ color: 'var(--ms-tl-bgm-accent)' }} />
              )}
            </div>
            <div>
              <p className="text-[12px] font-semibold text-(--ms-text-primary) m-0">
                {audioDrawer === AUDIO_DRAWER_VO ? VO_ADD_LABEL : BGM_LABEL}
              </p>
              <p className="text-[10px] text-(--ms-text-muted) m-0">
                {audioDrawer === AUDIO_DRAWER_VO
                  ? `Slide ${liveSlideIndex + 1}`
                  : BGM_SUBTITLE}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer transition-[background-color,color,transform] duration-150 active:scale-[0.94]"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 overflow-y-auto">
          {audioDrawer === AUDIO_DRAWER_VO ? (
            <VOQuickAdd
              existingAudio={existingVoiceover}
              slideScript={slideScript || ''}
              onSave={onSaveVoiceover}
              onClose={onClose}
            />
          ) : (
            <BgmUploader onSave={onSaveBgm} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  )
}
