import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import type { UIMessage } from '@ai-sdk/react'
import {
  BotMessageSquare, User, CheckCircle2, Loader2, XCircle,
  PlusSquare, Type, Zap, Film, Navigation, Eye, Trash2, Image, WrapText, Undo2,
} from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'

// ── Tool metadata for display ─────────────────────────────────────

interface ToolMeta {
  activeLabel: string
  completedLabel: string
  icon: React.ElementType
  color: string
}

const TOOL_META: Record<string, ToolMeta> = {
  addSlide:            { activeLabel: 'Adding slide',           completedLabel: 'Slide added',             icon: PlusSquare,  color: 'text-blue-400' },
  addTextElement:      { activeLabel: 'Adding text element',    completedLabel: 'Text element added',      icon: Type,        color: 'text-sky-400' },
  updateElementText:   { activeLabel: 'Updating text',          completedLabel: 'Text updated',            icon: WrapText,    color: 'text-cyan-400' },
  deleteElement:       { activeLabel: 'Deleting element',       completedLabel: 'Element deleted',         icon: Trash2,      color: 'text-red-400' },
  addShapeElement:     { activeLabel: 'Adding shape',           completedLabel: 'Shape added',             icon: PlusSquare,  color: 'text-indigo-400' },
  generateDiagram:     { activeLabel: 'Generating layout',      completedLabel: 'Diagram generated',       icon: Zap,         color: 'text-indigo-400' },
  addSectionElement:   { activeLabel: 'Adding section',         completedLabel: 'Section added',           icon: PlusSquare,  color: 'text-violet-400' },
  addLineElement:      { activeLabel: 'Adding connecting line', completedLabel: 'Connecting line added',  icon: Zap,         color: 'text-amber-400' },
  applyAnimation:      { activeLabel: 'Applying animation',     completedLabel: 'Animation applied',       icon: Zap,         color: 'text-purple-400' },
  applyAnimationToAll: { activeLabel: 'Animating elements',    completedLabel: 'All elements animated',   icon: Zap,         color: 'text-purple-400' },
  setTransition:       { activeLabel: 'Setting transition',     completedLabel: 'Transition set',          icon: Film,        color: 'text-pink-400' },
  goToSlide:           { activeLabel: 'Navigating to slide',    completedLabel: 'Navigated to slide',      icon: Navigation,  color: 'text-orange-400' },
  getProjectContext:   { activeLabel: 'Reading project',        completedLabel: 'Project read completed',  icon: Eye,         color: 'text-emerald-400' },
  setSlideBackground:  { activeLabel: 'Changing background',    completedLabel: 'Background updated',      icon: Image,       color: 'text-teal-400' },
  deleteSlide:         { activeLabel: 'Deleting slide',         completedLabel: 'Slide deleted',           icon: Trash2,      color: 'text-red-400' },
}

// ── Tool call card ────────────────────────────────────────────────

interface ToolCallCardProps {
  toolPart: Record<string, unknown>
  pendingApproval?: { toolName: string; args: any }
  onApprove?: (approved: boolean) => void
}

function ToolCallCard({ toolPart, pendingApproval, onApprove }: ToolCallCardProps) {
  const type = String(toolPart.type ?? '')
  const toolName = String(toolPart.toolName ?? type.replace(/^tool-/, ''))
  
  const meta = TOOL_META[toolName] ?? {
    activeLabel: toolName,
    completedLabel: `${toolName} completed`,
    icon: Zap,
    color: 'text-purple-400',
  }
  const Icon = meta.icon

  const state = String(toolPart.state ?? '')
  const hasResult = state === 'output-available'
  const isSdkOutputError = state === 'output-error'

  const res = hasResult
    ? (toolPart.output as Record<string, unknown> | undefined)
    : undefined

  const isLogicalError = hasResult && res?.success === false
  const isError = isSdkOutputError || isLogicalError
  const isSuccess = hasResult && !isError

  const labelText = pendingApproval 
    ? `Approve ${meta.activeLabel.toLowerCase()}?`
    : isError
    ? `${meta.activeLabel} failed`
    : hasResult
    ? meta.completedLabel
    : meta.activeLabel

  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex flex-col gap-2 px-3 py-2 rounded-lg bg-(--ms-bg-base) border border-(--ms-border) text-xs"
    >
      <div className="flex items-center gap-2.5">
        <Icon size={13} className={meta.color} />
        <span className="text-(--ms-text-secondary) font-medium flex-1">
          {labelText}
        </span>

        {pendingApproval && onApprove ? (
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => onApprove(false)} 
              className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border-none cursor-pointer"
            >
              No
            </button>
            <button 
              onClick={() => onApprove(true)} 
              className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-none cursor-pointer"
            >
              Yes
            </button>
          </div>
        ) : (
          <>
            {!hasResult && (
              <Loader2 size={13} className="text-purple-400 animate-spin shrink-0" />
            )}
            {isSuccess && (
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            )}
            {isError && (
              <span className="flex items-center gap-1 text-red-400 shrink-0">
                <XCircle size={13} />
                <span className="text-[10px] truncate max-w-[150px]">{String(res?.error ?? toolPart.errorText ?? '')}</span>
              </span>
            )}
          </>
        )}
      </div>
      
      {pendingApproval && (
        <div className="text-[10px] text-(--ms-text-muted) break-all">
          Args: {JSON.stringify(pendingApproval.args)}
        </div>
      )}
    </motion.div>
  )
}

// ── Main Message Component ─────────────────────────────────────────

interface Props {
  message: UIMessage
  snapshotId?: string
  pendingApprovals?: Record<string, { toolName: string; args: any }>
  onApproveTool?: (toolCallId: string, approved: boolean) => void
  onUndo?: (messageId: string, snapshotId: string) => void
}

export function AgentMessage({ message, snapshotId, pendingApprovals, onApproveTool, onUndo }: Props) {
  const isUser = message.role === 'user'

  const parts = message.parts ?? []
  
  const groupedParts: Array<
    | { type: 'text'; text: string }
    | { type: 'tool'; toolPart: Record<string, unknown> }
  > = []

  let currentText = ''
  for (const p of parts) {
    if (p.type === 'text') {
      currentText += p.text
    } else if (typeof p.type === 'string' && (p.type.startsWith('tool-') || p.type === 'tool-invocation')) {
      if (currentText.trim()) {
        groupedParts.push({ type: 'text', text: currentText })
        currentText = ''
      }
      groupedParts.push({ type: 'tool', toolPart: p as Record<string, unknown> })
    }
  }
  if (currentText.trim()) {
    groupedParts.push({ type: 'text', text: currentText })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
          isUser
            ? 'bg-blue-600/20 border border-blue-500/30'
            : 'bg-purple-600/20 border border-purple-500/20'
        }`}
      >
        {isUser ? (
          <User size={13} className="text-blue-300" />
        ) : (
          <BotMessageSquare size={13} className="text-purple-300" />
        )}
      </div>

      {/* Content bubble */}
      <div className={`flex flex-col gap-2 max-w-[88%] ${isUser ? 'items-end' : 'items-start w-full'}`}>
        {isUser ? (
          <div className="px-4 py-3 rounded-2xl bg-blue-600 text-white rounded-tr-sm whitespace-pre-wrap text-sm leading-relaxed">
            {groupedParts.filter(p => p.type === 'text').map(p => p.text).join('')}
          </div>
        ) : (
          <div className="w-full space-y-2">
            {groupedParts.map((part, index) => {
              if (part.type === 'text') {
                return (
                  <div
                    key={index}
                    className="px-4 py-3 rounded-2xl bg-(--ms-bg-elevated) text-(--ms-text-primary) border border-(--ms-border) rounded-tl-sm text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:font-semibold [&_em]:italic"
                  >
                    <ReactMarkdown
                      components={{
                        code: ({ children }) => <code className="bg-zinc-800/80 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                      }}
                    >
                      {part.text}
                    </ReactMarkdown>
                  </div>
                )
              } else {
                const toolCallId = String(part.toolPart.toolCallId ?? '')
                return (
                  <ToolCallCard 
                    key={index} 
                    toolPart={part.toolPart} 
                    pendingApproval={pendingApprovals?.[toolCallId]}
                    onApprove={(approved) => onApproveTool?.(toolCallId, approved)}
                  />
                )
              }
            })}
          </div>
        )}
        
        {/* Inline Undo Button */}
        {!isUser && snapshotId && (
          <button 
            onClick={() => {
              if (onUndo) {
                onUndo(message.id, snapshotId)
              } else {
                useEditorStore.getState().restoreSnapshot(snapshotId)
              }
            }}
            className="flex items-center gap-1 mt-1 text-[11px] text-(--ms-text-muted) hover:text-(--ms-text-primary) transition-colors bg-transparent border-none cursor-pointer"
          >
            <Undo2 size={12} />
            <span>Undo this action</span>
          </button>
        )}
      </div>
    </motion.div>
  )
}
