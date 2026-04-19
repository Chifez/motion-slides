import { Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditorStore } from '@/store/editorStore'
import { useIsMobile } from '@/hooks/useMediaQuery'
import type { TextContent, CodeContent, ShapeContent, LineContent } from '@/types'
import { TransformSection } from './inspector/TransformSection'
import { TextSection } from './inspector/TextSection'
import { CodeSection } from './inspector/CodeSection'
import { ShapeSection } from './inspector/ShapeSection'
import { LineSection } from './inspector/LineSection'

const sectionCls = "px-3 py-3 border-b border-white/6"

export function InspectorPanel() {
  const { selectedElementId, setSelectedElement, activeSlide, updateElement, deleteElement } = useEditorStore()
  const isMobile = useIsMobile()
  const slide = activeSlide()
  const element = slide?.elements.find((el) => el.id === selectedElementId)

  const update = (data: Parameters<typeof updateElement>[1]) => element && updateElement(element.id, data)

  const panelContent = (
    <div className={`h-full flex flex-col bg-[#161616] ${isMobile ? 'rounded-t-2xl shadow-2xl' : 'border-l border-white/8'}`}>
      {!element ? (
        <div className={sectionCls}>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600 mb-2.5 block">Inspector</span>
          <p className="text-[12px] text-neutral-700">Select an element to inspect its properties.</p>
        </div>
      ) : (
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
                  onClick={() => setSelectedElement(null)}
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
          </div>
        </>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <AnimatePresence>
        {element && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedElement(null)}
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
