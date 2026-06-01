import { Layers, Mic, Music, Plus } from 'lucide-react'
import { RULER_H, SLIDE_TRACK_H, VO_TRACK_H, BGM_TRACK_H, AUDIO_DRAWER_VO, AUDIO_DRAWER_BGM } from './constants'
import type { AudioDrawer } from './types'

interface Props {
  audioDrawer: AudioDrawer
  setAudioDrawer: (drawer: AudioDrawer) => void
  liveSlideIndex: number
}

export function TrackLabelColumn({ audioDrawer, setAudioDrawer, liveSlideIndex }: Props) {
  return (
    <div className="w-[88px] shrink-0 bg-[#0d0d10] border-r border-white/[0.06] flex flex-col z-10 relative">
      <div className="border-b border-white/[0.06]" style={{ height: RULER_H }} />

      <div
        className="border-b border-white/[0.06] flex flex-col items-center justify-center gap-1 text-white/30"
        style={{ height: SLIDE_TRACK_H }}
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
          <Layers size={14} className="text-indigo-400" />
        </div>
        <span className="text-[9px] font-bold tracking-wider uppercase text-white/30">Slides</span>
      </div>

      <div
        className="border-b border-white/[0.06] flex flex-col items-center justify-center gap-1 relative group/vo"
        style={{ height: VO_TRACK_H }}
      >
        <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
          <Mic size={12} className="text-violet-400" />
        </div>
        <span className="text-[9px] font-bold tracking-wider uppercase text-white/30">V.O.</span>
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
        <span className="text-[9px] font-bold tracking-wider uppercase text-white/30">Music</span>
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
