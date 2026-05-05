import { memo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'

/**
 * 🧭 SlideNavigation — Bottom navigation bar
 */
export const SlideNavigation = memo(function SlideNavigation() {
  const activeSlideIndex = useEditorStore(s => s.activeSlideIndex)
  const totalSlides = useEditorStore(s => s.activeProject()?.slides.length ?? 0)
  const setActiveSlide = useEditorStore(s => s.setActiveSlide)

  if (totalSlides === 0) return null

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-(--ms-bg-surface)/90 border border-(--ms-border) rounded-full px-3 py-1.5 backdrop-blur-md z-40">
      <button
        onClick={() => setActiveSlide(activeSlideIndex - 1)}
        disabled={activeSlideIndex === 0}
        className="p-1 rounded-full text-(--ms-text-muted) hover:text-(--ms-text-primary) disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer border-none bg-transparent"
      >
        <ChevronLeft size={16} />
      </button>
      
      <span className="text-xs text-(--ms-text-muted) min-w-[48px] text-center font-medium">
        {activeSlideIndex + 1} / {totalSlides}
      </span>
      
      <button
        onClick={() => setActiveSlide(activeSlideIndex + 1)}
        disabled={activeSlideIndex >= totalSlides - 1}
        className="p-1 rounded-full text-(--ms-text-muted) hover:text-(--ms-text-primary) disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer border-none bg-transparent"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
})
