import { Link } from '@tanstack/react-router'
import { Play, Pause, ChevronRight, ChevronLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

interface EmbedFooterProps {
  theme: 'dark' | 'light'
  isAutoplay: boolean
  autoplayPaused: boolean
  onToggleAutoplay: () => void
  onPrev: () => void
  onNext: () => void
  activeSlideIndex: number
  totalSlides: number
  isLoop: boolean
}

export function EmbedFooter({
  theme,
  isAutoplay,
  autoplayPaused,
  onToggleAutoplay,
  onPrev,
  onNext,
  activeSlideIndex,
  totalSlides,
  isLoop
}: EmbedFooterProps) {
  const embedThemeClass = theme === 'light' 
    ? 'bg-zinc-50 border-zinc-200 text-zinc-800' 
    : 'bg-[#09090b] border-zinc-900 text-zinc-200'

  return (
    <div
      className={`w-full h-[44px] border-t backdrop-blur-md flex items-center justify-between px-4 z-50 transition-colors flex-shrink-0 ${embedThemeClass}`}
    >
      {/* Controls buttons */}
      <div className="flex items-center gap-2">
        {isAutoplay && (
          <button
            onClick={onToggleAutoplay}
            className={`p-1.5 rounded-lg border-none bg-transparent cursor-pointer transition-colors ${
              theme === 'light' 
                ? 'hover:bg-zinc-200/50 text-zinc-600 hover:text-zinc-900' 
                : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white'
            }`}
            title={autoplayPaused ? 'Play autoplay' : 'Pause autoplay'}
          >
            {autoplayPaused ? <Play size={15} /> : <Pause size={15} />}
          </button>
        )}

        <button
          onClick={onPrev}
          disabled={activeSlideIndex === 0}
          className={`p-1.5 rounded-lg border-none bg-transparent cursor-pointer transition-colors ${
            activeSlideIndex === 0 
              ? 'opacity-30 cursor-not-allowed' 
              : theme === 'light' 
                ? 'hover:bg-zinc-200/50 text-zinc-600 hover:text-zinc-900' 
                : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white'
          }`}
        >
          <ChevronLeft size={15} />
        </button>

        <span className={`text-[10px] font-bold min-w-8 text-center select-none ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
          {activeSlideIndex + 1} / {totalSlides}
        </span>

        <button
          onClick={onNext}
          disabled={!isLoop && activeSlideIndex === totalSlides - 1}
          className={`p-1.5 rounded-lg border-none bg-transparent cursor-pointer transition-colors ${
            !isLoop && activeSlideIndex === totalSlides - 1 
              ? 'opacity-30 cursor-not-allowed' 
              : theme === 'light' 
                ? 'hover:bg-zinc-200/50 text-zinc-600 hover:text-zinc-900' 
                : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white'
          }`}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Branding Logo */}
      <Link
        to="/"
        target="_blank"
        className="flex items-center gap-1.5 no-underline opacity-80 hover:opacity-100 transition-opacity"
      >
        <Logo size={18} />
        <span className={`text-[9px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
          MotionSlides
        </span>
      </Link>
    </div>
  )
}
