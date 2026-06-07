import { useState, memo } from 'react'
import { Sparkles, Trash2, GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEditorStore } from '@/store/editorStore'
import { LayerList } from './LayerList'

interface SlideThumbProps {
  slideId: string
  index: number
  isActive: boolean
  totalSlides: number
  isDragOverlay?: boolean
}

export const SlideThumb = memo(function SlideThumb({
  slideId,
  index,
  isActive,
  totalSlides,
  isDragOverlay = false,
}: SlideThumbProps) {
  const [isEditing, setIsEditing] = useState(false)

  const slide = useEditorStore(s => {
    const p = s.projects.find(p => p.id === s.activeProjectId)
    return p?.slides.find(sl => sl.id === slideId)
  })
  const { updateSlide, setActiveSlide, duplicateSlide, deleteSlide } = useEditorStore()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slideId })

  const style = isDragOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }

  if (!slide) return null

  const { name, background, elements } = slide
  const slideName = name || `Slide ${index + 1}`

  const onSelect    = () => setActiveSlide(index)
  const onDuplicate = () => duplicateSlide(index)
  const onDelete    = () => deleteSlide(index)

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveSlide(index)
    setIsEditing(true)
  }

  const handleNameChange = (newName: string) => {
    setIsEditing(false)
    setActiveSlide(index)
    updateSlide({ name: newName || `Slide ${index + 1}` })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative shrink-0 rounded-xl overflow-hidden cursor-pointer border-2 transition-all group shadow-lg ${
        isActive ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-(--ms-border) hover:border-(--ms-border-strong) bg-(--ms-bg-base)'
      } ${isDragging ? 'z-50' : ''}`}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-20 p-0.5 rounded text-(--ms-text-muted) opacity-0 group-hover:opacity-70 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        onClick={e => e.stopPropagation()}
        title="Drag to reorder"
      >
        <GripVertical size={12} />
      </div>

      <div
        className="aspect-video shrink-0 flex items-center justify-center relative bg-[#0a0a0a] bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundColor: background.startsWith('url') ? 'transparent' : background,
          backgroundImage: background.startsWith('url') ? background : 'none'
        }}
      >
        <span className="text-[10px] text-(--ms-text-muted) font-medium opacity-40 group-hover:opacity-100 transition-opacity">
          {elements.length > 0 ? `${elements.length} layer${elements.length > 1 ? 's' : ''}` : 'Empty'}
        </span>

        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-md border border-white/10">
          <span className="text-[10px] text-white/70 font-bold leading-none">{index + 1}</span>
        </div>

        {isActive && !isDragOverlay && (
          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
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

      <div className={`px-2 py-1.5 ${isActive ? 'bg-blue-500/5' : 'bg-transparent'} transition-colors`} onDoubleClick={handleDoubleClick}>
        {isEditing ? (
          <input
            autoFocus
            defaultValue={name}
            onBlur={e => handleNameChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleNameChange((e.target as HTMLInputElement).value) }}
            onClick={e => e.stopPropagation()}
            className="w-full bg-(--ms-bg-elevated) rounded px-1 py-0.5 text-[10px] text-(--ms-text-primary) font-medium outline-none border border-blue-500/50"
          />
        ) : (
          <span className={`text-[10px] font-medium block truncate ${isActive ? 'text-(--ms-text-primary)' : 'text-(--ms-text-muted)'}`}>
            {slideName}
          </span>
        )}
      </div>

      <LayerList elements={elements} isActive={isActive} />
    </div>
  )
})
