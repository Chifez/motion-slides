import { useState } from 'react'
import { Plus, Copy, Trash2, Sparkles, Type, Code2, Square, Minus, ChevronDown, ChevronRight, Lock, Unlock, BarChart3, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useEditorStore } from '@/store/editorStore'
import type { SceneElement } from '@/types'

export function SlidePanel() {
  const {
    activeProject, activeSlideIndex, setActiveSlide,
    addSlide, duplicateSlide, duplicateSlideKeepIds, deleteSlide,
    mobileSlidesOpen, setMobileSlidesOpen
  } = useEditorStore()
  const isMobile = useIsMobile()
  const project = activeProject()
  if (!project) return null
  const { slides } = project

  const panelContent = (
    <div className={`h-full flex flex-col bg-[#161616] ${isMobile ? 'rounded-r-2xl shadow-2xl' : 'border-r border-white/8'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/6 sticky top-0 bg-[#161616] z-10">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600">Slides & Layers</span>
        <div className="flex items-center gap-1">
          <button
            onClick={addSlide}
            className="p-1 rounded-md text-neutral-600 hover:text-neutral-100 hover:bg-white/6 transition-colors cursor-pointer border-none bg-transparent"
          >
            <Plus size={14} />
          </button>
          {isMobile && (
            <button
              onClick={() => setMobileSlidesOpen(false)}
              className="p-1 rounded-md text-neutral-500 hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Slide list */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 custom-scrollbar pb-10 md:pb-0">
        {slides.map((slide, i) => (
          <SlideThumb
            key={slide.id}
            index={i}
            name={slide.name || `Slide ${i + 1}`}
            background={slide.background}
            elements={slide.elements}
            isActive={activeSlideIndex === i}
            totalSlides={slides.length}
            onSelect={() => {
              setActiveSlide(i)
            }}
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
              className="fixed top-0 bottom-0 left-0 w-[280px] z-101 overflow-hidden"
            >
              {panelContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    )
  }

  return (
    <aside className="w-[220px] shrink-0 flex flex-col bg-[#161616] overflow-hidden">
      {panelContent}
    </aside>
  )
}

// ─────────────────────────────────────────────
// Element type icon
// ─────────────────────────────────────────────

function ElementIcon({ type }: { type: SceneElement['type'] }) {
  const cls = 'shrink-0'
  switch (type) {
    case 'text': return <Type size={9} className={cls} />
    case 'code': return <Code2 size={9} className={cls} />
    case 'shape': return <Square size={9} className={cls} />
    case 'line': return <Minus size={9} className={cls} />
    case 'chart': return <BarChart3 size={9} className={cls} />
    default: return <Square size={9} className={cls} />
  }
}

function elementLabel(el: SceneElement): string {
  switch (el.type) {
    case 'text': {
      const v = (el.content as { value: string }).value?.trim()
      return v ? (v.length > 18 ? v.slice(0, 18) + '…' : v) : 'Text'
    }
    case 'code': return (el.content as { language: string }).language || 'Code'
    case 'shape': return (el.content as { shapeType: string }).shapeType || 'Shape'
    case 'line': return 'Line'
    default: return el.type
  }
}

// ─────────────────────────────────────────────
// Element list row (Figma-style)
// ─────────────────────────────────────────────

function ElementRow({ element }: { element: SceneElement }) {
  const {
    selectedElementId, setSelectedElement, toggleElementLock, deleteElement,
    setMobileInspectorOpen, setMobileSlidesOpen
  } = useEditorStore()
  const isMobile = useIsMobile()
  const isSelected = selectedElementId === element.id
  const isLocked = element.locked

  return (
    <div className="group/row relative">
      <div
        onClick={(e) => {
          e.stopPropagation()
          setSelectedElement(element.id)
          if (isMobile) {
            setMobileInspectorOpen(true)
            setMobileSlidesOpen(false)
          }
        }}
        className={`w-full flex items-center gap-1.5 px-2 py-[3px] rounded text-left cursor-pointer transition-colors ${isSelected
          ? 'bg-blue-500/20 text-blue-300'
          : 'bg-transparent text-neutral-500 hover:bg-white/5 hover:text-neutral-300'
          }`}
      >
        <ElementIcon type={element.type} />
        <span className="text-[9px] font-medium truncate flex-1">{elementLabel(element)}</span>

        {/* Lock indicator (visible if locked OR on hover) */}
        {(isLocked || isSelected) && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleElementLock(element.id) }}
            className={`p-0.5 rounded transition-colors ${isLocked ? 'text-blue-400' : 'text-neutral-600 opacity-0 group-hover/row:opacity-100 hover:text-neutral-300'} border-none bg-transparent cursor-pointer`}
          >
            {isLocked ? <Lock size={8} /> : <Unlock size={8} />}
          </button>
        )}

        {/* Delete button (only on hover) */}
        <button
          onClick={(e) => { e.stopPropagation(); deleteElement(element.id) }}
          className="p-0.5 rounded text-neutral-600 opacity-0 group-hover/row:opacity-100 hover:text-red-400 border-none bg-transparent cursor-pointer"
        >
          <Trash2 size={8} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Slide thumbnail
// ─────────────────────────────────────────────

interface SlideThumbProps {
  index: number
  name: string
  background: string
  elements: SceneElement[]
  isActive: boolean
  totalSlides: number
  onSelect: () => void
  onDuplicate: () => void
  onDuplicateKeepIds: () => void
  onDelete: () => void
}

function SlideThumb({ index, name, background, elements, isActive, totalSlides, onSelect, onDuplicate, onDuplicateKeepIds, onDelete }: SlideThumbProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [layersOpen, setLayersOpen] = useState(true)
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
      className={`relative rounded-md overflow-hidden cursor-pointer border-2 transition-all group ${isActive ? 'border-blue-500' : 'border-transparent hover:border-white/12'
        }`}
    >
      {/* Thumbnail body */}
      <div
        className="aspect-video flex items-center justify-center"
        style={{ background }}
      >
        <span className="text-[9px] text-neutral-700">
          {elements.length > 0 ? `${elements.length} element${elements.length > 1 ? 's' : ''}` : 'Empty'}
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

      {/* ── Figma-style element layer list (active slide only) ── */}
      {isActive && elements.length > 0 && (
        <div className="bg-[#131313] border-t border-white/5" onClick={(e) => e.stopPropagation()}>
          {/* Collapsible header */}
          <button
            onClick={() => setLayersOpen((o) => !o)}
            className="w-full flex items-center gap-1 px-2 py-1 text-[9px] text-neutral-600 hover:text-neutral-400 uppercase tracking-wider cursor-pointer border-none bg-transparent transition-colors"
          >
            {layersOpen
              ? <ChevronDown size={9} />
              : <ChevronRight size={9} />
            }
            Layers
          </button>

          {/* Element rows — reversed so top-z-index is first (Figma convention) */}
          {layersOpen && (
            <div className="pb-1 px-1 flex flex-col gap-px max-h-[160px] overflow-y-auto custom-scrollbar">
              {[...elements].reverse().map((el) => (
                <ElementRow key={el.id} element={el} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
