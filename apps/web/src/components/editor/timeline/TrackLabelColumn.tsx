import { Layers, Mic, Music, Plus, Type } from 'lucide-react'
import { RULER_H, SLIDE_TRACK_H, CAPTION_TRACK_H, VO_TRACK_H, BGM_TRACK_H, AUDIO_DRAWER_VO, AUDIO_DRAWER_BGM } from './constants'
import type { AudioDrawer } from './types'

interface Props {
  audioDrawer: AudioDrawer
  setAudioDrawer: (drawer: AudioDrawer) => void
  liveSlideIndex: number
  onAddCaption: () => void
}

export function TrackLabelColumn({ audioDrawer, setAudioDrawer, liveSlideIndex, onAddCaption }: Props) {
  return (
    <div
      className="w-[88px] shrink-0 border-r flex flex-col z-10 relative"
      style={{ backgroundColor: 'var(--ms-tl-surface)', borderColor: 'var(--ms-tl-border)' }}
    >
      <div className="border-b" style={{ height: RULER_H, borderColor: 'var(--ms-tl-border)' }} />

      <div
        className="border-b flex flex-col items-center justify-center gap-1"
        style={{ height: SLIDE_TRACK_H, borderColor: 'var(--ms-tl-border)', color: 'var(--ms-tl-text-muted)' }}
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
          <Layers size={14} className="text-indigo-400" />
        </div>
        <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: 'var(--ms-tl-text-muted)' }}>Slides</span>
      </div>

      <div
        className="border-b flex flex-col items-center justify-center gap-1 relative group/captions"
        style={{ height: CAPTION_TRACK_H, borderColor: 'var(--ms-tl-border)' }}
      >
        <div className="w-7 h-7 rounded-lg bg-pink-600/20 border border-pink-500/30 flex items-center justify-center">
          <Type size={12} className="text-pink-400" />
        </div>
        <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: 'var(--ms-tl-text-muted)' }}>Captions</span>
        <button
          onClick={onAddCaption}
          title="Add caption block at playhead"
          className="absolute top-1 right-1 w-4 h-4 rounded flex items-center justify-center border cursor-pointer transition-all bg-transparent border-white/15 text-white/30 hover:text-pink-300 hover:border-pink-500 opacity-0 group-hover/captions:opacity-100"
        >
          <Plus size={9} />
        </button>
      </div>

      <div
        className="border-b flex flex-col items-center justify-center gap-1 relative group/vo"
        style={{ height: VO_TRACK_H, borderColor: 'var(--ms-tl-border)' }}
      >
        <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
          <Mic size={12} className="text-violet-400" />
        </div>
        <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: 'var(--ms-tl-text-muted)' }}>V.O.</span>
        <button
          onClick={() => setAudioDrawer(audioDrawer === AUDIO_DRAWER_VO ? null : AUDIO_DRAWER_VO)}
          title={`Add voiceover to slide ${liveSlideIndex + 1}`}
          className={`absolute top-1 right-1 w-4 h-4 rounded flex items-center justify-center border cursor-pointer transition-all ${
            audioDrawer === AUDIO_DRAWER_VO
              ? 'bg-violet-500 border-violet-400 text-white'
              : 'bg-transparent border-white/15 text-white/30 hover:text-violet-300 hover:border-violet-500 opacity-0 group-hover/vo:opacity-100'
          }`}
        >
          <Plus size={9} />
        </button>
      </div>

      <div
        className="flex flex-col items-center justify-center gap-1 relative group/bgm"
        style={{ height: BGM_TRACK_H }}
      >
        <div className="w-7 h-7 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center">
          <Music size={12} className="text-sky-400" />
        </div>
        <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: 'var(--ms-tl-text-muted)' }}>Music</span>
        <button
          onClick={() => setAudioDrawer(audioDrawer === AUDIO_DRAWER_BGM ? null : AUDIO_DRAWER_BGM)}
          title="Add background music"
          className={`absolute top-1 right-1 w-4 h-4 rounded flex items-center justify-center border cursor-pointer transition-all ${
            audioDrawer === AUDIO_DRAWER_BGM
              ? 'bg-sky-500 border-sky-400 text-white'
              : 'bg-transparent border-white/15 text-white/30 hover:text-sky-300 hover:border-sky-500 opacity-0 group-hover/bgm:opacity-100'
          }`}
        >
          <Plus size={9} />
        </button>
      </div>
    </div>
  )
}
