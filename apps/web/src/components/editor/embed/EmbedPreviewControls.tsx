import { Logo } from '@/components/ui/Logo'

interface EmbedPreviewControlsProps {
  totalSlides: number
  activeSlideIndex: number
  showControls: boolean
  theme: 'dark' | 'light'
  onSelectSlide: (idx: number) => void
}

export function EmbedPreviewControls({
  totalSlides,
  activeSlideIndex,
  showControls,
  theme,
  onSelectSlide
}: EmbedPreviewControlsProps) {
  return (
    <>
      {/* Logo overlay on top right of the canvas for preview */}
      <div className="absolute top-4 right-4 z-50 pointer-events-none opacity-60">
        <Logo size={16} />
      </div>

      {/* Dot controls overlay on bottom of the canvas for preview */}
      {showControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-50">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSlide(idx)}
              className={`w-1.5 h-1.5 rounded-full p-0 border-none cursor-pointer transition-all ${
                idx === activeSlideIndex 
                  ? 'bg-blue-600 scale-125' 
                  : theme === 'light' ? 'bg-zinc-400/80 hover:bg-zinc-600' : 'bg-zinc-600/80 hover:bg-zinc-400'
              }`}
              title={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </>
  )
}
