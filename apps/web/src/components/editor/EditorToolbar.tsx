import { Link } from '@tanstack/react-router'
import { ArrowLeft, Play, PenSquare, GitBranch, CheckSquare, Layout } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import type { Project } from '@motionslides/shared'
import { ElementButtons } from './toolbar/ElementButtons'
import { SettingsDropdown } from './toolbar/SettingsDropdown'
import { ExportDropdown } from './toolbar/ExportDropdown'
import { Logo } from '@/components/ui/Logo'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { MobileElementDropdown } from './toolbar/MobileElementDropdown'

interface Props { project: Project }

export function EditorToolbar({ project }: Props) {
  const {
    updateProjectName, startPresentation, isPrototypeMode,
    setPrototypeMode, mobileSlidesOpen, setMobileSlidesOpen,
    isMultiSelectMode, setMultiSelectMode
  } = useEditorStore()

  const isMobile = useIsMobile();

  return (
    <header className="h-14 shrink-0 flex items-center gap-1 md:gap-2 px-2 md:px-3 bg-[#161616] border-b border-white/8 z-50">
      <Link to="/dashboard" className="p-1 md:p-1.5 rounded-md text-neutral-500 hover:text-neutral-100 hover:bg-white/6 transition-colors">
        <ArrowLeft size={16} />
      </Link>
      <div className="w-px h-5 bg-white/8 mx-0.5 md:mx-1" />

      {isMobile && (
        <>
          <button
            onClick={() => setMobileSlidesOpen(!mobileSlidesOpen)}
            className={`p-2 rounded-md transition-colors border-none cursor-pointer ${mobileSlidesOpen ? 'bg-blue-600/20 text-blue-400' : 'text-neutral-500 hover:bg-white/6'
              }`}
          >
            <Layout size={16} />
          </button>
          <button
            onClick={() => setMultiSelectMode(!isMultiSelectMode)}
            className={`p-2 rounded-md transition-colors border-none cursor-pointer ${isMultiSelectMode ? 'bg-blue-600/20 text-blue-400' : 'text-neutral-500 hover:bg-white/6'
              }`}
            title="Multi-select Mode"
          >
            <CheckSquare size={16} />
          </button>
        </>
      )}

      <Link to="/" className="items-center no-underline hidden sm:flex">
        <Logo expanded={false} size={22} />
      </Link>
      <input
        value={project.name}
        onChange={(e) => updateProjectName(project.id, e.target.value)}
        onBlur={(e) => { if (!e.target.value.trim()) updateProjectName(project.id, 'Untitled Deck') }}
        spellCheck={false}
        className="bg-transparent border border-transparent hover:border-white/8 focus:border-blue-500 focus:bg-[#1c1c1c] rounded-md px-1 md:px-2 py-1 text-[13px] text-neutral-100 font-medium min-w-[60px] md:min-w-[130px] max-w-[220px] focus:outline-none transition-all truncate"
      />
      <div className="w-px h-5 bg-white/8 mx-0.5 md:mx-1" />

      {/* Design / Prototype mode toggle - Figma-style */}
      <div className="flex items-center bg-[#1c1c1c] border border-white/8 rounded-md p-0.5">
        <button
          onClick={() => setPrototypeMode(false)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm transition-all cursor-pointer border-none ${!isPrototypeMode
            ? 'bg-[#2a2a2a] text-neutral-100 shadow-sm'
            : 'bg-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          title="Design Mode"
        >
          <PenSquare size={12} /> {!isMobile && "Design"}
        </button>
        <button
          onClick={() => setPrototypeMode(true)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm transition-all cursor-pointer border-none ${isPrototypeMode
            ? 'bg-[#2a2a2a] text-blue-400 shadow-sm'
            : 'bg-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          title="Prototype Mode"
        >
          <GitBranch size={12} /> {!isMobile && "Prototype"}
        </button>
      </div>

      {!isPrototypeMode && (
        <>
          <div className="w-px h-5 bg-white/8 mx-1" />
          {isMobile ? <MobileElementDropdown /> : <ElementButtons />}
        </>
      )}

      <div className="flex-1" />

      <SettingsDropdown />
      <ExportDropdown />

      <button
        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer border-none"
        onClick={() => startPresentation()}
        title="Start Presentation"
      >
        <Play size={13} fill="currentColor" /> {!isMobile && "Play"}
      </button>
    </header>
  )
}
