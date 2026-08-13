'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditorStore } from '@/store/editor-store'
import { executeAgentTool, type AgentToolName } from '@/lib/agent/tools'
import { AgentChatHeader } from './ai/agent-chat-header'
import { AgentInput } from './ai/agent-input'
import { AgentMessage } from './ai/agent-message'
import { AgentWelcome } from './ai/agent-welcome'
import { Panel } from '@/components/ui/core/panel'

export function AIChat() {
  const isChatOpen = useEditorStore((s) => s.isChatOpen)
  const setChatOpen = useEditorStore((s) => s.setChatOpen)
  const selectedModel = useEditorStore((s) => s.selectedModel)

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentSnapshotRef = useRef<string | null>(null)
  const messageSnapshotMap = useRef<Record<string, string>>({})
  const [pendingApprovals, setPendingApprovals] = useState<Record<string, { toolName: string; args: any }>>({})

  const { messages, setMessages, sendMessage, status, stop, addToolOutput } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: async ({ toolCall }) => {
      const tc = toolCall as unknown as { toolCallId: string; toolName: string; args?: any }
      const toolName = tc.toolName
      const toolArgs = tc.args ?? {}
      
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
    onError: (err) => {
      console.error('[MotionSlide Agent] Chat error:', err)
      if (currentSnapshotRef.current) {
        useEditorStore.getState().restoreSnapshot(currentSnapshotRef.current)
        currentSnapshotRef.current = null
      }
    },
  })

  // Track the snapshot that started this assistant message
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role === 'assistant' && currentSnapshotRef.current) {
      if (!messageSnapshotMap.current[lastMsg.id]) {
        messageSnapshotMap.current[lastMsg.id] = currentSnapshotRef.current
      }
    }
  }, [messages])

  const isLoading = status === 'streaming' || status === 'submitted'

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <Panel.Root
      open={isChatOpen}
      onOpenChange={(open) => { if (!open) setChatOpen(false) }}
      side="right"
    >
      <Panel.Portal>
        <Panel.Content width="w-[420px]" containerClassName="top-14 flex flex-col h-[calc(100vh-3.5rem)]">
          <AgentChatHeader onClose={() => setChatOpen(false)} />

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                <AgentWelcome onPrompt={(prompt) => handleSendMessage(prompt)} />
              ) : (
                messages.map((msg) => (
                  <AgentMessage 
                    key={msg.id} 
                    message={msg} 
                    snapshotId={messageSnapshotMap.current[msg.id]}
                    pendingApprovals={pendingApprovals}
                    onApproveTool={handleApprove}
                    onUndo={handleUndo}
                  />
                ))
              )}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-1"
              >
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-widest font-bold">Thinking…</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
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
        </Panel.Content>
      </Panel.Portal>
    </Panel.Root>
  )
}
