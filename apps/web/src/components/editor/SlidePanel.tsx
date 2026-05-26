import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useEditorStore } from '@/store/editorStore'
import { SlideThumb } from './slide-panel/SlideThumb'

export function SlidePanel() {
  const slides            = useEditorStore(s => s.activeProject()?.slides || [])
  const activeSlideIndex  = useEditorStore(s => s.activeSlideIndex)
  const mobileSlidesOpen  = useEditorStore(s => s.mobileSlidesOpen)
  const addSlide          = useEditorStore(s => s.addSlide)
  const reorderSlides     = useEditorStore(s => s.reorderSlides)
  const setMobileSlidesOpen = useEditorStore(s => s.setMobileSlidesOpen)
  const isMobile          = useIsMobile()
  const totalSlides       = slides.length

  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  // Desktop: 5px distance to prevent accidental drags on click
  // Mobile: 250ms hold + 5px tolerance to avoid conflicting with scroll
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const fromIndex = slides.findIndex(s => s.id === active.id)
    const toIndex   = slides.findIndex(s => s.id === over.id)
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderSlides(fromIndex, toIndex)
    }
  }

  const slideIds = slides.map(s => s.id)
  const activeDragSlide = activeDragId ? slides.find(s => s.id === activeDragId) : null
  const activeDragIndex = activeDragSlide ? slides.indexOf(activeDragSlide) : -1

  const panelContent = (
    <div className={`h-full flex flex-col bg-(--ms-bg-surface) ${isMobile ? 'rounded-t-2xl shadow-2xl' : 'border-l border-(--ms-border)'} transition-colors`}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-(--ms-border) sticky top-0 bg-(--ms-bg-surface) z-10 transition-colors">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-(--ms-text-muted)">Slides & Layers</span>
        <div className="flex items-center gap-1">
          <button
            onClick={addSlide}
            className="p-1 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition-colors cursor-pointer border-none bg-transparent"
          >
            <Plus size={14} />
          </button>
          {isMobile && (
            <button
              onClick={() => setMobileSlidesOpen(false)}
              className="p-1 rounded-md text-(--ms-text-muted) hover:bg-(--ms-border) transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar pb-10 md:pb-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={slideIds} strategy={verticalListSortingStrategy}>
            {slides.map((s, i) => (
              <SlideThumb
                key={s.id}
                slideId={s.id}
                index={i}
                isActive={activeSlideIndex === i}
                totalSlides={totalSlides}
              />
            ))}
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
            {activeDragSlide && (
              <div className="opacity-90 scale-105 shadow-2xl rounded-lg overflow-hidden pointer-events-none">
                <SlideThumb
                  slideId={activeDragSlide.id}
                  index={activeDragIndex}
                  isActive={false}
                  totalSlides={totalSlides}
                  isDragOverlay
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <div className="p-2 border-t border-(--ms-border)">
        <button
          onClick={addSlide}
          className="w-full flex items-center justify-center gap-1.5 bg-(--ms-bg-base) hover:bg-(--ms-border) border border-(--ms-border) text-(--ms-text-secondary) hover:text-(--ms-text-primary) text-xs font-medium py-1.5 rounded-md transition-all cursor-pointer"
        >
          <Plus size={13} /> Add Slide
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileSlidesOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSlidesOpen(false)}
              className="fixed inset-0 bg-black/60 z-100 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[280px] z-101 flex flex-col overflow-hidden"
            >
              <div className="flex-1 h-full flex flex-col min-h-0">
                {panelContent}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    )
  }

  return (
    <aside id="tour-slide-panel" className="w-[220px] shrink-0 flex flex-col bg-(--ms-bg-surface) overflow-hidden border-r border-(--ms-border) transition-colors">
      {panelContent}
    </aside>
  )
}
