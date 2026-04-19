import { useState, useRef } from 'react'
import { Plus, Type, Code2, Shapes, Minus, BarChart3, ChevronRight } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { nanoid } from '@/lib/nanoid'
import {
  DEFAULT_TEXT_ELEMENT,
  DEFAULT_CODE_ELEMENT,
  DEFAULT_SHAPE_ELEMENT,
  DEFAULT_LINE_ELEMENT,
  DEFAULT_CHART_ELEMENT,
  LINE_TYPE_OPTIONS
} from '@/constants/editor'
import { useClickOutside } from '@/hooks/useClickOutside'
import type { LineType } from '@/types'

export function MobileElementDropdown() {
  const { addElement } = useEditorStore()
  const [isOpen, setIsOpen] = useState(false)
  const [showLineSubmenu, setShowLineSubmenu] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useClickOutside(containerRef, () => {
    setIsOpen(false)
    setShowLineSubmenu(false)
  })

  const addText = () => { addElement({ ...DEFAULT_TEXT_ELEMENT, id: nanoid() }); setIsOpen(false) }
  const addCode = () => { addElement({ ...DEFAULT_CODE_ELEMENT, id: nanoid() }); setIsOpen(false) }
  const addShape = () => { addElement({ ...DEFAULT_SHAPE_ELEMENT, id: nanoid() }); setIsOpen(false) }
  const addChart = () => { addElement({ ...DEFAULT_CHART_ELEMENT, id: nanoid() }); setIsOpen(false) }


  const addLine = (lineType: LineType) => {
    const lineContent = { ...DEFAULT_LINE_ELEMENT.content, lineType }
    const size = lineType === 'straight' ? { width: 200, height: 2 } : { width: 200, height: 100 }
    addElement({ ...DEFAULT_LINE_ELEMENT, id: nanoid(), size, content: lineContent })
    setIsOpen(false)
    setShowLineSubmenu(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md bg-[#1c1c1c] border border-white/8 text-neutral-400 hover:text-neutral-100 transition-colors"
      >
        <Plus size={13} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 bg-[#1a1a1a] border border-white/8 rounded-lg shadow-2xl z-60 p-1.5 w-48">
          <button onClick={addText} className="mobile-menu-item"><Type size={14} /> Text</button>
          <button onClick={addCode} className="mobile-menu-item"><Code2 size={14} /> Code</button>
          <button onClick={addShape} className="mobile-menu-item"><Shapes size={14} /> Shape</button>
          <button onClick={addChart} className="mobile-menu-item"><BarChart3 size={14} /> Chart</button>


          <div className="h-px bg-white/5 my-1" />

          <button
            onClick={() => setShowLineSubmenu(!showLineSubmenu)}
            className="mobile-menu-item justify-between"
          >
            <div className="flex items-center gap-2.5"><Minus size={14} /> Line</div>
            <ChevronRight size={12} className={`transition-transform ${showLineSubmenu ? 'rotate-90' : ''}`} />
          </button>

          {showLineSubmenu && (
            <div className="mt-1 pl-6 space-y-1">
              {LINE_TYPE_OPTIONS.map((lt) => (
                <button
                  key={lt.value}
                  onClick={() => addLine(lt.value as LineType)}
                  className="mobile-menu-item text-[11px] py-1.5"
                >
                  <span className="w-4">{lt.icon}</span> {lt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
