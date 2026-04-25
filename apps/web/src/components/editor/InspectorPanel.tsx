import { Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditorStore } from '@/store/editorStore'
import type { TextContent, CodeContent, ShapeContent, LineContent, ChartContent } from '@motionslides/shared'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { TransformSection } from './inspector/TransformSection'
import { TextSection } from './inspector/TextSection'
import { CodeSection } from './inspector/CodeSection'
import { ShapeSection } from './inspector/ShapeSection'
import { LineSection } from './inspector/LineSection'
import { ChartSection } from './inspector/ChartSection'

const sectionCls = "px-3 py-3 border-b border-white/6"

export function InspectorPanel() {
  const { 
    selectedElementIds, activeSlide, updateElement, updateElements, deleteElement,
    groupElements, ungroupElements,
    mobileInspectorOpen, setMobileInspectorOpen
  } = useEditorStore()
  const isMobile = useIsMobile()
  const slide = activeSlide()
  const element = slide?.elements.find((el) => el.id === selectedElementIds[0])

  const update = (data: Parameters<typeof updateElement>[1]) => {
    if (selectedElementIds.length === 1 && element) {
      updateElement(element.id, data)
    } else if (selectedElementIds.length > 1) {
      updateElements(selectedElementIds, data)
    }
  }

  const panelContent = (
    <div className={`h-full flex flex-col bg-[#161616] ${isMobile ? 'rounded-t-2xl shadow-2xl' : 'border-l border-white/8'}`}>
      {selectedElementIds.length === 0 ? (
        <div className={sectionCls}>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600 mb-2.5 block">Inspector</span>
          <p className="text-[12px] text-neutral-700">Select an element to inspect its properties.</p>
        </div>
      ) : selectedElementIds.length > 1 ? (
        <div className={sectionCls}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Multiple Selected ({selectedElementIds.length})</span>
            {isMobile && (
              <button
                onClick={() => setMobileInspectorOpen(false)}
                className="p-1.5 rounded-md text-neutral-500 hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {/* If all selected share the exact same groupId, they are a Group. Offer Ungroup. */}
            {(() => {
              const elements = selectedElementIds.map(id => slide?.elements.find(e => e.id === id)).filter(Boolean) as any[]
              const firstGroupId = elements[0]?.groupId
              const allSameGroup = firstGroupId && elements.every(el => el.groupId === firstGroupId) && elements.length > 1
              
              if (allSameGroup) {
                return (
                  <button
                    onClick={() => ungroupElements(firstGroupId)}
                    className="w-full flex items-center justify-center gap-1.5 bg-white/4 hover:bg-white/8 border border-white/8 text-neutral-300 hover:text-white text-xs font-medium py-2 rounded-md transition-all cursor-pointer"
                  >
                    Ungroup Elements
                  </button>
                )
              }
              
              return (
                <button
                  onClick={() => groupElements(selectedElementIds)}
                  className="w-full flex items-center justify-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 hover:text-blue-200 text-xs font-medium py-2 rounded-md transition-all cursor-pointer"
                >
                  Group Elements
                </button>
              )
            })()}
            <button
              onClick={() => {
                selectedElementIds.forEach(id => deleteElement(id))
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium py-2 rounded-md transition-all cursor-pointer"
            >
              <Trash2 size={13} /> Delete All
            </button>
          </div>
        </div>
      ) : element && (
        <>
          {/* Header */}
          <div className={`${sectionCls} flex items-center justify-between sticky top-0 bg-[#161616] z-10`}>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">{element.type}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => deleteElement(element.id)}
                className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer border-none bg-transparent"
              >
                <Trash2 size={13} />
              </button>
              {isMobile && (
                <button
                  onClick={() => setMobileInspectorOpen(false)}
                  className="p-1.5 rounded-md text-neutral-500 hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 md:pb-0">
            <TransformSection element={element} onUpdate={update} />

            {element.type === 'text' && (
              <TextSection content={element.content as TextContent} onUpdate={(c) => update({ content: c })} />
            )}
            {element.type === 'code' && (
              <CodeSection content={element.content as CodeContent} onUpdate={(c) => update({ content: c })} />
            )}
            {element.type === 'shape' && (
              <ShapeSection content={element.content as ShapeContent} onUpdate={(c) => update({ content: c })} />
            )}
            {element.type === 'line' && (
              <LineSection
                content={element.content as LineContent}
                onUpdate={(c) => update({ content: c })}
                onDelete={() => deleteElement(element.id)}
              />
            )}
            {element.type === 'chart' && (
              <ChartSection content={element.content as ChartContent} onUpdate={(c) => update({ content: c })} />
            )}
          </div>
        </>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <AnimatePresence>
        {selectedElementIds.length > 0 && mobileInspectorOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileInspectorOpen(false)}
              className="fixed inset-0 bg-black/60 z-100 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 h-[60vh] z-101 overflow-hidden"
            >
              {panelContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    )
  }

  return (
    <aside className="w-[280px] shrink-0 bg-[#161616] overflow-hidden">
      {panelContent}
    </aside>
  )
}
