export const PX_PER_SEC = 80

export const WAVE_PATTERN = [3, 7, 12, 18, 14, 9, 20, 15, 6, 22, 17, 10, 25, 19, 8, 23, 14, 11, 18, 6, 21, 13, 7, 24, 16]

export const SLIDE_GRADIENTS = [
  'from-violet-900/80 to-indigo-900/80',
  'from-blue-900/80 to-cyan-900/80',
  'from-emerald-900/80 to-teal-900/80',
  'from-rose-900/80 to-pink-900/80',
  'from-amber-900/80 to-orange-900/80',
  'from-purple-900/80 to-fuchsia-900/80',
]

export const RULER_H = 32
export const SLIDE_TRACK_H = 80
export const CAPTION_TRACK_H = 52
export const VO_TRACK_H = 52
export const BGM_TRACK_H = 52

export function formatTime(time: number): string {
  const mins = Math.floor(time / 60)
  const secs = Math.floor(time % 60)
  const ms = Math.floor((time % 1) * 10)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`
}

export const AUDIO_TYPE_BGM = 'bgm' as const
export const AUDIO_TYPE_VOICEOVER = 'voiceover' as const
export const AUDIO_DRAWER_VO = 'vo' as const
export const AUDIO_DRAWER_BGM = 'bgm' as const

export const BGM_LABEL = 'Background Music'
export const VO_LABEL_PREFIX = 'Voiceover – Slide'
export const VO_ADD_LABEL = 'Add Voiceover'
export const BGM_SUBTITLE = 'Plays across all slides'

export const BGM_ACCENT_COLOR = '#38bdf8'
export const VO_ACCENT_COLOR = '#a78bfa'

