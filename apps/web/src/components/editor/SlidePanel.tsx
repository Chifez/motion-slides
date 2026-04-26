import { useState } from 'react'
import { Plus, Copy, Trash2, Sparkles, Type, Code2, Square, Minus, ChevronDown, ChevronRight, Lock, Unlock, BarChart3, X, Combine, Ungroup } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useEditorStore } from '@/store/editorStore'
import type { SceneElement } from '@motionslides/shared'

export function SlidePanel() {
  const {
    activeProject, activeSlideIndex, setActiveSlide, activeSlide,
    addSlide, duplicateSlide, duplicateSlideKeepIds, deleteSlide,
    mobileSlidesOpen, setMobileSlidesOpen,
    selectedElementIds, groupElements, ungroupElements
  } = useEditorStore()
  const isMobile = useIsMobile()
  const project = activeProject()
  const slide = activeSlide()
  if (!project) return null
  const { slides } = project

  const sectionCls = "px-3 py-3 border-b border-[var(--ms-border)]"

  const panelContent = (
    <div className={`h-full flex flex-col bg-[var(--ms-bg-surface)] ${isMobile ? 'rounded-t-2xl shadow-2xl' : 'border-l border-[var(--ms-border)]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--ms-border)] sticky top-0 bg-[var(--ms-bg-surface)] z-10">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ms-text-muted)]">Slides & Layers</span>
        <div className="flex items-center gap-1">
          {/* Show Group/Ungroup icon if multiple items or a group is selected */}
          {(() => {
            if (selectedElementIds.length > 1) {
              const elements = slide?.elements.filter(e => selectedElementIds.includes(e.id)) || []
              const firstGroupId = elements[0]?.groupId
              const allSameGroup = firstGroupId && elements.every(el => el.groupId === firstGroupId) && elements.length > 1
              
              if (allSameGroup) {
                return (
                  <button onClick={() => ungroupElements(firstGroupId)} className="p-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 transition-colors cursor-pointer border-none bg-transparent" title="Ungroup">
                    <Ungroup size={13} />
                  </button>
                )
              }
              
              return (
                <button onClick={() => groupElements(selectedElementIds)} className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent" title="Group Selection">
                  <Combine size={13} />
                </button>
              )
            }
            return null
          })()}

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
      <div className="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar pb-10 md:pb-0">
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
      <div className="p-2 border-t border-[var(--ms-border)]">
        <button
          onClick={addSlide}
          className="w-full flex items-center justify-center gap-1.5 bg-[var(--ms-bg-base)] hover:bg-[var(--ms-border)] border border-[var(--ms-border)] text-[var(--ms-text-secondary)] hover:text-[var(--ms-text-primary)] text-xs font-medium py-1.5 rounded-md transition-all cursor-pointer"
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
    <aside className="w-[220px] shrink-0 flex flex-col bg-[var(--ms-bg-surface)] overflow-hidden">
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
    selectedElementIds, setSelectedElement, setSelectedElements, toggleElementLock, deleteElement,
    setMobileInspectorOpen, setMobileSlidesOpen, isMultiSelectMode
  } = useEditorStore()
  const isMobile = useIsMobile()
  const isSelected = selectedElementIds.includes(element.id)
  const isLocked = element.locked

  return (
    <div className="group/row relative">
      <div
        onClick={(e) => {
          e.stopPropagation()
          if (element.groupId && !(e.shiftKey || isMultiSelectMode)) {
            const slide = useEditorStore.getState().activeProject()?.slides[useEditorStore.getState().activeSlideIndex]
            const groupIds = slide?.elements.filter(el => el.groupId === element.groupId).map(el => el.id) || [element.id]
            setSelectedElements(groupIds)
          } else {
            setSelectedElement(element.id, e.shiftKey || isMultiSelectMode)
          }
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

function GroupRow({ childrenElements }: { groupId: string, childrenElements: SceneElement[] }) {
  const [isOpen, setIsOpen] = useState(true)
  const { selectedElementIds, setSelectedElements, isMultiSelectMode } = useEditorStore()
  
  const allSelected = childrenElements.every(el => selectedElementIds.includes(el.id))
  
  return (
    <div className="flex flex-col">
      <div 
        onClick={(e) => {
          e.stopPropagation()
          const ids = childrenElements.map(el => el.id)
          // If shift key or multi-select mode, toggle selection for the whole group
          if (e.shiftKey || isMultiSelectMode) {
            if (allSelected) {
              const remaining = selectedElementIds.filter(id => !ids.includes(id))
              setSelectedElements(remaining)
            } else {
              setSelectedElements([...new Set([...selectedElementIds, ...ids])])
            }
          } else {
            setSelectedElements(ids)
          }
        }}
        className={`w-full flex items-center gap-1.5 px-2 py-[3px] rounded text-left cursor-pointer transition-colors ${
          allSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-transparent text-neutral-500 hover:bg-white/5 hover:text-neutral-300'
        }`}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }} 
          className="p-0 text-inherit bg-transparent border-none cursor-pointer hover:text-white"
        >
          {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </button>
        <Combine size={10} className="shrink-0" />
        <span className="text-[9px] font-medium truncate flex-1">Group</span>
      </div>
      
      {isOpen && (
        <div className="pl-4 flex flex-col gap-px border-l border-white/5 ml-3 my-0.5">
          {childrenElements.map(el => <ElementRow key={el.id} element={el} />)}
        </div>
      )}
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
    <motion.div
      layout
      initial={false}
      transition={{ duration: 0.2, ease: 'circOut' }}
      className={`relative shrink-0 rounded-xl overflow-hidden cursor-pointer border-2 transition-all group shadow-lg ${
        isActive ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-white/5 hover:border-white/12 bg-white/2'
      }`}
      onClick={onSelect}
    >
      {/* Thumbnail body */}
      <div
        className="aspect-video shrink-0 flex items-center justify-center relative bg-[#0a0a0a]"
        style={{ background }}
      >
        <span className="text-[10px] text-neutral-600 font-medium opacity-40 group-hover:opacity-100 transition-opacity">
          {elements.length > 0 ? `${elements.length} layer${elements.length > 1 ? 's' : ''}` : 'Empty'}
        </span>

        {/* Index badge */}
        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-md border border-white/5">
          <span className="text-[10px] text-neutral-400 font-bold leading-none">{index + 1}</span>
        </div>

        {/* Action buttons on hover */}
        {isActive && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onDuplicate}
              title="Duplicate"
              className="p-1 rounded-md bg-black/40 backdrop-blur-md border border-white/5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <Copy size={11} />
            </button>
            <button
              onClick={onDuplicateKeepIds}
              title="Magic Move"
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
      <div className={`px-2 py-1.5 ${isActive ? 'bg-white/4' : 'bg-transparent'}`} onDoubleClick={handleDoubleClick}>
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
          <span className={`text-[10px] font-medium block truncate ${isActive ? 'text-white' : 'text-neutral-500'}`}>
            {name}
          </span>
        )}
      </div>

      {/* ── Figma-style element layer list (active slide only) ── */}
      <AnimatePresence>
        {isActive && elements.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black/20 border-t border-white/5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Collapsible header */}
            <button
              onClick={() => setLayersOpen((o) => !o)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[9px] text-neutral-500 hover:text-neutral-300 uppercase tracking-widest font-bold cursor-pointer border-none bg-transparent transition-colors"
            >
              {layersOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              Layers
            </button>

            {/* Element rows */}
            {layersOpen && (
              <div className="pb-2 px-1 flex flex-col gap-px max-h-[240px] overflow-y-auto custom-scrollbar">
                {(() => {
                  interface LayerNode { type: 'element' | 'group', id: string, element?: SceneElement, children?: SceneElement[] }
                  const tree: LayerNode[] = []
                  const groupMap = new Map<string, LayerNode>()
                  
                  elements.forEach(el => {
                    if (el.groupId) {
                      if (!groupMap.has(el.groupId)) {
                        const groupNode: LayerNode = { type: 'group', id: el.groupId, children: [] }
                        groupMap.set(el.groupId, groupNode)
                        tree.push(groupNode)
                      }
                      groupMap.get(el.groupId)!.children!.push(el)
                    } else {
                      tree.push({ type: 'element', id: el.id, element: el })
                    }
                  })
                  
                  tree.reverse()
                  tree.forEach(node => { if (node.type === 'group' && node.children) node.children.reverse() })

                  return tree.map(node => {
                    if (node.type === 'group') return <GroupRow key={node.id} groupId={node.id} childrenElements={node.children!} />
                    return <ElementRow key={node.id} element={node.element!} />
                  })
                })()}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
