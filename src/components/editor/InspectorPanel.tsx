import { Trash2 } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import type { TextContent, CodeContent, ShapeContent } from '@/types'
import { TransformSection } from './inspector/TransformSection'
import { TextSection } from './inspector/TextSection'
import { CodeSection } from './inspector/CodeSection'
import { ShapeSection } from './inspector/ShapeSection'
import { ConnectionSection } from './inspector/ConnectionSection'

const sectionCls = "px-3 py-3 border-b border-white/6"

export function InspectorPanel() {
  const {
    selectedElementId, activeSlide, updateElement, deleteElement,
    selectedConnectionId, updateConnection, deleteConnection, setSelectedConnection,
  } = useEditorStore()
  const slide = activeSlide()
  const element = slide?.elements.find((el) => el.id === selectedElementId)
  const connection = slide?.connections.find((c) => c.id === selectedConnectionId)

  // Connection selected — show connection inspector
  if (connection) {
    return (
      <aside className="w-[280px] shrink-0 bg-[#161616] border-l border-white/8 overflow-y-auto">
        <ConnectionSection
          connection={connection}
          onUpdate={(updates) => updateConnection(connection.id, updates)}
          onDelete={() => { deleteConnection(connection.id); setSelectedConnection(null) }}
        />
      </aside>
    )
  }

  // No element selected — empty state
  if (!element) {
    return (
      <aside className="w-[280px] shrink-0 bg-[#161616] border-l border-white/8 overflow-y-auto">
        <div className={sectionCls}>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600 mb-2.5 block">Inspector</span>
          <p className="text-[12px] text-neutral-700">Select an element to inspect its properties.</p>
        </div>
      </aside>
    )
  }

  const update = (data: Parameters<typeof updateElement>[1]) => updateElement(element.id, data)

  return (
    <aside className="w-[280px] shrink-0 bg-[#161616] border-l border-white/8 overflow-y-auto">
      {/* Header */}
      <div className={`${sectionCls} flex items-center justify-between`}>
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">{element.type}</span>
        <button
          onClick={() => deleteElement(element.id)}
          className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer border-none bg-transparent"
        >
          <Trash2 size={13} />
        </button>
      </div>

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
    </aside>
  )
}
