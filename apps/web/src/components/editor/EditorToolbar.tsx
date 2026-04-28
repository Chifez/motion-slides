import { Link } from '@tanstack/react-router'
import { ArrowLeft, Play, PenSquare, GitBranch, CheckSquare, Layout, Sparkles, Sun, Moon, Share2, Copy, Lock, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import type { Project } from '@motionslides/shared'
import { ElementButtons } from './toolbar/ElementButtons'
import { SettingsDropdown } from './toolbar/SettingsDropdown'
import { ExportDropdown } from './toolbar/ExportDropdown'
import { Logo } from '@/components/ui/Logo'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { MobileElementDropdown } from './toolbar/MobileElementDropdown'
import { ShareMenu } from './toolbar/ShareMenu'

interface Props { project: Project }

export function EditorToolbar({ project }: Props) {
  // Reactive state selectors
  const isPrototypeMode = useEditorStore(s => s.isPrototypeMode)
  const mobileSlidesOpen = useEditorStore(s => s.mobileSlidesOpen)
  const isMultiSelectMode = useEditorStore(s => s.isMultiSelectMode)
  const isChatOpen = useEditorStore(s => s.isChatOpen)
  const theme = useEditorStore(s => s.theme)

  // Stable actions
  const {
    updateProjectName, startPresentation,
    setPrototypeMode, setMobileSlidesOpen,
    setMultiSelectMode, toggleChat,
    toggleTheme
  } = useEditorStore()

  const isMobile = useIsMobile();
  
  // ── Sync theme to DOM ──
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <header className="h-14 shrink-0 flex items-center gap-1 md:gap-2 px-2 md:px-3 bg-(--ms-bg-surface) border-b border-(--ms-border) z-50 transition-colors">
      <Link to="/dashboard" className="p-1 md:p-1.5 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition-colors">
        <ArrowLeft size={16} />
      </Link>
      <div className="w-px h-5 bg-(--ms-border) mx-0.5 md:mx-1" />

      {isMobile && (
        <>
          <button
            onClick={() => setMobileSlidesOpen(!mobileSlidesOpen)}
            className={`p-2 rounded-md transition-colors border-none cursor-pointer ${mobileSlidesOpen ? 'bg-blue-600/20 text-blue-400' : 'text-(--ms-text-muted) hover:bg-(--ms-border)'
              }`}
          >
            <Layout size={16} />
          </button>
          <button
            onClick={() => setMultiSelectMode(!isMultiSelectMode)}
            className={`p-2 rounded-md transition-colors border-none cursor-pointer ${isMultiSelectMode ? 'bg-blue-600/20 text-blue-400' : 'text-(--ms-text-muted) hover:bg-(--ms-border)'
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
        className="bg-transparent border border-transparent hover:border-(--ms-border) focus:border-blue-500 focus:bg-(--ms-bg-base) rounded-md px-1 md:px-2 py-1 text-[13px] text-(--ms-text-primary) font-medium min-w-[60px] md:min-w-[130px] max-w-[220px] focus:outline-none transition-all truncate hidden md:block"
      />
      <div className="w-px h-5 bg-(--ms-border) mx-0.5 md:mx-1 hidden md:block" />

      {/* Design / Prototype mode toggle - Figma-style */}
      <div className="flex items-center bg-(--ms-bg-elevated) border border-(--ms-border) rounded-md p-0.5">
        <button
          onClick={() => setPrototypeMode(false)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm transition-all cursor-pointer border-none ${!isPrototypeMode
            ? 'bg-(--ms-border-strong) text-(--ms-text-primary) shadow-sm'
            : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
            }`}
          title="Design Mode"
        >
          <PenSquare size={12} /> {!isMobile && "Design"}
        </button>
        <button
          onClick={() => setPrototypeMode(true)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm transition-all cursor-pointer border-none ${isPrototypeMode
            ? 'bg-(--ms-border-strong) text-blue-400 shadow-sm'
            : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
            }`}
          title="Prototype Mode"
        >
          <GitBranch size={12} /> {!isMobile && "Prototype"}
        </button>
      </div>

      {!isPrototypeMode && (
        <>
          <div className="w-px h-5 bg-(--ms-border) mx-1" />
          {isMobile ? <MobileElementDropdown /> : <ElementButtons />}
        </>
      )}

      <div className="flex-1" />

      <button
        onClick={() => toggleChat()}
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 md:px-3 py-1.5 rounded-md transition-all cursor-pointer border-none ${isChatOpen ? 'bg-purple-600/20 text-purple-400' : 'bg-(--ms-bg-elevated) text-(--ms-text-muted) hover:text-(--ms-text-primary)'}`}
        title="AI Generation"
      >
        <Sparkles size={13} className={isChatOpen ? 'animate-pulse' : ''} />
        {!isMobile && <span>AI Chat</span>}
      </button>

      <button
        onClick={() => toggleTheme()}
        className="hidden md:flex p-1.5 md:p-2 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition-colors border-none bg-transparent cursor-pointer"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      <SettingsDropdown />
      <ExportDropdown />
      <ShareMenu project={project} />

      <button
        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-2 md:px-3 py-1.5 rounded-md transition-colors cursor-pointer border-none"
        onClick={() => startPresentation()}
        title="Start Presentation"
      >
        <Play size={13} fill="currentColor" /> {!isMobile && "Play"}
      </button>
    </header>
  )
}
