import { useAccessControl } from '@/hooks/useAccessControl'
import { useEditorStore } from '@/store/editorStore'
import { Play, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  startPresentation: (options?: { autoplay?: boolean }) => void
}

/**
 * ViewerOverlay — Shown only in 'view' mode.
 * Provides a professional "Player" interface with an Autoplay toggle.
 */
export function ViewerOverlay({ startPresentation }: Props) {
  const { mode } = useAccessControl()
  const { activeProject, activeSlideIndex, setActiveSlide } = useEditorStore()
  const project = activeProject()

  if (mode !== 'view' || !project) return null

  const totalSlides = project.slides.length
  const currentSlideNumber = activeSlideIndex + 1

  const nextSlide = () => {
    if (activeSlideIndex < totalSlides - 1) {
      setActiveSlide(activeSlideIndex + 1)
    }
  }

  const prevSlide = () => {
    if (activeSlideIndex > 0) {
      setActiveSlide(activeSlideIndex - 1)
    }
  }

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-(--z-overlay) flex items-center gap-4 bg-black/60 backdrop-blur-2xl border border-white/10 p-1.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button
        onClick={() => startPresentation({ autoplay: true })}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-6 py-2 rounded-full transition-all shadow-lg shadow-blue-600/30 active:scale-95 group"
      >
        <Play size={14} className="group-hover:scale-110 transition-transform" fill="currentColor" />
        Watch Presentation
      </button>

      <div className="w-px h-6 bg-white/10 mx-1" />

      <div className="flex items-center gap-1 pr-2">
        <button
          onClick={prevSlide}
          disabled={activeSlideIndex === 0}
          className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          title="Previous Slide"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center justify-center min-w-[80px] text-[10px] font-bold tracking-widest text-white/40 uppercase">
          Slide {currentSlideNumber} <span className="mx-1.5 text-white/10">/</span> {totalSlides}
        </div>

        <button
          onClick={nextSlide}
          disabled={activeSlideIndex === totalSlides - 1}
          className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          title="Next Slide"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
