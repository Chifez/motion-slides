import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Play, PenSquare, GitBranch, Film, CheckSquare, Layout, Sparkles, Sun, Moon, Share2, Copy, Lock, Check, Cloud, MoreVertical, Settings, Download, Users, WifiOff, GitFork, ChevronDown } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useEditorStore } from '@/store/editor-store'
import type { Project } from '@motionslides/shared'
import { ElementButtons } from './toolbar/element-buttons'
import { ToolSelector } from './toolbar/tool-selector'
import { SettingsDropdown } from './toolbar/settings-dropdown'
import { ExportDropdown } from './toolbar/export-dropdown'
import { Logo } from '@/components/ui/logo'
import { useIsMobile } from '@/hooks/use-media-query'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ShareMenu } from './toolbar/share-menu'
import { UserMenu } from '@/components/auth/user-menu'

import { useAccessControl } from '@/hooks/use-access-control'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { usePermissions } from '@/context/permission-context'
import { Button } from '@/components/ui/core/button'
import { Input } from '@/components/ui/core/input'

interface Props { projectId: string }

export function EditorToolbar({ projectId }: Props) {
  const isPrototypeMode = useEditorStore(state => state.isPrototypeMode)
  const mobileSlidesOpen = useEditorStore(state => state.mobileSlidesOpen)
  const isGitPanelOpen = useEditorStore(state => state.isGitPanelOpen)
  const createBranch = useEditorStore(state => state.createBranch)
  const navigate = useNavigate()

  const [showBranchMenu, setShowBranchMenu] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
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
  const setPrototypeMode = useEditorStore(state => state.setPrototypeMode)
  const setMobileSlidesOpen = useEditorStore(state => state.setMobileSlidesOpen)
  const toggleChat = useEditorStore(state => state.toggleChat)
  const syncProjects = useEditorStore(state => state.syncProjects)
  const setSuggestions = useEditorStore(state => state.setSuggestions)
  const user = useEditorStore(state => state.user)
  const localAuthorId = useEditorStore(state => state.localAuthorId)
  const editorMode = useEditorStore(state => state.editorMode ?? 'design')
  const setEditorMode = useEditorStore(state => state.setEditorMode)
  const { mode, canEdit } = usePermissions()

  const projectName = useEditorStore(state => state.projects.find(projectItem => projectItem.id === projectId)?.name ?? '')
  const project = useEditorStore(state => state.projects.find(projectItem => projectItem.id === projectId))

  const isOnline = useOnlineStatus()

  const projectsList = useEditorStore(state => state.projects)
  const mainProject = project ? (project.forkedFromId ? projectsList.find(p => p.id === project.forkedFromId) || project : project) : null
  const allBranches = mainProject ? projectsList.filter(p => p.id === mainProject.id || p.forkedFromId === mainProject.id) : []

  const isChatOpen = useEditorStore(state => state.isChatOpen)

  const { isAuthenticated } = useAccessControl()
  const parentProject = project?.forkedFromId ? projectsList.find(p => p.id === project.forkedFromId) : null
  const isBranch = project?.forkedFromId && parentProject && project.ownerId === parentProject.ownerId
  const canShare = project ? (isAuthenticated && project.ownerId === user?.id && !isBranch) : false

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const isMobile = useIsMobile();



  if (!project) return null

  return (
    <>
      {!isOnline && (
        <div className="w-full shrink-0 bg-amber-500/90 text-white flex items-center justify-center gap-2 py-1 px-4 text-[11px] md:text-xs font-medium z-[60] shadow-sm">
          <WifiOff size={12} className="shrink-0" />
          <span className="truncate">You are offline. Changes are saved locally and will sync when you reconnect.</span>
        </div>
      )}
      <header className="h-14 shrink-0 flex items-center gap-1 md:gap-2 px-2 md:px-3 bg-(--ms-bg-surface) border-b border-(--ms-border) z-50 transition-colors">
        <Link
          to="/dashboard"
          onClick={() => syncProjects()}
          className="p-1 md:p-1.5 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="w-px h-5 bg-(--ms-border) mx-0.5 md:mx-1" />

        {isMobile && (
          <button
            onClick={() => setMobileSlidesOpen(!mobileSlidesOpen)}
            className={`p-2 rounded-md transition-colors border-none cursor-pointer ${mobileSlidesOpen ? 'bg-blue-600/20 text-blue-400' : 'text-(--ms-text-muted) hover:bg-(--ms-border)'}`}
          >
            <Layout size={16} />
          </button>
        )}

        <Link to="/" onClick={() => syncProjects()} className="items-center no-underline hidden sm:flex">
          <Logo expanded={false} size={22} />
        </Link>

        <input
          value={projectName}
          disabled={project.ownerId !== user?.id}
          onChange={(event) => updateProjectName(projectId, event.target.value)}
          onBlur={(event) => { if (!event.target.value.trim()) updateProjectName(projectId, 'Untitled Deck') }}
          spellCheck={false}
          className="bg-transparent border border-transparent hover:border-(--ms-border) focus:border-blue-500 focus:bg-(--ms-bg-base) rounded-md px-1 md:px-2 py-1 text-[13px] text-(--ms-text-primary) font-medium w-[100px] sm:w-auto sm:min-w-[130px] max-w-[140px] md:max-w-[220px] focus:outline-none transition truncate disabled:opacity-85"
        />

        {((!!project.forkedFromId) || (!!project.ownerId && !!user)) && (
          <div className="relative hidden md:block" ref={branchMenuRef}>
            <Button
              variant={showBranchMenu ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className={showBranchMenu ? 'border-blue-500/50 text-blue-400 bg-blue-600/5' : ''}
            >
              <GitBranch size={12} className="text-blue-500 mr-1.5" />
              <span className="max-w-[100px] truncate mr-1.5">{project.name}</span>
              <ChevronDown size={11} className={`transition duration-200 ${showBranchMenu ? 'rotate-180' : ''}`} />
            </Button>

            {showBranchMenu && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-2">
                <span className="text-[9px] font-black text-(--ms-text-muted) uppercase tracking-wider px-2 pt-1 block">
                  Switch Branch
                </span>

                <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto custom-scrollbar px-1">
                  {allBranches.map((b) => {
                    const isCurrent = b.id === project.id
                    const branchIsGuest = b.ownerId && b.ownerId !== user?.id && b.localAuthorId !== localAuthorId
                    return (
                      <button
                        key={b.id}
                        disabled={isCurrent}
                        onClick={() => {
                          setShowBranchMenu(false)
                          navigate({ to: '/p/$projectId', params: { projectId: b.id } })
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs font-semibold transition border-none bg-transparent cursor-pointer ${isCurrent
                          ? 'text-blue-400 bg-blue-600/5 font-bold cursor-default'
                          : 'text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border)/50'
                          }`}
                      >
                        <span className="truncate flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCurrent ? 'bg-blue-400' : 'bg-(--ms-text-muted)/40'}`} />
                          <span className="truncate">{b.name}</span>
                        </span>
                        {branchIsGuest && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/10 scale-90 shrink-0">
                            Collaborator Branch
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="h-px bg-(--ms-border) my-0.5" />

                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!newBranchName.trim() || isCreatingBranch) return
                    setIsCreatingBranch(true)
                    try {
                      const res = await createBranch(project.id, newBranchName.trim())
                      if (res && res.id) {
                        setNewBranchName('')
                        setShowBranchMenu(false)
                        navigate({ to: '/p/$projectId', params: { projectId: res.id } })
                      }
                    } catch (err) {
                      console.error('Failed to create branch:', err)
                    } finally {
                      setIsCreatingBranch(false)
                    }
                  }}
                  className="px-1 flex flex-col gap-1.5"
                >
                  <span className="text-[9px] font-black text-(--ms-text-muted) uppercase tracking-wider px-1 block">
                    Create New Branch
                  </span>
                  <div className="flex gap-1.5">
                    <Input
                      type="text"
                      placeholder="Branch name..."
                      value={newBranchName}
                      disabled={isCreatingBranch}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!newBranchName.trim() || isCreatingBranch}
                      isLoading={isCreatingBranch}
                    >
                      {isCreatingBranch ? '' : 'Create'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}



        <div className="w-px h-5 bg-(--ms-border) mx-0.5 md:mx-1 hidden md:block" />

        {mode === 'edit' && (
          <div className="flex items-center bg-(--ms-bg-elevated) border border-(--ms-border) rounded-md p-0.5">
            <button
              onClick={() => setEditorMode('design')}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm transition cursor-pointer border-none ${editorMode === 'design'
                ? 'bg-(--ms-border-strong) text-(--ms-text-primary) shadow-sm'
                : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
                }`}
            >
              <PenSquare size={12} /> {!isMobile && "Design"}
            </button>
            <button
              onClick={() => setEditorMode('prototype')}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm transition cursor-pointer border-none ${editorMode === 'prototype'
                ? 'bg-(--ms-border-strong) text-blue-400 shadow-sm'
                : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
                }`}
            >
              <GitBranch size={12} /> {!isMobile && "Prototype"}
            </button>
            <button
              onClick={() => setEditorMode('timeline')}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm transition cursor-pointer border-none ${editorMode === 'timeline'
                ? 'bg-(--ms-border-strong) text-purple-400 shadow-sm'
                : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
                }`}
            >
              <Film size={12} /> {!isMobile && "Timeline"}
            </button>
          </div>
        )}

        {!isPrototypeMode && !isMobile && (
          <>
            <div className="w-px h-5 bg-(--ms-border) mx-1" />
            <ToolSelector />
            <ElementButtons />
          </>
        )}

        <div className="flex-1" />

        {isMobile ? (
          <div className="flex items-center gap-1">
            <ThemeToggle />

            <div className="relative">
              <button
                className="p-2 rounded-md bg-(--ms-bg-elevated) border border-(--ms-border) text-(--ms-text-muted) hover:text-(--ms-text-primary) transition-colors border-none cursor-pointer"
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
                    <button
                      onClick={() => { toggleChat(); setMobileMoreOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition-colors border-none bg-transparent text-left cursor-pointer"
                    >
                      <Sparkles size={16} className="text-purple-400" />
                      AI Chat
                    </button>
                    <div className="h-px bg-(--ms-border) my-1" />

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

            {mode !== 'edit' && (
              <button
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer border-none"
                onClick={() => startPresentation()}
              >
                <Play size={13} fill="currentColor" />
              </button>
            )}
          </div>
        ) : (
          <>
            <button
              id="tour-ai-chat-button"
              onClick={() => toggleChat()}
              title="AI Design Studio Chat"
              className={`inline-flex items-center justify-center p-1.5 rounded-md transition cursor-pointer border-none ${isChatOpen ? 'bg-purple-600/20 text-purple-400' : 'bg-(--ms-bg-elevated) text-(--ms-text-muted) hover:text-(--ms-text-primary)'}`}
            >
              <Sparkles size={14} className={isChatOpen ? 'animate-pulse' : ''} />
            </button>

            <ThemeToggle className="hidden md:flex" />

            {((!!project.forkedFromId) || (!!project.ownerId && !!user)) && (
              <button
                onClick={() => useEditorStore.getState().toggleGitPanel()}
                title="Version Control (Git)"
                className={`inline-flex items-center justify-center p-1.5 rounded-md transition cursor-pointer border-none ${isGitPanelOpen
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'bg-(--ms-bg-elevated) text-(--ms-text-muted) hover:text-(--ms-text-primary)'
                  }`}
              >
                <GitBranch size={14} />
              </button>
            )}

            <SettingsDropdown />
            <ExportDropdown />
            {canShare && <ShareMenu project={project} />}
            <div className="w-px h-5 bg-(--ms-border) mx-1 hidden md:block" />
            <UserMenu dashboard />

            {mode !== 'edit' && (
              <button
                id="tour-present-button"
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-md transition-colors cursor-pointer border-none"
                onClick={() => startPresentation()}
                title="Play Presentation"
              >
                <Play size={14} fill="currentColor" />
              </button>
            )}
          </>
        )}
      </header>
    </>
  )
}
