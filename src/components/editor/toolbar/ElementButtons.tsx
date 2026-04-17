import { Type, Code2, Shapes } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { nanoid } from '@/lib/nanoid'
import { DEFAULT_TEXT_ELEMENT, DEFAULT_CODE_ELEMENT, DEFAULT_SHAPE_ELEMENT } from '@/constants/editor'

const btnBase = "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-white/8 bg-[#1c1c1c] text-neutral-400 hover:text-neutral-100 hover:bg-[#242424]"

export function ElementButtons() {
  const { addElement } = useEditorStore()

  const addText = () => addElement({ ...DEFAULT_TEXT_ELEMENT, id: nanoid() })
  const addCode = () => addElement({ ...DEFAULT_CODE_ELEMENT, id: nanoid() })
  const addShape = () => addElement({ ...DEFAULT_SHAPE_ELEMENT, id: nanoid() })

  return (
    <>
      <button className={btnBase} onClick={addText}><Type size={13} /> Text</button>
      <button className={btnBase} onClick={addCode}><Code2 size={13} /> Code</button>
      <button className={btnBase} onClick={addShape}><Shapes size={13} /> Shape</button>
    </>
  )
}
