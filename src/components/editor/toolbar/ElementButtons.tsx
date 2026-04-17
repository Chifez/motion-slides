import { Type, Code2, Shapes, Spline } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { nanoid } from '@/lib/nanoid'
import { DEFAULT_TEXT_ELEMENT, DEFAULT_CODE_ELEMENT, DEFAULT_SHAPE_ELEMENT } from '@/constants/editor'

const btnBase = "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border"

export function ElementButtons() {
  const { addElement, connectMode, setConnectMode } = useEditorStore()

  const addText = () => { setConnectMode(false); addElement({ ...DEFAULT_TEXT_ELEMENT, id: nanoid() }) }
  const addCode = () => { setConnectMode(false); addElement({ ...DEFAULT_CODE_ELEMENT, id: nanoid() }) }
  const addShape = () => { setConnectMode(false); addElement({ ...DEFAULT_SHAPE_ELEMENT, id: nanoid() }) }

  return (
    <>
      <button className={`${btnBase} border-white/8 bg-[#1c1c1c] text-neutral-400 hover:text-neutral-100 hover:bg-[#242424]`} onClick={addText}>
        <Type size={13} /> Text
      </button>
      <button className={`${btnBase} border-white/8 bg-[#1c1c1c] text-neutral-400 hover:text-neutral-100 hover:bg-[#242424]`} onClick={addCode}>
        <Code2 size={13} /> Code
      </button>
      <button className={`${btnBase} border-white/8 bg-[#1c1c1c] text-neutral-400 hover:text-neutral-100 hover:bg-[#242424]`} onClick={addShape}>
        <Shapes size={13} /> Shape
      </button>
      <div className="w-px h-5 bg-white/8 mx-0.5" />
      <button
        className={`${btnBase} ${
          connectMode
            ? 'border-blue-500 bg-blue-500/15 text-blue-400'
            : 'border-white/8 bg-[#1c1c1c] text-neutral-400 hover:text-neutral-100 hover:bg-[#242424]'
        }`}
        onClick={() => setConnectMode(!connectMode)}
      >
        <Spline size={13} /> Line
      </button>
    </>
  )
}
