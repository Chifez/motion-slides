import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import type { PlaybackSettings } from '@motionslides/shared'

interface Props {
  slideIndex: number
  totalSlides: number
  playbackSettings: PlaybackSettings
  autoplayPaused: boolean
  onPrev: () => void
  onNext: () => void
  onToggleAutoplay: () => void
}

export function PresentationControls({
  slideIndex, totalSlides, playbackSettings,
  autoplayPaused, onPrev, onNext, onToggleAutoplay,
}: Props) {
  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 border border-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
      <button
        onClick={onPrev}
        disabled={slideIndex === 0}
        className="p-1 rounded-full text-white/60 hover:text-white disabled:opacity-30 transition-colors cursor-pointer border-none bg-transparent"
      >
        <ChevronLeft size={18} />
      </button>

      <span className="text-sm text-white/70 min-w-[50px] text-center">
        {slideIndex + 1} / {totalSlides}
      </span>

      <button
        onClick={onNext}
        disabled={slideIndex >= totalSlides - 1 && !playbackSettings.loop}
        className="p-1 rounded-full text-white/60 hover:text-white disabled:opacity-30 transition-colors cursor-pointer border-none bg-transparent"
      >
        <ChevronRight size={18} />
      </button>

      {playbackSettings.autoplay && (
        <>
          <div className="w-px h-4 bg-white/20" />
          <button
            onClick={onToggleAutoplay}
            className="p-1 rounded-full text-white/60 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
          >
            {autoplayPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </>
      )}
    </div>
  )
}
