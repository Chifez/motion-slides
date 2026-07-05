import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import type { PlaybackSettings, Slide } from '@motionslides/shared'

interface Props {
  slideIndex: number
  totalSlides: number
  playbackSettings: PlaybackSettings
  autoplayPaused: boolean
  slides: Slide[]
  onPrev: () => void
  onNext: () => void
  onToggleAutoplay: () => void
  onJumpToSlide: (index: number) => void
}

export function PresentationControls({
  slideIndex, totalSlides, playbackSettings,
  autoplayPaused, slides, onPrev, onNext,
  onToggleAutoplay, onJumpToSlide,
}: Props) {
  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 bg-black/75 border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-md min-w-[280px]">
      
      {/* Timeline Step Dots */}
      <div className="flex items-center gap-1.5 justify-center w-full px-2">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => onJumpToSlide(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 border-none cursor-pointer ${
              idx === slideIndex 
                ? 'w-6 bg-blue-500' 
                : 'w-2 bg-white/20 hover:bg-white/50'
            }`}
            title={s.name || `Step ${idx + 1}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between w-full mt-0.5">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={slideIndex === 0}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer border-none bg-transparent"
            title="Previous Step"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-[10px] font-black uppercase tracking-wider text-white/40 min-w-[44px] text-center">
            {slideIndex + 1} / {totalSlides}
          </span>

          <button
            onClick={onNext}
            disabled={slideIndex >= totalSlides - 1 && !playbackSettings.loop}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer border-none bg-transparent"
            title="Next Step"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {playbackSettings.autoplay && (
          <div className="flex items-center gap-2">
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={onToggleAutoplay}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer border-none bg-transparent"
              title={autoplayPaused ? 'Play Autoplay' : 'Pause Autoplay'}
            >
              {autoplayPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
