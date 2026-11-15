'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { ArrowDown, XCircle } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditorStore } from '@/store/editor-store'
import { executeAgentTool, type AgentToolName } from '@/lib/agent/tools'
import { AgentChatHeader } from './ai/agent-chat-header'
import { AgentInput } from './ai/agent-input'
import { AgentMessage } from './ai/agent-message'
import { AgentWelcome } from './ai/agent-welcome'
import { AgentThinking } from './ai/agent-thinking'
import { useIsMobile } from '@/hooks/use-media-query'
import { CHAT_PANEL_DEFAULT_WIDTH, CHAT_PANEL_MAX_WIDTH, CHAT_PANEL_MIN_WIDTH } from '@/store/slices/ai-slice'
import {
  getProjectThreads,
  saveThread,
  deleteThread,
  createNewThread,
  generateSmartTitle,
  type ChatThread,
} from '@/store/chat-history-store'

export function AIChat() {
  const isChatOpen = useEditorStore((s) => s.isChatOpen)
  const setChatOpen = useEditorStore((s) => s.setChatOpen)
  const selectedModel = useEditorStore((s) => s.selectedModel)
  const activeProjectId = useEditorStore((s) => s.activeProjectId)

  const [input, setInput] = useState('')
  const chatPanelWidth = useEditorStore((s) => s.chatPanelWidth)
  const setAgentBusy = useEditorStore((s) => s.setAgentBusy)
  const isMobile = useIsMobile()
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartRef = useRef<{ pointerX: number; width: number } | null>(null)
  const currentSnapshotRef = useRef<string | null>(null)
  const messageSnapshotMap = useRef<Record<string, string>>({})
  const turnStartedAtRef = useRef<number | null>(null)
  const messageDurationMap = useRef<Record<string, number>>({})
  const [activeToolCalls, setActiveToolCalls] = useState(0)
  const [pendingApprovals, setPendingApprovals] = useState<Record<string, { toolName: string; args: any }>>({})

  // Thread management state
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)

  const { messages, setMessages, sendMessage, regenerate, status, stop, addToolOutput, error } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: async ({ toolCall }) => {
      const tc = toolCall as unknown as { toolCallId: string; toolName: string; args?: any; input?: any }
      const toolName = tc.toolName
      const toolArgs = tc.input ?? tc.args ?? {}
      
      if (['deleteSlide', 'deleteElement'].includes(toolName)) {
        setPendingApprovals((prev) => ({ ...prev, [tc.toolCallId]: { toolName, args: toolArgs } }))
        return
      }
      
      setActiveToolCalls((count) => count + 1)
      try {
        const res = await executeAgentTool(toolName as AgentToolName, toolArgs)
        addToolOutput({ toolCallId: tc.toolCallId, tool: toolName, output: res })

        // When AI generates or modifies slides/elements/diagrams, activate Deck Report
        if ([
          'synthesizeDeckFromDocument',
          'generateDiagram',
          'patchDiagram',
          'addSlide',
          'addSlideWithLayout',
          'addShapeElement',
          'addSectionElement',
          'applyDeckTheme',
          'harmonizeSlideStyles',
          'auditPresentationQuality',
        ].includes(toolName)) {
          useEditorStore.getState().setHasAiGenerated(true)
        }
      } catch (err) {
        addToolOutput({ toolCallId: tc.toolCallId, tool: toolName, state: 'output-error', errorText: String(err) })
      } finally {
        setActiveToolCalls((count) => Math.max(0, count - 1))
      }
    },
    onFinish: ({ message, messages: allMsgs }) => {
      const targetMsgs = allMsgs || messages
      const finalMsgs = message && !targetMsgs.some(m => m.id === message.id)
        ? [...targetMsgs, message]
        : targetMsgs
      const lastAssistant = [...finalMsgs].reverse().find((m) => m.role === 'assistant')
      if (lastAssistant && turnStartedAtRef.current) {
        messageDurationMap.current[lastAssistant.id] = Math.max(
          1,
          Math.round((Date.now() - turnStartedAtRef.current) / 1000),
        )
      }
      persistActiveThread(finalMsgs)
    },
    onError: (err) => {
      console.error('[MotionSlide Copilot] Chat error:', err)
      if (currentSnapshotRef.current) {
        useEditorStore.getState().restoreSnapshot(currentSnapshotRef.current)
        currentSnapshotRef.current = null
      }
    },
  })

  // Load threads when project changes or chat opens
  useEffect(() => {
    if (!activeProjectId) return
    let isMounted = true

    async function loadThreads() {
      if (!activeProjectId) return
      const loaded = await getProjectThreads(activeProjectId)
      if (!isMounted) return
      setThreads(loaded)

      if (loaded.length > 0) {
        const targetThread = loaded[0]
        setActiveThreadId(targetThread.id)
        setMessages(targetThread.messages)
        messageSnapshotMap.current = targetThread.messageSnapshotMap || {}
        messageDurationMap.current = targetThread.messageDurationMap || {}
      } else {
        const fresh = await createNewThread(activeProjectId)
        if (!isMounted) return
        setThreads([fresh])
        setActiveThreadId(fresh.id)
        setMessages([])
        messageSnapshotMap.current = {}
        messageDurationMap.current = {}
      }
    }

    loadThreads()

    return () => {
      isMounted = false
    }
  }, [activeProjectId, setMessages])

  // Track the snapshot and elapsed duration for this assistant message
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role === 'assistant') {
      if (currentSnapshotRef.current && !messageSnapshotMap.current[lastMsg.id]) {
        messageSnapshotMap.current[lastMsg.id] = currentSnapshotRef.current
      }
      if (turnStartedAtRef.current) {
        messageDurationMap.current[lastMsg.id] = Math.max(
          1,
          Math.round((Date.now() - turnStartedAtRef.current) / 1000),
        )
      }
    }
  }, [messages, status])

  // Persist thread when messages change and stream finishes
  const persistActiveThread = useCallback(async (customMessages?: typeof messages) => {
    if (!activeProjectId || !activeThreadId) return
    const msgs = customMessages || messages
    const currentThread = threads.find((t) => t.id === activeThreadId)
    if (!currentThread) return

    let updatedTitle = currentThread.title
    if (currentThread.title === 'New Conversation' && msgs.length > 0) {
      const firstUserMsg = msgs.find((m) => m.role === 'user')
      if (firstUserMsg) {
        const textContent = (firstUserMsg.parts ?? [])
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join('')
        if (textContent) {
          updatedTitle = generateSmartTitle(textContent)
        }
      }
    }

    const updatedThread: ChatThread = {
      ...currentThread,
      title: updatedTitle,
      updatedAt: Date.now(),
      messages: msgs,
      messageSnapshotMap: messageSnapshotMap.current,
      messageDurationMap: messageDurationMap.current,
    }

    await saveThread(updatedThread)

    setThreads((prev) =>
      prev.map((t) => (t.id === activeThreadId ? updatedThread : t))
    )
  }, [activeProjectId, activeThreadId, messages, threads])

  const isLoading =
    status === 'streaming' ||
    status === 'submitted' ||
    activeToolCalls > 0 ||
    lastAssistantMessageIsCompleteWithToolCalls({ messages })

  // Thread Switcher Handlers
  const handleSelectThread = useCallback(async (threadId: string) => {
    const target = threads.find((t) => t.id === threadId)
    if (!target) return
    setActiveThreadId(target.id)
    setMessages(target.messages)
    messageSnapshotMap.current = target.messageSnapshotMap || {}
    messageDurationMap.current = target.messageDurationMap || {}
  }, [threads, setMessages])

  const handleNewThread = useCallback(async () => {
    if (!activeProjectId) return
    const fresh = await createNewThread(activeProjectId)
    setThreads((prev) => [fresh, ...prev])
    setActiveThreadId(fresh.id)
    setMessages([])
    messageSnapshotMap.current = {}
    messageDurationMap.current = {}
  }, [activeProjectId, setMessages])

  const handleDeleteThread = useCallback(async (threadId: string) => {
    if (!activeProjectId) return
    await deleteThread(activeProjectId, threadId)
    const remaining = threads.filter((t) => t.id !== threadId)
    setThreads(remaining)

    if (activeThreadId === threadId) {
      if (remaining.length > 0) {
        const next = remaining[0]
        setActiveThreadId(next.id)
        setMessages(next.messages)
        messageSnapshotMap.current = next.messageSnapshotMap || {}
        messageDurationMap.current = next.messageDurationMap || {}
      } else {
        const fresh = await createNewThread(activeProjectId)
        setThreads([fresh])
        setActiveThreadId(fresh.id)
        setMessages([])
        messageSnapshotMap.current = {}
        messageDurationMap.current = {}
      }
    }
  }, [activeProjectId, activeThreadId, threads, setMessages])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    const content = text
    setInput('')
    turnStartedAtRef.current = Date.now()
    currentSnapshotRef.current = useEditorStore.getState().pushSnapshot()
    await sendMessage({ text: content })
  }

  const handleApprove = async (toolCallId: string, approved: boolean) => {
    const pending = pendingApprovals[toolCallId]
    if (!pending) return
    setPendingApprovals((prev) => {
      const next = { ...prev }
      delete next[toolCallId]
      return next
    })

    if (approved) {
      try {
        const res = await executeAgentTool(pending.toolName as AgentToolName, pending.args)
        addToolOutput({ toolCallId, tool: pending.toolName, output: res })
      } catch (err) {
        addToolOutput({ toolCallId, tool: pending.toolName, state: 'output-error', errorText: String(err) })
      }
    } else {
      addToolOutput({ toolCallId, tool: pending.toolName, state: 'output-error', errorText: 'User denied this action.' })
    }
  }

  const handleUndo = (messageId: string, snapshotId: string) => {
    useEditorStore.getState().restoreSnapshot(snapshotId)

    const msgIndex = messages.findIndex((m) => m.id === messageId)
    if (msgIndex !== -1) {
      const prevUserMsg = messages.slice(0, msgIndex).reverse().find((m) => m.role === 'user')
      if (prevUserMsg) {
        const textContent = (prevUserMsg.parts ?? [])
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join('')
        if (textContent) {
          setInput(textContent)
        }
        const userIndex = messages.findIndex((m) => m.id === prevUserMsg.id)
        if (userIndex !== -1) {
          setMessages(messages.slice(0, userIndex))
          return
        }
      }
      setMessages(messages.slice(0, msgIndex))
    }
  }

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true)

  function handleScroll() {
    const el = scrollContainerRef.current
    if (!el) return
    setIsPinnedToBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80)
  }

  function scrollToLatest() {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el || !isPinnedToBottom) return
    el.scrollTop = el.scrollHeight
  }, [messages, status, isPinnedToBottom])

  // The toolbar button shows a dot while the agent works, even when this panel is closed.
  // This mirrors React state into the shared store (an external system), so an effect is the right tool.
  useEffect(() => {
    setAgentBusy(isLoading)
    return () => setAgentBusy(false)
  }, [isLoading, setAgentBusy])

  // ── Panel resizing (drag, double-click to reset, arrow keys) ──
  function handleResizePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    resizeStartRef.current = { pointerX: e.clientX, width: chatPanelWidth }
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
  }

  function handleResizePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const start = resizeStartRef.current
    if (!start) return
    // The rail is anchored right, so dragging left (smaller clientX) widens it.
    useEditorStore.getState().setChatPanelWidth(start.width + (start.pointerX - e.clientX))
  }

  function handleResizePointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    if (!resizeStartRef.current) return
    resizeStartRef.current = null
    setIsResizing(false)
    document.body.style.cursor = ''
    e.currentTarget.releasePointerCapture(e.pointerId)
    useEditorStore.getState().commitChatPanelWidth()
  }

  function handleResizeKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 48 : 16
    const { setChatPanelWidth, commitChatPanelWidth } = useEditorStore.getState()
    if (e.key === 'ArrowLeft') setChatPanelWidth(chatPanelWidth + step)
    else if (e.key === 'ArrowRight') setChatPanelWidth(chatPanelWidth - step)
    else return
    e.preventDefault()
    commitChatPanelWidth()
  }

  function handleResizeReset() {
    const { setChatPanelWidth, commitChatPanelWidth } = useEditorStore.getState()
    setChatPanelWidth(CHAT_PANEL_DEFAULT_WIDTH)
    commitChatPanelWidth()
  }

  // Find index of the latest assistant message to pin its action bar
  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf('assistant')

  // Before the assistant message object is created, show the standalone Thinking row.
  // Once the assistant message exists, AgentMessage renders Thinking / AgentActivity at its top.
  const lastMessage = messages[messages.length - 1]
  const showThinking = isLoading && lastMessage?.role !== 'assistant'

  const panelContent = (
    <>
      <AgentChatHeader
        onClose={() => setChatOpen(false)}
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={handleSelectThread}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
      />

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="custom-scrollbar flex h-full flex-col overflow-y-auto px-5 pt-6 pb-8"
        >
          {messages.length === 0 ? (
            <AgentWelcome onPrompt={(prompt) => handleSendMessage(prompt)} />
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg.id}
                style={idx === 0 ? undefined : { marginTop: msg.role === 'user' ? 36 : 28 }}
              >
                <AgentMessage
                  message={msg}
                  isLastAssistantMessage={idx === lastAssistantIndex}
                  isStreaming={isLoading && idx === messages.length - 1 && msg.role === 'assistant'}
                  durationSeconds={messageDurationMap.current[msg.id]}
                  turnStartedAt={idx === messages.length - 1 && isLoading ? turnStartedAtRef.current : null}
                  snapshotId={messageSnapshotMap.current[msg.id]}
                  pendingApprovals={pendingApprovals}
                  onApproveTool={handleApprove}
                  onUndo={handleUndo}
                />
              </div>
            ))
          )}

          {showThinking && (
            <div style={{ marginTop: 28 }}>
              <AgentThinking turnStartedAt={turnStartedAtRef.current} />
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2.5 rounded-lg border border-(--ms-border) bg-(--ms-bg-elevated) px-3 py-2.5"
            >
              <XCircle size={14} className="mt-0.5 shrink-0 text-rose-400" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-5 font-medium text-(--ms-text-primary)">Copilot couldn’t finish that</p>
                <p className="mt-0.5 text-xs leading-4 wrap-break-word text-(--ms-text-secondary)">
                  {error.message || 'An error occurred during generation.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => regenerate()}
                className="ms-focus-ring h-6 shrink-0 cursor-pointer rounded-md border border-(--ms-border-strong) bg-transparent px-2 text-xs font-medium text-(--ms-text-primary) transition-[transform,background-color] duration-150 hover:bg-(--ms-bg-surface) active:scale-[0.97]"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={scrollToLatest}
          tabIndex={isPinnedToBottom || messages.length === 0 ? -1 : 0}
          aria-hidden={isPinnedToBottom || messages.length === 0}
          className={`ms-focus-ring absolute bottom-3 left-1/2 flex h-7 -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full border border-(--ms-border-strong) bg-(--ms-bg-elevated) px-2.5 text-xs text-(--ms-text-secondary) shadow-md transition-[opacity,transform,color] duration-150 ease-(--ms-ease-out) hover:text-(--ms-text-primary) ${
            isPinnedToBottom || messages.length === 0 ? 'pointer-events-none translate-y-1 opacity-0' : 'opacity-100'
          }`}
        >
          <ArrowDown size={12} />
          Latest
        </button>
      </div>

      <AgentInput
        input={input}
        isLoading={isLoading}
        selectedModel={selectedModel}
        onInputChange={(e) => setInput(e.target.value)}
        onSubmit={(e, message) => {
          e.preventDefault()
          handleSendMessage(message)
        }}
        onStop={stop}
      />
    </>
  )

  if (isMobile) {
    return (
      <AnimatePresence>
        {isChatOpen && (
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-x-0 top-12 bottom-0 z-50 flex flex-col border-t border-(--ms-border) bg-(--ms-bg-surface) select-text"
          >
            {panelContent}
          </motion.aside>
        )}
      </AnimatePresence>
    )
  }

  if (!isChatOpen) return null

  // Docked rail: a flex sibling of the canvas, so the slide is never covered and the
  // canvas rescales into the remaining space. It takes the inspector's slot (see editor-shell).
  return (
    <aside
      id="tour-ai-chat-panel"
      aria-label="Copilot"
      style={{ width: chatPanelWidth }}
      className={`relative z-10 flex h-full shrink-0 flex-col border-l border-(--ms-border) bg-(--ms-bg-surface) select-text ${
        isResizing ? 'select-none' : ''
      }`}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize Copilot panel"
        aria-valuemin={CHAT_PANEL_MIN_WIDTH}
        aria-valuemax={CHAT_PANEL_MAX_WIDTH}
        aria-valuenow={chatPanelWidth}
        tabIndex={0}
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerEnd}
        onPointerCancel={handleResizePointerEnd}
        onKeyDown={handleResizeKeyDown}
        onDoubleClick={handleResizeReset}
        className="group/resize ms-focus-ring absolute inset-y-0 -left-1 z-20 w-2 cursor-col-resize touch-none"
      >
        <span
          className={`absolute inset-y-0 left-[3px] w-px transition-colors duration-150 ${
            isResizing ? 'bg-(--ms-accent)' : 'bg-transparent delay-150 group-hover/resize:bg-(--ms-accent)/70'
          }`}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="flex h-full min-h-0 flex-col"
      >
        {panelContent}
      </motion.div>
    </aside>
  )
}
