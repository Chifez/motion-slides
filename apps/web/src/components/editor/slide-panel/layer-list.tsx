import { useState } from 'react'
import { Type, Code2, Square, Minus, BarChart3, Lock, Unlock, Trash2, Combine, ChevronDown, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditorStore } from '@/store/editor-store'
import { useIsMobile } from '@/hooks/use-media-query'
import type { SceneElement } from '@motionslides/shared'

interface LayerListProps {
  elements: SceneElement[]
  isActive: boolean
}

export function LayerList({ elements, isActive }: LayerListProps) {
  const [layersOpen, setLayersOpen] = useState(true)

  return (
    <AnimatePresence>
      {isActive && elements.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-(--ms-bg-base) border-t border-(--ms-border) overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setLayersOpen((o) => !o)}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[9px] text-(--ms-text-muted) hover:text-(--ms-text-primary) uppercase tracking-widest font-bold cursor-pointer border-none bg-transparent transition-colors"
          >
            {layersOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            Layers
          </button>

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
  )
}

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

function ElementRow({ element }: { element: SceneElement }) {
  const selectedElementIds = useEditorStore(s => s.selectedElementIds)
  const setSelectedElement = useEditorStore(s => s.setSelectedElement)
  const setSelectedElements = useEditorStore(s => s.setSelectedElements)
  const toggleElementLock = useEditorStore(s => s.toggleElementLock)
  const deleteElement = useEditorStore(s => s.deleteElement)
  const setMobileInspectorOpen = useEditorStore(s => s.setMobileInspectorOpen)
  const setMobileSlidesOpen = useEditorStore(s => s.setMobileSlidesOpen)
  const isMultiSelectMode = useEditorStore(s => s.isMultiSelectMode)
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
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-transparent text-(--ms-text-muted) hover:bg-(--ms-border) hover:text-(--ms-text-primary)'
          }`}
      >
        <ElementIcon type={element.type} />
        <span className="text-[9px] font-medium truncate flex-1">{elementLabel(element)}</span>

        {(isLocked || isSelected) && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleElementLock(element.id) }}
            className={`p-0.5 rounded transition-colors ${isLocked ? 'text-blue-400' : 'text-(--ms-text-muted) opacity-0 group-hover/row:opacity-100 hover:text-(--ms-text-primary)'} border-none bg-transparent cursor-pointer`}
          >
            {isLocked ? <Lock size={8} /> : <Unlock size={8} />}
          </button>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); deleteElement(element.id) }}
          className="p-0.5 rounded text-(--ms-text-muted) opacity-0 group-hover/row:opacity-100 hover:text-red-400 border-none bg-transparent cursor-pointer"
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
        className={`w-full flex items-center gap-1.5 px-2 py-[3px] rounded text-left cursor-pointer transition-colors ${allSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-transparent text-(--ms-text-muted) hover:bg-(--ms-border) hover:text-(--ms-text-primary)'
          }`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
          className="p-0 text-inherit bg-transparent border-none cursor-pointer hover:text-(--ms-text-primary)"
        >
          {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </button>
        <Combine size={10} className="shrink-0" />
        <span className="text-[9px] font-medium truncate flex-1">Group</span>
      </div>

      {isOpen && (
        <div className="pl-4 flex flex-col gap-px border-l border-(--ms-border) ml-3 my-0.5">
          {childrenElements.map(el => <ElementRow key={el.id} element={el} />)}
        </div>
      )}
    </div>
  )
}
