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
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      content: { value: 'Text', fontSize: 28, fontWeight: 'bold', color: '#ffffff', align: 'left' },
    })
  }

  function addCode() {
    addElement({
      id: nanoid(),
      type: 'code',
      position: { x: 100, y: 200 },
      size: { width: 400, height: 140 },
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      content: { value: '// write code here\n', language: 'javascript' },
    })
  }

  function addShape() {
    addElement({
      id: nanoid(),
      type: 'shape',
      position: { x: 200, y: 200 },
      size: { width: 120, height: 120 },
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      content: { shapeType: 'rectangle', fill: '#1e3a5f', stroke: '#3b82f6', label: 'Service' },
    })
  }

  return (
    <header className="toolbar">
      <Link to="/dashboard" className="btn btn-ghost btn-icon" title="Dashboard">
        <ArrowLeft size={16} />
      </Link>

      <div className="toolbar-divider" />

      <span className="toolbar-logo">MS</span>

      <input
        className="toolbar-title-input"
        value={project.name}
        onChange={(e) => updateProjectName(project.id, e.target.value)}
        onBlur={(e) => { if (!e.target.value.trim()) updateProjectName(project.id, 'Untitled Deck') }}
        spellCheck={false}
      />

      <div className="toolbar-divider" />

      <button className="btn btn-panel" onClick={addText} title="Add Text">
        <Type size={13} /> Text
      </button>
      <button className="btn btn-panel" onClick={addCode} title="Add Code Block">
        <Code2 size={13} /> Code
      </button>
      <button className="btn btn-panel" onClick={addShape} title="Add Shape">
        <Shapes size={13} /> Shape
      </button>

      <div className="toolbar-spacer" />

      <button className="btn btn-panel" title="Export">
        <Download size={13} /> Export
      </button>
      <button className="btn btn-primary" title="Play Presentation">
        <Play size={13} fill="currentColor" /> Play
      </button>
    </header>
  )
}
