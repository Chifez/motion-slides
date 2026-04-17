import { Link } from '@tanstack/react-router'
import { ArrowLeft, Play, PenSquare, GitBranch } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import type { Project } from '@/types'
import { ElementButtons } from './toolbar/ElementButtons'
import { SettingsDropdown } from './toolbar/SettingsDropdown'
import { ExportDropdown } from './toolbar/ExportDropdown'
import { Logo } from '@/components/ui/Logo'

interface Props { project: Project }

export function EditorToolbar({ project }: Props) {
  const { updateProjectName, startPresentation, isPrototypeMode, setPrototypeMode } = useEditorStore()

  return (
    <header className="h-14 shrink-0 flex items-center gap-2 px-3 bg-[#161616] border-b border-white/8 z-50">
      <Link to="/dashboard" className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-100 hover:bg-white/6 transition-colors">
        <ArrowLeft size={16} />
      </Link>
      <div className="w-px h-5 bg-white/8 mx-1" />
      <Link to="/" className="flex items-center no-underline">
        <Logo expanded={false} size={22} />
      </Link>
      <input
        value={project.name}
        onChange={(e) => updateProjectName(project.id, e.target.value)}
        onBlur={(e) => { if (!e.target.value.trim()) updateProjectName(project.id, 'Untitled Deck') }}
        spellCheck={false}
        className="bg-transparent border border-transparent hover:border-white/8 focus:border-blue-500 focus:bg-[#1c1c1c] rounded-md px-2 py-1 text-[13px] text-neutral-100 font-medium min-w-[130px] max-w-[220px] focus:outline-none transition-all"
      />
      <div className="w-px h-5 bg-white/8 mx-1" />

      {/* Design / Prototype mode toggle - Figma-style */}
      <div className="flex items-center bg-[#1c1c1c] border border-white/8 rounded-md p-0.5">
        <button
          onClick={() => setPrototypeMode(false)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm transition-all cursor-pointer border-none ${
            !isPrototypeMode
              ? 'bg-[#2a2a2a] text-neutral-100 shadow-sm'
              : 'bg-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <PenSquare size={12} /> Design
        </button>
        <button
          onClick={() => setPrototypeMode(true)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm transition-all cursor-pointer border-none ${
            isPrototypeMode
              ? 'bg-[#2a2a2a] text-blue-400 shadow-sm'
              : 'bg-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <GitBranch size={12} /> Prototype
        </button>
      </div>

      {!isPrototypeMode && (
        <>
          <div className="w-px h-5 bg-white/8 mx-1" />
          <ElementButtons />
        </>
      )}

      <div className="flex-1" />

      <SettingsDropdown />
      <ExportDropdown />

      <button
        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer border-none"
        onClick={() => startPresentation()}
      >
        <Play size={13} fill="currentColor" /> Play
      </button>
    </header>
  )
}
