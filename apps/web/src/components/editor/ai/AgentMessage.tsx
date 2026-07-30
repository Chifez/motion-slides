import { motion } from 'framer-motion'
import type { UIMessage } from '@ai-sdk/react'
import {
  BotMessageSquare, User, CheckCircle2, Loader2, XCircle,
  PlusSquare, Type, Zap, Film, Navigation, Eye, Trash2, Image, WrapText,
} from 'lucide-react'

// ── Tool metadata for display ─────────────────────────────────────

interface ToolMeta {
  label: string
  icon: React.ElementType
  color: string
}

const TOOL_META: Record<string, ToolMeta> = {
  addSlide:            { label: 'Adding slide',           icon: PlusSquare,  color: 'text-blue-400' },
  addTextElement:      { label: 'Adding text',            icon: Type,        color: 'text-sky-400' },
  updateElementText:   { label: 'Updating text',          icon: WrapText,    color: 'text-cyan-400' },
  applyAnimation:      { label: 'Applying animation',     icon: Zap,         color: 'text-purple-400' },
  applyAnimationToAll: { label: 'Animating all elements', icon: Zap,         color: 'text-purple-400' },
  setTransition:       { label: 'Setting transition',     icon: Film,        color: 'text-pink-400' },
  goToSlide:           { label: 'Navigating to slide',    icon: Navigation,  color: 'text-orange-400' },
  getProjectContext:   { label: 'Reading project',        icon: Eye,         color: 'text-emerald-400' },
  setSlideBackground:  { label: 'Changing background',    icon: Image,       color: 'text-teal-400' },
  deleteSlide:         { label: 'Deleting slide',         icon: Trash2,      color: 'text-red-400' },
}

// ── Tool call card ────────────────────────────────────────────────

function ToolCallCard({ toolName, result }: {
  toolName: string
  result?: unknown
}) {
  const meta = TOOL_META[toolName] ?? { label: toolName, icon: Zap, color: 'text-gray-400' }
  const Icon = meta.icon
  const hasResult = result !== undefined
  const isSuccess = hasResult && (result as Record<string, unknown>)?.success !== false
  const isError = hasResult && (result as Record<string, unknown>)?.success === false

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-(--ms-bg-base) border border-(--ms-border) text-xs"
    >
      <Icon size={13} className={meta.color} />
      <span className="text-(--ms-text-secondary) font-medium flex-1">{meta.label}</span>

      {!hasResult && <Loader2 size={12} className="text-purple-400 animate-spin" />}
      {isSuccess && <CheckCircle2 size={12} className="text-emerald-400" />}
      {isError && (
        <span className="flex items-center gap-1 text-red-400">
          <XCircle size={12} />
          <span className="text-[10px]">{String((result as Record<string, unknown>)?.error ?? '')}</span>
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
    (p) => typeof p.type === 'string' && p.type.startsWith('tool-')
  ) as Array<{ type: string; toolName?: string; result?: unknown }>

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
            {toolParts.map((toolPart, i) => {
              const name = toolPart.toolName ?? toolPart.type.replace(/^tool-/, '')
              return <ToolCallCard key={i} toolName={name} result={toolPart.result} />
            })}
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
