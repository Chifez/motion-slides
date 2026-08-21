'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditorStore } from '@/store/editor-store'
import { executeAgentTool, type AgentToolName } from '@/lib/agent/tools'
import { AgentChatHeader } from './ai/agent-chat-header'
import { AgentInput } from './ai/agent-input'
import { AgentMessage } from './ai/agent-message'
import { AgentWelcome } from './ai/agent-welcome'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentSnapshotRef = useRef<string | null>(null)
  const messageSnapshotMap = useRef<Record<string, string>>({})
  const [pendingApprovals, setPendingApprovals] = useState<Record<string, { toolName: string; args: any }>>({})

  // Thread management state
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)

  const { messages, setMessages, sendMessage, status, stop, addToolOutput } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: async ({ toolCall }) => {
      const tc = toolCall as unknown as { toolCallId: string; toolName: string; args?: any; input?: any }
      const toolName = tc.toolName
      const toolArgs = tc.input ?? tc.args ?? {}
      
      if (['deleteSlide', 'deleteElement'].includes(toolName)) {
        setPendingApprovals((prev) => ({ ...prev, [tc.toolCallId]: { toolName, args: toolArgs } }))
        return
      }
      
      try {
        const res = await executeAgentTool(toolName as AgentToolName, toolArgs)
        addToolOutput({ toolCallId: tc.toolCallId, tool: toolName, output: res })
      } catch (err) {
        addToolOutput({ toolCallId: tc.toolCallId, tool: toolName, state: 'output-error', errorText: String(err) })
      }
    },
    onFinish: ({ message, messages: allMsgs }) => {
      const targetMsgs = allMsgs || messages
      const finalMsgs = message && !targetMsgs.some(m => m.id === message.id)
        ? [...targetMsgs, message]
        : targetMsgs
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
      } else {
        const fresh = await createNewThread(activeProjectId)
        if (!isMounted) return
        setThreads([fresh])
        setActiveThreadId(fresh.id)
        setMessages([])
        messageSnapshotMap.current = {}
      }
    }

    loadThreads()

    return () => {
      isMounted = false
    }
  }, [activeProjectId, setMessages])

  // Track the snapshot that started this assistant message
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role === 'assistant' && currentSnapshotRef.current) {
      if (!messageSnapshotMap.current[lastMsg.id]) {
        messageSnapshotMap.current[lastMsg.id] = currentSnapshotRef.current
      }
    }
  }, [messages])

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
    }

    await saveThread(updatedThread)

    setThreads((prev) =>
      prev.map((t) => (t.id === activeThreadId ? updatedThread : t))
    )
  }, [activeProjectId, activeThreadId, messages, threads])

  const isLoading = status === 'streaming' || status === 'submitted'

  // Thread Switcher Handlers
  const handleSelectThread = useCallback(async (threadId: string) => {
    const target = threads.find((t) => t.id === threadId)
    if (!target) return
    setActiveThreadId(target.id)
    setMessages(target.messages)
    messageSnapshotMap.current = target.messageSnapshotMap || {}
  }, [threads, setMessages])

  const handleNewThread = useCallback(async () => {
    if (!activeProjectId) return
    const fresh = await createNewThread(activeProjectId)
    setThreads((prev) => [fresh, ...prev])
    setActiveThreadId(fresh.id)
    setMessages([])
    messageSnapshotMap.current = {}
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
      } else {
        const fresh = await createNewThread(activeProjectId)
        setThreads([fresh])
        setActiveThreadId(fresh.id)
        setMessages([])
        messageSnapshotMap.current = {}
      }
    }
  }, [activeProjectId, activeThreadId, threads, setMessages])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    const content = text
    setInput('')
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
  const isAutoScrollEnabled = useRef(true)

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    isAutoScrollEnabled.current = scrollHeight - scrollTop - clientHeight < 80
  }

  useEffect(() => {
    if (!scrollContainerRef.current || !isAutoScrollEnabled.current) return
    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
  }, [messages, status])

  // Find index of the latest assistant message to pin its action bar
  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf('assistant')

  return (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-16 right-3 bottom-3 w-[400px] z-50 bg-(--ms-bg-surface) border border-(--ms-border) shadow-2xl rounded-2xl flex flex-col overflow-hidden select-text transition-colors"
        >
          {/* Header */}
          <AgentChatHeader
            onClose={() => setChatOpen(false)}
            threads={threads}
            activeThreadId={activeThreadId}
            onSelectThread={handleSelectThread}
            onNewThread={handleNewThread}
            onDeleteThread={handleDeleteThread}
          />

          {/* Message Thread */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 custom-scrollbar flex flex-col"
          >
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center my-auto min-h-0">
                <AgentWelcome onPrompt={(prompt) => handleSendMessage(prompt)} />
              </div>
            ) : (
              messages.map((msg, idx) => (
                <AgentMessage 
                  key={msg.id} 
                  message={msg}
                  isLastAssistantMessage={idx === lastAssistantIndex}
                  snapshotId={messageSnapshotMap.current[msg.id]}
                  pendingApprovals={pendingApprovals}
                  onApproveTool={handleApprove}
                  onUndo={handleUndo}
                />
              ))
            )}

            {isLoading && (
              <div className="flex items-center gap-2 px-1 py-1">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse [animation-delay:300ms]" />
                </div>
                <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-widest font-semibold">Generating…</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Capsule */}
          <AgentInput
            input={input}
            isLoading={isLoading}
            selectedModel={selectedModel}
            onInputChange={(e) => setInput(e.target.value)}
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage(input)
            }}
            onStop={stop}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
