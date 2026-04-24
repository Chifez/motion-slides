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

  const panelContent = (
    <div className={`h-full flex flex-col bg-[#161616] ${isMobile ? 'rounded-r-2xl shadow-2xl' : 'border-r border-white/8'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/6 sticky top-0 bg-[#161616] z-10">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600">Slides & Layers</span>
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
              {(() => {
                // Build a layer tree
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
                
                // Reverse for top-to-bottom rendering
                tree.reverse()
                tree.forEach(node => {
                  if (node.type === 'group' && node.children) {
                    node.children.reverse()
                  }
                })

                return tree.map(node => {
                  if (node.type === 'group') {
                    return <GroupRow key={node.id} groupId={node.id} childrenElements={node.children!} />
                  }
                  return <ElementRow key={node.id} element={node.element!} />
                })
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
