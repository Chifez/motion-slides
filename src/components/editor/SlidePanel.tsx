import { useState } from 'react'
import { Plus, Copy, Trash2, Sparkles } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'

export function SlidePanel() {
  const {
    activeProject, activeSlideIndex, setActiveSlide,
    addSlide, duplicateSlide, duplicateSlideKeepIds, deleteSlide,
  } = useEditorStore()
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
          <SlideThumb
            key={slide.id}
            index={i}
            name={slide.name || `Slide ${i + 1}`}
            background={slide.background}
            elementCount={slide.elements.length}
            isActive={activeSlideIndex === i}
            totalSlides={slides.length}
            onSelect={() => setActiveSlide(i)}
            onDuplicate={() => duplicateSlide(i)}
            onDuplicateKeepIds={() => duplicateSlideKeepIds(i)}
            onDelete={() => deleteSlide(i)}
          />
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

interface SlideThumbProps {
  index: number
  name: string
  background: string
  elementCount: number
  isActive: boolean
  totalSlides: number
  onSelect: () => void
  onDuplicate: () => void
  onDuplicateKeepIds: () => void
  onDelete: () => void
}

function SlideThumb({ index, name, background, elementCount, isActive, totalSlides, onSelect, onDuplicate, onDuplicateKeepIds, onDelete }: SlideThumbProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { updateSlide, setActiveSlide } = useEditorStore()

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveSlide(index)
    setIsEditing(true)
  }

  const handleNameChange = (newName: string) => {
    setIsEditing(false)
    setActiveSlide(index)
    setTimeout(() => updateSlide({ name: newName || `Slide ${index + 1}` }), 0)
  }

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-md overflow-hidden cursor-pointer border-2 transition-all group ${
        isActive ? 'border-blue-500' : 'border-transparent hover:border-white/12'
      }`}
    >
      {/* Thumbnail body */}
      <div
        className="aspect-video flex items-center justify-center"
        style={{ background }}
      >
        <span className="text-[9px] text-neutral-700">
          {elementCount > 0 ? `${elementCount} element${elementCount > 1 ? 's' : ''}` : 'Empty'}
        </span>
      </div>

      {/* Slide name label */}
      <div className="px-1.5 py-1 bg-[#1a1a1a]" onDoubleClick={handleDoubleClick}>
        {isEditing ? (
          <input
            autoFocus
            defaultValue={name}
            onBlur={(e) => handleNameChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNameChange((e.target as HTMLInputElement).value) }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-[9px] text-neutral-300 font-medium border-none outline-none px-0"
          />
        ) : (
          <span className="text-[9px] text-neutral-500 font-medium block truncate">{name}</span>
        )}
      </div>

      {/* Index badge */}
      <span className="absolute top-1 left-1.5 text-[9px] text-neutral-700/60 font-semibold">{index + 1}</span>

      {/* Action buttons on hover */}
      {isActive && (
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {/* Regular duplicate — new IDs, no Magic Move */}
          <button
            onClick={onDuplicate}
            title="Duplicate slide (new elements)"
            className="p-0.5 rounded text-neutral-500 hover:text-neutral-100 hover:bg-white/10 cursor-pointer border-none bg-transparent"
          >
            <Copy size={9} />
          </button>
          {/* Magic Move duplicate — same IDs, morphing enabled */}
          <button
            onClick={onDuplicateKeepIds}
            title="Duplicate for Magic Move (elements will morph)"
            className="p-0.5 rounded text-purple-500 hover:text-purple-300 hover:bg-purple-500/10 cursor-pointer border-none bg-transparent"
          >
            <Sparkles size={9} />
          </button>
          {totalSlides > 1 && (
            <button onClick={onDelete} className="p-0.5 rounded text-red-600 hover:text-red-400 hover:bg-red-500/10 cursor-pointer border-none bg-transparent">
              <Trash2 size={9} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
