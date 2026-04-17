import { Plus, Copy, Trash2 } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'

export function SlidePanel() {
  const { activeProject, activeSlideIndex, setActiveSlide, addSlide, duplicateSlide, deleteSlide } = useEditorStore()
  const project = activeProject()
  if (!project) return null
  const { slides } = project

  return (
    <aside className="w-[220px] shrink-0 flex flex-col bg-[#161616] border-r border-white/8 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/6">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600">Slides</span>
        <button
          onClick={addSlide}
          className="p-1 rounded-md text-neutral-600 hover:text-neutral-100 hover:bg-white/6 transition-colors cursor-pointer border-none bg-transparent"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Slide list */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            onClick={() => setActiveSlide(i)}
            className={`relative rounded-md overflow-hidden cursor-pointer border-2 transition-all aspect-video bg-[#111] flex items-center justify-center group ${
              activeSlideIndex === i ? 'border-blue-500' : 'border-transparent hover:border-white/12'
            }`}
          >
            <span className="absolute top-1 left-1.5 text-[9px] text-neutral-700 font-semibold">{i + 1}</span>
            <span className="text-[9px] text-neutral-700">
              {slide.elements.length > 0 ? `${slide.elements.length} element${slide.elements.length > 1 ? 's' : ''}` : 'Empty'}
            </span>

            {activeSlideIndex === i && (
              <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => duplicateSlide(i)} className="p-0.5 rounded text-neutral-500 hover:text-neutral-100 hover:bg-white/10 cursor-pointer border-none bg-transparent">
                  <Copy size={9} />
                </button>
                {slides.length > 1 && (
                  <button onClick={() => deleteSlide(i)} className="p-0.5 rounded text-red-600 hover:text-red-400 hover:bg-red-500/10 cursor-pointer border-none bg-transparent">
                    <Trash2 size={9} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-white/6">
        <button
          onClick={addSlide}
          className="w-full flex items-center justify-center gap-1.5 bg-white/4 hover:bg-white/8 border border-white/8 text-neutral-500 hover:text-neutral-200 text-xs font-medium py-1.5 rounded-md transition-all cursor-pointer"
        >
          <Plus size={13} /> Add Slide
        </button>
      </div>
    </aside>
  )
}
