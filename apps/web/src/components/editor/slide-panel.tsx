import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { UI_SPRING } from '@/lib/motion-engine'
import { Panel } from '@/components/ui/core/panel'
import { Button } from '@/components/ui/core/button'
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
import { useIsMobile } from '@/hooks/use-media-query'
import { useEditorStore } from '@/store/editor-store'
import { SlideThumb } from './slide-panel/slide-thumb'
import { usePermissions } from '@/context/permission-context'

export function SlidePanel() {
  const { isReadOnly } = usePermissions()
  const slides            = useEditorStore(s => s.activeProject()?.slides || [])
  const activeSlideIndex  = useEditorStore(s => s.activeSlideIndex)
  const mobileSlidesOpen  = useEditorStore(s => s.mobileSlidesOpen)
  const addSlide          = useEditorStore(s => s.addSlide)
  const reorderSlides     = useEditorStore(s => s.reorderSlides)
  const setMobileSlidesOpen = useEditorStore(s => s.setMobileSlidesOpen)
  const isMobile          = useIsMobile()
  const totalSlides       = slides.length

  const [activeDragId, setActiveDragId] = useState<string | null>(null)
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
    if (isReadOnly) return
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
    <div className={`h-full flex flex-col bg-(--ms-bg-surface) transition-colors ${!isMobile ? 'border-r border-(--ms-border)' : ''}`}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-(--ms-border) sticky top-0 bg-(--ms-bg-surface) z-10 transition-colors">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-(--ms-text-muted)">Slides & Layers</span>
        <div className="flex items-center gap-1">
          {!isReadOnly && (
            <button
              onClick={addSlide}
              className="p-1 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition-colors cursor-pointer border-none bg-transparent"
            >
              <Plus size={14} />
            </button>
          )}
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
        <Button
          variant="outline"
          onClick={addSlide}
          className="w-full h-8"
        >
          <Plus size={13} className="mr-1.5" /> Add Slide
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Panel.Root open={mobileSlidesOpen} onOpenChange={setMobileSlidesOpen} side="left">
        <Panel.Portal>
          <Panel.Overlay />
          <Panel.Content width="w-[280px]">
            {panelContent}
          </Panel.Content>
        </Panel.Portal>
      </Panel.Root>
    )
  }

  return (
    <aside id="tour-slide-panel" className="w-[220px] shrink-0 flex flex-col bg-(--ms-bg-surface) overflow-hidden transition-colors relative z-10">
      {panelContent}
    </aside>
  )
}
