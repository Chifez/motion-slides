import { Link } from '@tanstack/react-router'
import { ArrowLeft, Play, PenSquare, GitBranch, CheckSquare, Layout, Sparkles, Sun, Moon, Share2, Copy, Lock, Check, Cloud, MoreVertical, Settings, Download, Users, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import type { Project } from '@motionslides/shared'
import { ElementButtons } from './toolbar/ElementButtons'
import { SettingsDropdown } from './toolbar/SettingsDropdown'
import { ExportDropdown } from './toolbar/ExportDropdown'
import { Logo } from '@/components/ui/Logo'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ShareMenu } from './toolbar/ShareMenu'
import { SuggestionsDropdown } from './toolbar/SuggestionsDropdown'
import { listSuggestionsAction } from '@/lib/actions/suggestions'
import type { ProjectSuggestion } from '@/lib/actions/suggestions'
import { useAccessControl } from '@/hooks/useAccessControl'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

interface Props { projectId: string }

export function EditorToolbar({ projectId }: Props) {
  const isPrototypeMode = useEditorStore(state => state.isPrototypeMode)
  const mobileSlidesOpen = useEditorStore(state => state.mobileSlidesOpen)
  const isChatOpen = useEditorStore(state => state.isChatOpen)

  const updateProjectName = useEditorStore(state => state.updateProjectName)
  const startPresentation = useEditorStore(state => state.startPresentation)
  const setPrototypeMode = useEditorStore(state => state.setPrototypeMode)
  const setMobileSlidesOpen = useEditorStore(state => state.setMobileSlidesOpen)
  const toggleChat = useEditorStore(state => state.toggleChat)
  const syncProjects = useEditorStore(state => state.syncProjects)
  const setSuggestions = useEditorStore(state => state.setSuggestions)
  const user = useEditorStore(state => state.user)

  const projectName = useEditorStore(state => state.projects.find(projectItem => projectItem.id === projectId)?.name ?? '')
  const project = useEditorStore(state => state.projects.find(projectItem => projectItem.id === projectId))

  const { isAuthenticated } = useAccessControl()
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const isMobile = useIsMobile();
  const isOnline = useOnlineStatus()

  // Fetch pending suggestions for owner
  useEffect(() => {
    let ignore = false
    const userId = user?.id ?? null
    if (!project || !userId || project.ownerId !== userId) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      try {
        const suggestionsList = await listSuggestionsAction({ data: { projectId } })
        if (!ignore) {
          setSuggestions(suggestionsList as ProjectSuggestion[])
        }
      } catch (error) {
        console.error('Failed to list suggestions:', error)
      }
    }

    fetchSuggestions()

    return () => {
      ignore = true
    }
  }, [projectId, project?.ownerId, user?.id, setSuggestions])

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
          onChange={(event) => updateProjectName(projectId, event.target.value)}
          onBlur={(event) => { if (!event.target.value.trim()) updateProjectName(projectId, 'Untitled Deck') }}
          spellCheck={false}
          className="bg-transparent border border-transparent hover:border-(--ms-border) focus:border-blue-500 focus:bg-(--ms-bg-base) rounded-md px-1 md:px-2 py-1 text-[13px] text-(--ms-text-primary) font-medium min-w-[60px] md:min-w-[130px] max-w-[220px] focus:outline-none transition-all truncate hidden md:block"
        />

        <div className="w-px h-5 bg-(--ms-border) mx-0.5 md:mx-1 hidden md:block" />

        <div className="flex items-center bg-(--ms-bg-elevated) border border-(--ms-border) rounded-md p-0.5">
          <button
            onClick={() => setPrototypeMode(false)}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm transition-all cursor-pointer border-none ${!isPrototypeMode
              ? 'bg-(--ms-border-strong) text-(--ms-text-primary) shadow-sm'
              : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
              }`}
          >
            <PenSquare size={12} /> {!isMobile && "Design"}
          </button>
          <button
            onClick={() => setPrototypeMode(true)}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm transition-all cursor-pointer border-none ${isPrototypeMode
              ? 'bg-(--ms-border-strong) text-blue-400 shadow-sm'
              : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
              }`}
          >
            <GitBranch size={12} /> {!isMobile && "Prototype"}
          </button>
        </div>

        {!isPrototypeMode && !isMobile && (
          <>
            <div className="w-px h-5 bg-(--ms-border) mx-1" />
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

                    {/* Slots for dropdowns - using div to avoid button nesting conflict */}
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
                      {isAuthenticated && (
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
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer border-none"
              onClick={() => startPresentation()}
            >
              <Play size={13} fill="currentColor" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => toggleChat()}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 md:px-3 py-1.5 rounded-md transition-all cursor-pointer border-none ${isChatOpen ? 'bg-purple-600/20 text-purple-400' : 'bg-(--ms-bg-elevated) text-(--ms-text-muted) hover:text-(--ms-text-primary)'}`}
            >
              <Sparkles size={13} className={isChatOpen ? 'animate-pulse' : ''} />
              <span>Chat</span>
            </button>

            <ThemeToggle className="hidden md:flex" />

            <SuggestionsDropdown />
            <SettingsDropdown />
            <ExportDropdown />
            {isAuthenticated && <ShareMenu project={project} />}

            <button
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-2 md:px-3 py-1.5 rounded-md transition-colors cursor-pointer border-none"
              onClick={() => startPresentation()}
            >
              <Play size={13} fill="currentColor" /> {!isMobile && "Play"}
            </button>
          </>
        )}
      </header>
    </>
  )
}
