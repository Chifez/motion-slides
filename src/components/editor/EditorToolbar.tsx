import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Play, Download, Type, Code2, Shapes } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { Project } from '../../types'
import { nanoid } from '../../lib/nanoid'

interface Props { project: Project }

export function EditorToolbar({ project }: Props) {
  const { updateProjectName, addElement } = useEditorStore()

  function addText() {
    addElement({
      id: nanoid(),
      type: 'text',
      position: { x: 100, y: 100 },
      size: { width: 300, height: 60 },
      rotation: 0, opacity: 1, zIndex: 10,
      content: { value: 'Text', fontSize: 28, fontWeight: 'bold', color: '#ffffff', align: 'left' },
    })
  }

  function addCode() {
    addElement({
      id: nanoid(),
      type: 'code',
      position: { x: 100, y: 200 },
      size: { width: 420, height: 160 },
      rotation: 0, opacity: 1, zIndex: 10,
      content: { value: '// write code here\n', language: 'javascript' },
    })
  }

  function addShape() {
    addElement({
      id: nanoid(),
      type: 'shape',
      position: { x: 200, y: 200 },
      size: { width: 120, height: 120 },
      rotation: 0, opacity: 1, zIndex: 10,
      content: { shapeType: 'rectangle', fill: '#1e3a5f', stroke: '#3b82f6', label: 'Service' },
    })
  }

  const btnBase = "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-white/[0.08] bg-[#1c1c1c] text-neutral-400 hover:text-neutral-100 hover:bg-[#242424]"

  return (
    <header className="h-14 shrink-0 flex items-center gap-2 px-3 bg-[#161616] border-b border-white/[0.08] z-50">
      {/* Back */}
      <Link to="/dashboard" className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-100 hover:bg-white/[0.06] transition-colors">
        <ArrowLeft size={16} />
      </Link>

      <div className="w-px h-5 bg-white/[0.08] mx-1" />

      {/* Logo */}
      <Link to="/" className="flex items-center no-underline">
        <img src="/logo.png" alt="MotionSlides" className="h-6 w-auto" />
      </Link>

      {/* Editable title */}
      <input
        value={project.name}
        onChange={(e) => updateProjectName(project.id, e.target.value)}
        onBlur={(e) => { if (!e.target.value.trim()) updateProjectName(project.id, 'Untitled Deck') }}
        spellCheck={false}
        className="bg-transparent border border-transparent hover:border-white/[0.08] focus:border-blue-500 focus:bg-[#1c1c1c] rounded-md px-2 py-1 text-[13px] text-neutral-100 font-medium min-w-[130px] max-w-[220px] focus:outline-none transition-all"
      />

      <div className="w-px h-5 bg-white/[0.08] mx-1" />

      {/* Add element buttons */}
      <button className={btnBase} onClick={addText}><Type size={13} /> Text</button>
      <button className={btnBase} onClick={addCode}><Code2 size={13} /> Code</button>
      <button className={btnBase} onClick={addShape}><Shapes size={13} /> Shape</button>

      <div className="flex-1" />

      <button className={btnBase}><Download size={13} /> Export</button>
      <button className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer border-none">
        <Play size={13} fill="currentColor" /> Play
      </button>
    </header>
  )
}
