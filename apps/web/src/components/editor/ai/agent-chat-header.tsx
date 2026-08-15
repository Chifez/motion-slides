import { useState, useRef, useEffect } from 'react'
import { X, Sparkles, MessageSquare, Plus, Check, Trash2, ChevronDown, Clock } from 'lucide-react'
import type { ChatThread } from '@/store/chat-history-store'

interface Props {
  onClose: () => void
  threads: ChatThread[]
  activeThreadId: string | null
  onSelectThread: (threadId: string) => void
  onNewThread: () => void
  onDeleteThread: (threadId: string) => void
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function AgentChatHeader({
  onClose,
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
}: Props) {
  const [showThreadMenu, setShowThreadMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowThreadMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const activeThread = threads.find((t) => t.id === activeThreadId)
  const threadTitle = activeThread ? activeThread.title : 'New Thread'

  return (
    <div className="h-13 flex items-center justify-between px-3.5 border-b border-(--ms-border) bg-(--ms-bg-surface) shrink-0 select-none transition-colors">
      {/* Brand & Copilot Identity */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
          <Sparkles size={13} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-(--ms-text-primary) tracking-tight leading-tight">
            MotionSlides Copilot
          </span>
        </div>
      </div>

      {/* Center/Right Thread Switcher & Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Thread Switcher Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowThreadMenu(!showThreadMenu)}
            className={`h-7 px-2 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-[0.97] cursor-pointer border ${
              showThreadMenu
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'bg-(--ms-bg-elevated) hover:bg-(--ms-border) text-(--ms-text-secondary) hover:text-(--ms-text-primary) border-(--ms-border)'
            }`}
            title="Switch or manage conversation threads"
          >
            <MessageSquare size={11} className="shrink-0 text-blue-400" />
            <span className="max-w-[100px] truncate">{threadTitle}</span>
            <ChevronDown size={10} className={`transition-transform duration-150 shrink-0 ${showThreadMenu ? 'rotate-180' : ''}`} />
          </button>

          {showThreadMenu && (
            <div className="absolute top-full right-0 mt-1.5 w-72 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-150">
              {/* New Thread Action Button */}
              <button
                type="button"
                onClick={() => {
                  setShowThreadMenu(false)
                  onNewThread()
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all duration-150 active:scale-[0.97] cursor-pointer mb-1.5"
              >
                <Plus size={13} className="shrink-0" />
                <span>New Conversation</span>
              </button>

              <div className="px-2 py-1 flex items-center justify-between border-b border-(--ms-border)">
                <span className="text-[10px] font-semibold text-(--ms-text-muted) uppercase tracking-wider">
                  History ({threads.length})
                </span>
              </div>

              {/* Thread list */}
              <div className="flex flex-col max-h-56 overflow-y-auto custom-scrollbar space-y-0.5 pt-1">
                {threads.length === 0 ? (
                  <div className="py-6 text-center text-xs text-(--ms-text-muted)">
                    No conversation history yet
                  </div>
                ) : (
                  threads.map((t) => {
                    const isActive = t.id === activeThreadId
                    return (
                      <div
                        key={t.id}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 ${
                          isActive
                            ? 'bg-blue-600/15 text-blue-400 font-medium'
                            : 'text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-bg-surface)'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setShowThreadMenu(false)
                            onSelectThread(t.id)
                          }}
                          className="flex-1 flex items-center gap-2 text-left min-w-0 bg-transparent border-none p-0 cursor-pointer text-inherit font-inherit"
                        >
                          {isActive ? (
                            <Check size={12} className="shrink-0 text-blue-400" />
                          ) : (
                            <Clock size={11} className="shrink-0 text-(--ms-text-muted) opacity-60" />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-xs">{t.title}</span>
                            <span className="text-[9px] text-(--ms-text-muted)">
                              {formatRelativeTime(t.updatedAt)} • {t.messages.length} msgs
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteThread(t.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-(--ms-text-muted) hover:text-red-400 transition-all duration-150 border-none bg-transparent cursor-pointer ml-1.5"
                          title="Delete thread"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick New Thread Button */}
        <button
          type="button"
          onClick={onNewThread}
          className="p-1.5 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-bg-elevated) transition-all duration-150 active:scale-[0.95] border-none bg-transparent cursor-pointer"
          title="Start fresh conversation"
          aria-label="New thread"
        >
          <Plus size={15} />
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-bg-elevated) transition-all duration-150 active:scale-[0.95] border-none bg-transparent cursor-pointer"
          aria-label="Close copilot"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
