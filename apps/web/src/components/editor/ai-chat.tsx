'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditorStore } from '@/store/editorStore'
import { executeAgentTool } from '@/lib/agent/tools'
import { AgentChatHeader } from './ai/AgentChatHeader'
import { AgentInput } from './ai/AgentInput'
import { AgentMessage } from './ai/AgentMessage'
import { AgentWelcome } from './ai/AgentWelcome'
import { Panel } from '@/components/ui/core/Panel'

export function AIChat() {
  const isChatOpen = useEditorStore((s) => s.isChatOpen)
  const setChatOpen = useEditorStore((s) => s.setChatOpen)
  const selectedModel = useEditorStore((s) => s.selectedModel)

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, stop } = useChat({
    onToolCall: async ({ toolCall }) => {
      const tc = toolCall as unknown as { toolName: string; input?: Record<string, unknown>; args?: Record<string, unknown> }
      const toolName = tc.toolName
      const toolArgs = tc.input ?? tc.args ?? {}
      try {
        await executeAgentTool(toolName, toolArgs)
      } catch (err) {
        console.error(`[MotionSlide Agent] Tool "${toolName}" execution failed:`, err)
      }
    },
    onError: (err) => {
      console.error('[MotionSlide Agent] Chat error:', err)
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    const content = text
    setInput('')
    await sendMessage({ text: content })
  }

  // Auto-scroll to latest message
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
                  <AgentMessage key={msg.id} message={msg} />
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
