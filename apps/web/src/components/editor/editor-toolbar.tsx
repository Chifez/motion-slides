import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Play, PenSquare, GitBranch, Film, Sparkles, MoreVertical, Settings, Download, Users, WifiOff, ChevronDown, Search, X, Plus, Loader2 } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { SettingsDropdown } from './toolbar/settings-dropdown'
import { ExportDropdown } from './toolbar/export-dropdown'
import { Logo } from '@/components/ui/logo'
import { useIsMobile } from '@/hooks/use-media-query'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ShareMenu } from './toolbar/share-menu'
import { UserMenu } from '@/components/auth/user-menu'
import { DeckScoreBadge } from './ai/deck-score-badge'

import { motion, AnimatePresence } from 'framer-motion'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { usePermissions } from '@/context/permission-context'
import { Button } from '@/components/ui/core/button'

interface Props { projectId: string }

export function EditorToolbar({ projectId }: Props) {
  const mobileSlidesOpen = useEditorStore(state => state.mobileSlidesOpen)
  const isGitPanelOpen = useEditorStore(state => state.isGitPanelOpen)
  const createBranch = useEditorStore(state => state.createBranch)
  const navigate = useNavigate()

  const [showBranchMenu, setShowBranchMenu] = useState(false)
  const [branchSearch, setBranchSearch] = useState('')
  const [isCreatingBranch, setIsCreatingBranch] = useState(false)
  const branchMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (branchMenuRef.current && !branchMenuRef.current.contains(event.target as Node)) {
        setShowBranchMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const updateProjectName = useEditorStore(state => state.updateProjectName)
  const startPresentation = useEditorStore(state => state.startPresentation)
  const setMobileSlidesOpen = useEditorStore(state => state.setMobileSlidesOpen)
  const toggleChat = useEditorStore(state => state.toggleChat)
  const syncProjects = useEditorStore(state => state.syncProjects)
  const user = useEditorStore(state => state.user)
  const editorMode = useEditorStore(state => state.editorMode ?? 'design')
  const setEditorMode = useEditorStore(state => state.setEditorMode)
  const { mode, isAuthenticated } = usePermissions()

  const projectName = useEditorStore(state => state.projects.find(projectItem => projectItem.id === projectId)?.name ?? '')
  const project = useEditorStore(state => state.projects.find(projectItem => projectItem.id === projectId))

  const isOnline = useOnlineStatus()

  const projectsList = useEditorStore(state => state.projects)
  const mainProject = project ? (project.forkedFromId ? projectsList.find(p => p.id === project.forkedFromId) || project : project) : null
  const allBranches = mainProject ? projectsList.filter(p => p.id === mainProject.id || p.forkedFromId === mainProject.id) : []

  const filteredBranches = allBranches.filter(b => {
    const isMain = b.id === mainProject?.id
    const displayName = isMain ? 'main' : b.name
    return displayName.toLowerCase().includes(branchSearch.toLowerCase().trim())
  })

  const exactMatchExists = allBranches.some(b => {
    const isMain = b.id === mainProject?.id
    const displayName = isMain ? 'main' : b.name
    return displayName.toLowerCase() === branchSearch.toLowerCase().trim()
  })

  const canCreate = branchSearch.trim().length > 0 && !exactMatchExists

  const handleCreateBranch = async (nameToCreate?: string) => {
    const targetName = (nameToCreate ?? branchSearch).trim()
    if (!targetName || isCreatingBranch || !project) return
    setIsCreatingBranch(true)
    try {
      const res = await createBranch(project.id, targetName)
      if (res && res.id) {
        setBranchSearch('')
        setShowBranchMenu(false)
        navigate({ to: '/p/$projectId', params: { projectId: res.id } })
      }
    } catch (err) {
      console.error('Failed to create branch:', err)
    } finally {
      setIsCreatingBranch(false)
    }
  }

  const isChatOpen = useEditorStore(state => state.isChatOpen)

  const parentProject = project?.forkedFromId ? projectsList.find(p => p.id === project.forkedFromId) : null
  const isBranch = project?.forkedFromId && parentProject && project.ownerId === parentProject.ownerId
  const canShare = project ? (isAuthenticated && project.ownerId === user?.id && !isBranch) : false

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const isMobile = useIsMobile()

  if (!project) return null

  return (
    <>
      {!isOnline && (
        <div className="w-full shrink-0 bg-amber-500/90 text-white flex items-center justify-center gap-2 py-1 px-4 text-[11px] md:text-xs font-medium z-[60] shadow-sm">
          <WifiOff size={12} className="shrink-0" />
          <span className="truncate">You are offline. Changes are saved locally and will sync when you reconnect.</span>
        </div>
      )}
      <header className="h-14 shrink-0 flex items-center justify-between gap-2 px-3 md:px-4 bg-(--ms-bg-surface) border-b border-(--ms-border) z-50 transition-colors">
        {/* Left Zone: Identity & Navigation */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/dashboard"
            onClick={() => syncProjects()}
            className="p-1.5 rounded-lg text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border)/50 transition-colors shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </Link>

          {isMobile && (
            <button
              onClick={() => setMobileSlidesOpen(!mobileSlidesOpen)}
              className={`p-1.5 rounded-lg transition-colors border-none cursor-pointer shrink-0 ${mobileSlidesOpen ? 'bg-blue-600/20 text-blue-400' : 'text-(--ms-text-muted) hover:bg-(--ms-border)/50'}`}
              title="Toggle Slides Panel"
            >
              {mobileSlidesOpen ? <PenSquare size={16} /> : <Film size={16} />}
            </button>
          )}

          <Link to="/" onClick={() => syncProjects()} className="items-center no-underline hidden sm:flex shrink-0">
            <Logo expanded={false} size={22} />
          </Link>

          <input
            value={projectName}
            disabled={project.ownerId !== user?.id}
            onChange={(event) => updateProjectName(projectId, event.target.value)}
            onBlur={(event) => { if (!event.target.value.trim()) updateProjectName(projectId, 'Untitled Deck') }}
            spellCheck={false}
            className="bg-transparent border border-transparent hover:border-(--ms-border) focus:border-blue-500 focus:bg-(--ms-bg-base) rounded-lg px-2 py-1 text-xs md:text-[13px] text-(--ms-text-primary) font-semibold w-[100px] sm:w-[130px] md:w-[160px] focus:outline-none transition truncate disabled:opacity-85 shrink-0"
          />

          {((!!project.forkedFromId) || (!!project.ownerId && !!user)) && (
            <div className="relative hidden md:flex items-center shrink-0" ref={branchMenuRef}>
              <Button
                variant={showBranchMenu ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setShowBranchMenu(!showBranchMenu)
                  if (!showBranchMenu) setBranchSearch('')
                }}
                className={`h-7 px-2 text-xs flex items-center gap-1.5 rounded-lg shrink-0 ${showBranchMenu ? 'border-blue-500/50 text-blue-400 bg-blue-600/5' : ''}`}
              >
                <GitBranch size={12} className="text-blue-500 shrink-0" />
                <span title={project.forkedFromId ? project.name : 'main'} className="max-w-[70px] lg:max-w-[90px] truncate font-medium">
                  {project.forkedFromId ? project.name : 'main'}
                </span>
                <ChevronDown size={11} className={`transition duration-200 shrink-0 ${showBranchMenu ? 'rotate-180' : ''}`} />
              </Button>

              {showBranchMenu && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-(--ms-border)">
                    <span className="text-xs font-semibold text-(--ms-text-primary)">
                      Switch branches/tags
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBranchMenu(false)}
                      className="p-1 rounded text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* Search / Create Input */}
                  <div className="p-2 border-b border-(--ms-border)">
                    <div className="relative flex items-center">
                      <Search size={13} className="absolute left-2.5 text-(--ms-text-muted) pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Find or create a branch..."
                        value={branchSearch}
                        onChange={(e) => setBranchSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (canCreate) {
                              handleCreateBranch()
                            } else if (filteredBranches.length > 0) {
                              const target = filteredBranches[0]
                              setShowBranchMenu(false)
                              navigate({ to: '/p/$projectId', params: { projectId: target.id } })
                            }
                          }
                        }}
                        className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-(--ms-text-primary) focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  {/* Branch List */}
                  <div className="max-h-56 overflow-y-auto custom-scrollbar p-1">
                    {filteredBranches.length > 0 ? (
                      filteredBranches.map(b => {
                        const isMain = b.id === mainProject?.id
                        const isCurrent = b.id === project.id
                        const displayName = isMain ? 'main' : b.name

                        return (
                          <button
                            key={b.id}
                            onClick={() => {
                              setShowBranchMenu(false)
                              if (!isCurrent) {
                                navigate({ to: '/p/$projectId', params: { projectId: b.id } })
                              }
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer border-none text-left ${
                              isCurrent
                                ? 'bg-blue-600/10 text-blue-400 font-semibold'
                                : 'text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border)/50 bg-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <GitBranch size={13} className={isCurrent ? 'text-blue-500' : 'text-(--ms-text-muted)'} />
                              <span className="truncate">{displayName}</span>
                              {isMain && (
                                <span className="text-[10px] bg-(--ms-border) px-1.5 py-0.2 rounded text-(--ms-text-muted) uppercase tracking-wider">
                                  default
                                </span>
                              )}
                            </div>
                            {isCurrent && <Check size={14} className="text-blue-500 shrink-0" />}
                          </button>
                        )
                      })
                    ) : (
                      <div className="px-3 py-4 text-center text-xs text-(--ms-text-muted)">
                        No branches found
                      </div>
                    )}
                  </div>

                  {/* Footer / Create prompt */}
                  {canCreate && (
                    <div className="p-2 border-t border-(--ms-border) bg-(--ms-bg-base)/50">
                      <button
                        type="button"
                        onClick={() => handleCreateBranch()}
                        disabled={isCreatingBranch}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium transition cursor-pointer border-none shadow-sm disabled:opacity-50"
                      >
                        {isCreatingBranch ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Plus size={13} />
                        )}
                        <span className="truncate">Create branch: <strong>{branchSearch.trim()}</strong></span>
                      </button>
                    </div>
                  )}

                  <div className="p-1 border-t border-(--ms-border) bg-(--ms-bg-surface)">
                    <button
                      onClick={() => {
                        setShowBranchMenu(false)
                        useEditorStore.getState().toggleGitPanel()
                      }}
                      className="w-full text-center text-[11px] text-(--ms-text-muted) hover:text-(--ms-text-primary) py-1 rounded hover:bg-(--ms-border)/50 transition bg-transparent border-none cursor-pointer"
                    >
                      View all branches
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center Zone: Workflow Mode Switcher */}
        {mode === 'edit' && (
          <div className="flex items-center bg-(--ms-bg-base)/80 border border-(--ms-border) rounded-xl p-0.5 shadow-xs">
            <button
              onClick={() => setEditorMode('design')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition cursor-pointer border-none ${editorMode === 'design'
                ? 'bg-(--ms-border-strong) text-(--ms-text-primary) shadow-sm'
                : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
                }`}
            >
              <PenSquare size={13} /> {!isMobile && "Design"}
            </button>
            <button
              onClick={() => setEditorMode('prototype')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition cursor-pointer border-none ${editorMode === 'prototype'
                ? 'bg-(--ms-border-strong) text-blue-400 shadow-sm'
                : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
                }`}
            >
              <GitBranch size={13} /> {!isMobile && "Prototype"}
            </button>
            <button
              onClick={() => setEditorMode('timeline')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition cursor-pointer border-none ${editorMode === 'timeline'
                ? 'bg-(--ms-border-strong) text-purple-400 shadow-sm'
                : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
                }`}
            >
              <Film size={13} /> {!isMobile && "Timeline"}
            </button>
          </div>
        )}

        {/* Right Zone: High-Value Actions */}
        {isMobile ? (
          <div className="flex items-center gap-1.5">
            <DeckScoreBadge />

            <button
              id="tour-ai-chat-button"
              onClick={() => toggleChat()}
              title="AI Design Studio Chat"
              className={`p-2 rounded-lg transition cursor-pointer border-none ${isChatOpen ? 'bg-purple-600/20 text-purple-400' : 'bg-(--ms-bg-elevated) text-(--ms-text-muted)'}`}
            >
              <Sparkles size={16} />
            </button>

            <div className="relative">
              <button
                className="p-2 rounded-lg bg-(--ms-bg-elevated) border border-(--ms-border) text-(--ms-text-muted) hover:text-(--ms-text-primary) transition-colors border-none cursor-pointer"
                onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
              >
                <MoreVertical size={16} />
              </button>

              <AnimatePresence>
                {mobileMoreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-12 right-0 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl shadow-2xl z-100 p-1.5 w-48"
                  >
                    <div className="space-y-0.5">
                      <div className="relative h-10 w-full flex items-center gap-2.5 px-3 rounded-lg hover:bg-(--ms-border) transition-colors">
                        <Settings size={16} className="text-(--ms-text-muted)" />
                        <span className="text-sm text-(--ms-text-secondary)">Settings</span>
                        <SettingsDropdown isMobile />
                      </div>
                      <div className="relative h-10 w-full flex items-center gap-2.5 px-3 rounded-lg hover:bg-(--ms-border) transition-colors">
                        <Download size={16} className="text-(--ms-text-muted)" />
                        <span className="text-sm text-(--ms-text-secondary)">Export</span>
                        <ExportDropdown isMobile />
                      </div>
                      {canShare && (
                        <div className="relative h-10 w-full flex items-center gap-2.5 px-3 rounded-lg hover:bg-(--ms-border) transition-colors">
                          <Users size={16} className="text-(--ms-text-muted)" />
                          <span className="text-sm text-(--ms-text-secondary)">Share</span>
                          <ShareMenu project={project} isMobile />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              id="tour-present-button"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-none shadow-sm"
              onClick={() => startPresentation()}
              title="Start Presentation"
            >
              <Play size={13} fill="currentColor" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* AI Copilot Button */}
            <button
              id="tour-ai-chat-button"
              onClick={() => toggleChat()}
              title="AI Design Studio Copilot"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                isChatOpen
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-xs'
                  : 'bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 border-purple-500/30'
              }`}
            >
              <Sparkles size={13} className="text-purple-400" />
              <span className="hidden lg:inline">Ask AI</span>
            </button>

            {/* Version Control / Git */}
            {((!!project.forkedFromId) || (!!project.ownerId && !!user)) && (
              <button
                onClick={() => useEditorStore.getState().toggleGitPanel()}
                title="Version Control (Git)"
                className={`inline-flex items-center justify-center p-1.5 rounded-lg transition cursor-pointer border-none ${isGitPanelOpen
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border)/50'
                  }`}
              >
                <GitBranch size={15} />
              </button>
            )}

            {/* Deck Health / Critic Score Badge */}
            <DeckScoreBadge />

            <SettingsDropdown />
            <ExportDropdown />
            {canShare && <ShareMenu project={project} />}
            <ThemeToggle />
            <UserMenu dashboard />

            {/* Hero CTA: Present */}
            <button
              id="tour-present-button"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:shadow-md cursor-pointer border-none shadow-sm active:scale-95 ml-1"
              onClick={() => startPresentation()}
              title="Start Presentation (Full Screen)"
            >
              <Play size={12} fill="currentColor" />
              <span>Present</span>
            </button>
          </div>
        )}
      </header>
    </>
  )
}
