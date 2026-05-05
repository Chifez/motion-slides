import { useState, memo } from 'react'
import { Sparkles, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditorStore } from '@/store/editorStore'
import { LayerList } from './LayerList'

interface SlideThumbProps {
  slideId: string
  index: number
  isActive: boolean
  totalSlides: number
}

export const SlideThumb = memo(function SlideThumb({ slideId, index, isActive, totalSlides }: SlideThumbProps) {
  const [isEditing, setIsEditing] = useState(false)
  
  // Granular slide data selection
  const slide = useEditorStore(s => {
    const p = s.projects.find(p => p.id === s.activeProjectId)
    return p?.slides.find(sl => sl.id === slideId)
  })

  const { updateSlide, setActiveSlide, duplicateSlide, deleteSlide } = useEditorStore()

  if (!slide) return null

  const { name, background, elements } = slide
  const slideName = name || `Slide ${index + 1}`

  const onSelect = () => setActiveSlide(index)
  const onDuplicate = () => duplicateSlide(index)
  const onDelete = () => deleteSlide(index)

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveSlide(index)
    setIsEditing(true)
  }

  const handleNameChange = (newName: string) => {
    setIsEditing(false)
    setActiveSlide(index)
    // Removed setTimeout hack - store updates should be synchronous and safe here as it's an event handler
    updateSlide({ name: newName || `Slide ${index + 1}` })
  }

  return (
    <motion.div
      layout
      initial={false}
      transition={{ duration: 0.2, ease: 'circOut' }}
      className={`relative shrink-0 rounded-xl overflow-hidden cursor-pointer border-2 transition-all group shadow-lg ${isActive ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-(--ms-border) hover:border-(--ms-border-strong) bg-(--ms-bg-base)'
        }`}
      onClick={onSelect}
    >
      {/* Thumbnail body */}
      <div
        className="aspect-video shrink-0 flex items-center justify-center relative bg-[#0a0a0a]"
        style={{ background }}
      >
        <span className="text-[10px] text-(--ms-text-muted) font-medium opacity-40 group-hover:opacity-100 transition-opacity">
          {elements.length > 0 ? `${elements.length} layer${elements.length > 1 ? 's' : ''}` : 'Empty'}
        </span>

        {/* Index badge */}
        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-md border border-white/10">
          <span className="text-[10px] text-white/70 font-bold leading-none">{index + 1}</span>
        </div>

        {/* Action buttons on hover */}
        {isActive && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onDuplicate}
              title="Duplicate (Magic Move)"
              className="p-1 rounded-md bg-purple-500/20 backdrop-blur-md border border-purple-500/30 text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              <Sparkles size={11} />
            </button>
            {totalSlides > 1 && (
              <button onClick={onDelete} className="p-1 rounded-md bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer">
                <Trash2 size={11} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Slide name label */}
      <div className={`px-2 py-1.5 ${isActive ? 'bg-blue-500/5' : 'bg-transparent'} transition-colors`} onDoubleClick={handleDoubleClick}>
        {isEditing ? (
          <input
            autoFocus
            defaultValue={name}
            onBlur={(e) => handleNameChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNameChange((e.target as HTMLInputElement).value) }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-neutral-800 rounded px-1 py-0.5 text-[10px] text-white font-medium outline-none border border-blue-500/50"
          />
        ) : (
          <span className={`text-[10px] font-medium block truncate ${isActive ? 'text-(--ms-text-primary)' : 'text-(--ms-text-muted)'}`}>
            {slideName}
          </span>
        )}
      </div>

      <LayerList elements={elements} isActive={isActive} />
    </motion.div>
  )
})
