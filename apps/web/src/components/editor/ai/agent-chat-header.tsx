import { useState, useRef, useEffect } from 'react'
import { X, Plus, Check, Trash2, ChevronDown } from 'lucide-react'
import type { ChatThread } from '@/store/chat-history-store'

/**
 * Header: 44px, one row, no brand badge.
 *
 * The thread switcher *is* the title (same pattern as Cursor / Linear): the panel is
 * already labelled by the toolbar button that opened it, so repeating "MotionSlides
 * Copilot" spends the most valuable row of the rail on a name the user already knows.
 */

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
  return `${Math.floor(hours / 24)}d ago`
}

const ICON_BUTTON =
  'ms-focus-ring flex size-7 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-(--ms-text-muted) transition-[transform,background-color,color] duration-150 hover:bg-(--ms-bg-elevated) hover:text-(--ms-text-primary) active:scale-[0.95]'

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
    if (!showThreadMenu) return
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowThreadMenu(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowThreadMenu(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showThreadMenu])

  const activeThread = threads.find((t) => t.id === activeThreadId)
  const threadTitle = activeThread?.title ?? 'New conversation'

  return (
    <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-(--ms-border) pr-2 pl-2.5 select-none">
      <div className="relative min-w-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setShowThreadMenu((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={showThreadMenu}
          className="ms-focus-ring flex h-7 max-w-full cursor-pointer items-center gap-1.5 rounded-md border-none bg-transparent px-1.5 text-[13px] font-medium text-(--ms-text-primary) transition-colors duration-150 hover:bg-(--ms-bg-elevated)"
        >
          <span className="truncate">{threadTitle}</span>
          <ChevronDown
            size={12}
            className={`shrink-0 text-(--ms-text-muted) transition-transform duration-150 ease-(--ms-ease-out) ${showThreadMenu ? 'rotate-180' : ''}`}
          />
        </button>

        {showThreadMenu && (
          <div
            role="menu"
            // Anchored to the trigger's top-left, so it scales from there (origin-aware popover).
            className="absolute top-full left-0 z-50 mt-1 flex max-h-80 w-72 origin-top-left animate-[ms-pop-in_140ms_var(--ms-ease-out)] flex-col overflow-hidden rounded-lg border border-(--ms-border-strong) bg-(--ms-bg-elevated) p-1 shadow-2xl"
          >
            <div className="custom-scrollbar flex min-h-0 flex-col gap-px overflow-y-auto">
              {threads.length === 0 ? (
                <p className="px-2.5 py-3 text-center text-xs text-(--ms-text-muted)">No conversations yet</p>
              ) : (
                threads.map((thread) => {
                  const isActive = thread.id === activeThreadId
                  return (
                    <div
                      key={thread.id}
                      className={`group/thread flex items-center rounded-md transition-colors duration-150 ${
                        isActive ? 'bg-(--ms-bg-surface)' : 'hover:bg-(--ms-bg-surface)'
                      }`}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowThreadMenu(false)
                          onSelectThread(thread.id)
                        }}
                        className="ms-focus-ring flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md border-none bg-transparent px-2 py-1.5 text-left"
                      >
                        <span className="flex size-3.5 shrink-0 items-center justify-center text-(--ms-text-primary)">
                          {isActive && <Check size={12} />}
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span
                            className={`truncate text-xs leading-4 ${isActive ? 'text-(--ms-text-primary)' : 'text-(--ms-text-secondary)'}`}
                          >
                            {thread.title}
                          </span>
                          <span className="text-[11px] leading-4 text-(--ms-text-muted)">{formatRelativeTime(thread.updatedAt)}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteThread(thread.id)}
                        aria-label={`Delete ${thread.title}`}
                        className="ms-focus-ring mr-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent text-(--ms-text-muted) opacity-0 transition-[opacity,color] duration-150 group-hover/thread:opacity-100 hover:text-rose-400 focus-visible:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center">
        <button type="button" onClick={onNewThread} className={ICON_BUTTON} title="New conversation" aria-label="New conversation">
          <Plus size={15} />
        </button>
        <button type="button" onClick={onClose} className={ICON_BUTTON} title="Close" aria-label="Close Copilot">
          <X size={15} />
        </button>
      </div>
    </header>
  )
}
