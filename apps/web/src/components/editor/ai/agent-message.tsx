import { motion } from 'framer-motion'
import type { UIMessage } from '@ai-sdk/react'
import {
  BotMessageSquare, User, CheckCircle2, Loader2, XCircle,
  PlusSquare, Type, Zap, Film, Navigation, Eye, Trash2, Image, WrapText,
} from 'lucide-react'

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

function ToolCallCard({ toolPart }: { toolPart: Record<string, unknown> }) {
  // In AI SDK v6 UIMessage format, tool-invocation parts nest data under `toolInvocation`.
  // Fall back to the flat structure for forward compatibility.
  const invocation = (toolPart.toolInvocation ?? toolPart) as Record<string, unknown>

  const type = String(toolPart.type ?? '')
  const toolName = String(invocation.toolName ?? type.replace(/^tool-/, ''))
  const meta = TOOL_META[toolName] ?? {
    activeLabel: toolName,
    completedLabel: `${toolName} completed`,
    icon: Zap,
    color: 'text-purple-400',
  }
  const Icon = meta.icon

  // State lives on the invocation object in v6
  const state = String(invocation.state ?? '')
  const hasResult = state === 'result'

  // Result can be at invocation.result or invocation.output (older shape)
  const res = hasResult
    ? ((invocation.result ?? invocation.output) as Record<string, unknown> | undefined)
    : undefined

  const isSuccess = hasResult && res?.success !== false
  const isError = hasResult && res?.success === false

  const labelText = isError
    ? `${meta.activeLabel} failed`
    : hasResult
    ? meta.completedLabel
    : meta.activeLabel

  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-(--ms-bg-base) border border-(--ms-border) text-xs"
    >
      <Icon size={13} className={meta.color} />
      <span className="text-(--ms-text-secondary) font-medium flex-1">
        {labelText}
      </span>

      {!hasResult && (
        <Loader2 size={13} className="text-purple-400 animate-spin shrink-0" />
      )}
      {isSuccess && (
        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
      )}
      {isError && (
        <span className="flex items-center gap-1 text-red-400 shrink-0">
          <XCircle size={13} />
          <span className="text-[10px]">{String(res?.error ?? '')}</span>
        </span>
      )}
    </motion.div>
  )
}

// ── Main Message Component ─────────────────────────────────────────

interface Props {
  message: UIMessage
}

export function AgentMessage({ message }: Props) {
  const isUser = message.role === 'user'

  const parts = message.parts ?? []
  
  const textContent = parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')

  const toolParts = parts.filter(
    (p) => typeof p.type === 'string' && (p.type.startsWith('tool-') || p.type === 'tool-invocation')
  ) as Array<Record<string, unknown>>

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
      <div className={`flex flex-col gap-2 max-w-[88%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Tool call visualizations */}
        {!isUser && toolParts.length > 0 && (
          <div className="w-full space-y-1.5">
            {toolParts.map((toolPart, i) => (
              <ToolCallCard key={i} toolPart={toolPart} />
            ))}
          </div>
        )}

        {/* Text content */}
        {textContent && (
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-(--ms-bg-elevated) text-(--ms-text-primary) border border-(--ms-border) rounded-tl-sm'
            }`}
          >
            {textContent}
          </div>
        )}
      </div>
    </motion.div>
  )
}
