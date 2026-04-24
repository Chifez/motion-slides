import { useState, useRef } from 'react'
import { Type, Code2, Shapes, Minus, ChevronDown, BarChart3 } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { nanoid } from '@/lib/nanoid'
import { DEFAULT_TEXT_ELEMENT, DEFAULT_CODE_ELEMENT, DEFAULT_SHAPE_ELEMENT, DEFAULT_LINE_ELEMENT, DEFAULT_CHART_ELEMENT, LINE_TYPE_OPTIONS } from '@/constants/editor'
import { useClickOutside } from '@/hooks/useClickOutside'
import type { LineType } from '@motionslides/shared'

const btnBase = "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-white/8 bg-[#1c1c1c] text-neutral-400 hover:text-neutral-100 hover:bg-[#242424]"

export function ElementButtons() {
  const { addElement } = useEditorStore()
  const [showLineMenu, setShowLineMenu] = useState(false)
  const lineRef = useRef<HTMLDivElement>(null)
  useClickOutside(lineRef, () => setShowLineMenu(false))

  const addText = () => addElement({ ...DEFAULT_TEXT_ELEMENT, id: nanoid() })
  const addCode = () => addElement({ ...DEFAULT_CODE_ELEMENT, id: nanoid() })
  const addShape = () => addElement({ ...DEFAULT_SHAPE_ELEMENT, id: nanoid() })
  const addChart = () => addElement({ ...DEFAULT_CHART_ELEMENT, id: nanoid() })

  const addLine = (lineType: LineType) => {
    const branches = lineType === 'branching' ? [
      { x: 1, y: 0 }, // Up
      { x: 1, y: 1 }  // Down
    ] : undefined
    
    const lineContent = { ...DEFAULT_LINE_ELEMENT.content, lineType, branches }
    const size = lineType === 'straight'
      ? { width: 200, height: 2 }
      : { width: 200, height: 100 }
      
    addElement({
      ...DEFAULT_LINE_ELEMENT,
      id: nanoid(),
      size,
      content: lineContent,
    })
    setShowLineMenu(false)
  }

  return (
    <>
      <button className={btnBase} onClick={addText}>
        <Type size={13} /> Text
      </button>
      <button className={btnBase} onClick={addCode}>
        <Code2 size={13} /> Code
      </button>
      <button className={btnBase} onClick={addShape}>
        <Shapes size={13} /> Shape
      </button>
      <button className={btnBase} onClick={addChart}>
        <BarChart3 size={13} /> Chart
      </button>
      <div className="w-px h-5 bg-white/8 mx-0.5" />
      <div className="relative" ref={lineRef}>
        <button
          className={btnBase}
          onClick={() => setShowLineMenu(!showLineMenu)}
        >
          <Minus size={13} /> Line <ChevronDown size={10} />
        </button>
        {showLineMenu && (
          <div className="absolute left-0 top-full mt-1.5 bg-[#1a1a1a] border border-white/8 rounded-lg shadow-2xl z-50 p-1.5 w-36">
            {LINE_TYPE_OPTIONS.map((lt) => (
              <button
                key={lt.value}
                onClick={() => addLine(lt.value as LineType)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] text-neutral-300 hover:bg-white/6 transition-colors cursor-pointer border-none bg-transparent text-left"
              >
                <span className="text-base w-4 text-center">{lt.icon}</span>
                {lt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
