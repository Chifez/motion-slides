import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import type { UIMessage } from '@ai-sdk/react'
import {
  BotMessageSquare, User, CheckCircle2, Loader2, XCircle,
  PlusSquare, Type, Zap, Film, Navigation, Eye, Trash2, Image, WrapText, Undo2,
  ChevronDown, ChevronRight, Palette, PlayCircle, Sparkles, GitBranch, GitMerge,
  ShieldCheck, FileText, Share2,
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
  addSlide:                      { activeLabel: 'Adding slide',                     completedLabel: 'Slide added',                     icon: PlusSquare,    color: 'text-blue-400' },
  addTextElement:                { activeLabel: 'Adding text element',              completedLabel: 'Text element added',              icon: Type,          color: 'text-sky-400' },
  updateElementText:             { activeLabel: 'Updating text',                    completedLabel: 'Text updated',                    icon: WrapText,      color: 'text-cyan-400' },
  deleteElement:                 { activeLabel: 'Deleting element',                 completedLabel: 'Element deleted',                 icon: Trash2,        color: 'text-red-400' },
  addShapeElement:               { activeLabel: 'Adding shape',                     completedLabel: 'Shape added',                     icon: PlusSquare,    color: 'text-indigo-400' },
  generateDiagram:               { activeLabel: 'Generating architecture diagram',  completedLabel: 'Architecture diagram generated',  icon: Zap,           color: 'text-indigo-400' },
  patchDiagram:                  { activeLabel: 'Patching diagram layout',          completedLabel: 'Diagram layout patched',          icon: Zap,           color: 'text-indigo-400' },
  synthesizeDeckFromDocument:    { activeLabel: 'Synthesizing presentation deck',   completedLabel: 'Presentation deck synthesized',   icon: Film,          color: 'text-purple-400' },
  applyDeckTheme:                { activeLabel: 'Applying deck theme',              completedLabel: 'Deck theme applied',              icon: Palette,       color: 'text-pink-400' },
  harmonizeSlideStyles:          { activeLabel: 'Harmonizing typography',           completedLabel: 'Typography harmonized',           icon: Type,          color: 'text-teal-400' },
  choreographFlow:               { activeLabel: 'Choreographing motion flow',       completedLabel: 'Motion flow choreographed',       icon: PlayCircle,    color: 'text-amber-400' },
  optimizeMagicMove:             { activeLabel: 'Optimizing Magic Move',            completedLabel: 'Magic Move optimized',            icon: Sparkles,      color: 'text-violet-400' },
  setSlideTimingAndTransitions:  { activeLabel: 'Configuring transitions',          completedLabel: 'Transitions configured',          icon: Film,          color: 'text-pink-400' },
  createExploratoryBranch:       { activeLabel: 'Creating Git branch',              completedLabel: 'Git branch created',              icon: GitBranch,     color: 'text-emerald-400' },
  switchBranch:                  { activeLabel: 'Switching Git branch',             completedLabel: 'Switched Git branch',             icon: GitBranch,     color: 'text-emerald-400' },
  listBranches:                  { activeLabel: 'Listing Git branches',             completedLabel: 'Git branches listed',             icon: GitBranch,     color: 'text-emerald-400' },
  agenticMergeReview:            { activeLabel: 'Reviewing branch diff',            completedLabel: 'Merge review completed',          icon: GitMerge,      color: 'text-blue-400' },
  auditPresentationQuality:      { activeLabel: 'Auditing presentation quality',    completedLabel: 'Quality audit completed',         icon: ShieldCheck,   color: 'text-emerald-400' },
  generateSpeakerNotes:          { activeLabel: 'Writing speaker notes',            completedLabel: 'Speaker notes generated',         icon: FileText,      color: 'text-sky-400' },
  startPresentationMode:         { activeLabel: 'Launching presentation mode',      completedLabel: 'Presentation mode launched',      icon: PlayCircle,    color: 'text-orange-400' },
  exportPresentation:            { activeLabel: 'Preparing deck export',            completedLabel: 'Deck export prepared',            icon: Share2,        color: 'text-amber-400' },
  addSectionElement:             { activeLabel: 'Adding container section',         completedLabel: 'Container section added',         icon: PlusSquare,    color: 'text-violet-400' },
  addLineElement:                { activeLabel: 'Adding connecting line',           completedLabel: 'Connecting line added',           icon: Zap,           color: 'text-amber-400' },
  applyAnimation:                { activeLabel: 'Applying animation',               completedLabel: 'Animation applied',               icon: Zap,           color: 'text-purple-400' },
  applyAnimationToAll:           { activeLabel: 'Animating slide elements',         completedLabel: 'All slide elements animated',     icon: Zap,           color: 'text-purple-400' },
  setTransition:                 { activeLabel: 'Setting transition',               completedLabel: 'Transition set',                  icon: Film,          color: 'text-pink-400' },
  goToSlide:                     { activeLabel: 'Navigating to slide',              completedLabel: 'Navigated to slide',              icon: Navigation,    color: 'text-orange-400' },
  getProjectContext:             { activeLabel: 'Reading project state',            completedLabel: 'Project state read',              icon: Eye,           color: 'text-emerald-400' },
  setSlideBackground:            { activeLabel: 'Updating slide background',        completedLabel: 'Slide background updated',        icon: Image,         color: 'text-teal-400' },
  deleteSlide:                   { activeLabel: 'Deleting slide',                   completedLabel: 'Slide deleted',                   icon: Trash2,        color: 'text-red-400' },
}

// ── Extract Inner Sub-Operations ──────────────────────────────────

function getSubOperations(toolName: string, input: any, output: any): string[] {
  const ops: string[] = []
  const args = input || {}
  const res = output || {}

  switch (toolName) {
    case 'generateDiagram': {
      if (Array.isArray(args.sections) && args.sections.length > 0) {
        args.sections.forEach((sec: any) => {
          ops.push(`Creating boundary section: "${sec.label || sec.id}"`)
        })
      }
      if (Array.isArray(args.nodes)) {
        args.nodes.forEach((node: any) => {
          ops.push(`Placing node: "${node.label || node.id}" (${node.shapeType || 'box'})`)
        })
      }
      if (Array.isArray(args.edges)) {
        args.edges.forEach((edge: any) => {
          ops.push(`Routing connector: ${edge.from} ➔ ${edge.to}${edge.label ? ` ("${edge.label}")` : ''}`)
        })
      }
      if (res.data?.placedShapes) {
        ops.push(`Layout computed: ${res.data.placedShapes} nodes & ${res.data.placedLines || 0} lines centered`)
      }
      break
    }
    case 'synthesizeDeckFromDocument': {
      if (Array.isArray(args.slides)) {
        args.slides.forEach((sl: any, i: number) => {
          ops.push(`Slide ${i + 1}: "${sl.name}" (${(sl.nodes || []).length} nodes, ${(sl.edges || []).length} lines)`)
        })
      }
      if (res.data?.slidesCreated) {
        ops.push(`Compiled ${res.data.slidesCreated} slides with Magic Move transitions`)
      }
      break
    }
    case 'patchDiagram': {
      if (Array.isArray(args.addNodes)) {
        args.addNodes.forEach((node: any) => {
          ops.push(`Adding node: "${node.label || node.id}" (${node.shapeType || 'box'})`)
        })
      }
      if (Array.isArray(args.removeNodeIds)) {
        args.removeNodeIds.forEach((id: string) => {
          ops.push(`Removing node: "${id}"`)
        })
      }
      if (Array.isArray(args.addEdges)) {
        args.addEdges.forEach((edge: any) => {
          ops.push(`Adding connector: ${edge.from} ➔ ${edge.to}`)
        })
      }
      break
    }
    case 'choreographFlow': {
      if (Array.isArray(args.flowSequence)) {
        ops.push(`Causal sequence: ${args.flowSequence.join(' ➔ ')}`)
        ops.push(`Synchronizing entrance delays (${args.stepDelay || 0.4}s) and line draws`)
      }
      break
    }
    case 'optimizeMagicMove': {
      if (res.data?.totalMatchedNodes !== undefined) {
        ops.push(`Matched ${res.data.totalMatchedNodes} shared entities across slides`)
      }
      if (res.data?.totalReconciledNodes) {
        ops.push(`Reconciled ${res.data.totalReconciledNodes} entity IDs for FLIP morphing`)
      }
      break
    }
    case 'applyDeckTheme': {
      if (args.theme) ops.push(`Theme palette: ${args.theme}`)
      if (args.fontFamily) ops.push(`Font family: ${args.fontFamily}`)
      break
    }
    case 'createExploratoryBranch': {
      if (args.branchName) ops.push(`Branch: "${args.branchName}" created and checked out`)
      break
    }
    case 'auditPresentationQuality': {
      if (res.data?.qualityScore !== undefined) {
        ops.push(`Quality Score: ${res.data.qualityScore}/100 | Contrast: ${res.data.contrastViolations || 0} issues | Density: ${res.data.densityWarnings || 0}`)
      }
      break
    }
    case 'generateSpeakerNotes': {
      if (args.style) ops.push(`Generated ${args.style} talking points and presenter cues`)
      break
    }
    default: {
      if (args.label || args.text) {
        ops.push(`Target: "${args.label || args.text}"`)
      }
    }
  }

  return ops
}

// ── Tool call card ────────────────────────────────────────────────

interface ToolCallCardProps {
  toolPart: Record<string, unknown>
  pendingApproval?: { toolName: string; args: any }
  onApprove?: (approved: boolean) => void
}

function ToolCallCard({ toolPart, pendingApproval, onApprove }: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
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

  const toolInput = (toolPart.input ?? toolPart.args ?? {}) as Record<string, unknown>
  const subOperations = getSubOperations(toolName, toolInput, res)

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2 rounded-lg bg-(--ms-bg-base) border border-(--ms-border) text-xs">
      <div className="flex items-center gap-2.5">
        <Icon size={13} className={meta.color} />
        <span className="text-(--ms-text-secondary) font-medium flex-1">
          {labelText}
        </span>

        {pendingApproval && onApprove ? (
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => onApprove(false)} 
              className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border-none cursor-pointer text-xs"
            >
              No
            </button>
            <button 
              onClick={() => onApprove(true)} 
              className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-none cursor-pointer text-xs"
            >
              Yes
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            {!hasResult && (
              <Loader2 size={13} className="text-purple-400 animate-spin" />
            )}
            {isSuccess && (
              <CheckCircle2 size={13} className="text-emerald-400" />
            )}
            {isError && (
              <span className="flex items-center gap-1 text-red-400">
                <XCircle size={13} />
                <span className="text-[10px] truncate max-w-[150px]">{String(res?.error ?? toolPart.errorText ?? '')}</span>
              </span>
            )}

            {subOperations.length > 0 && (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="text-(--ms-text-muted) hover:text-(--ms-text-primary) p-0.5 rounded bg-transparent border-none cursor-pointer"
                title={isExpanded ? 'Collapse sub-steps' : 'Expand sub-steps'}
              >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sub-Operations & Inner Steps Breakdown */}
      {subOperations.length > 0 && isExpanded && (
        <div className="mt-1 pt-1.5 border-t border-(--ms-border)/40 space-y-1">
          {subOperations.map((op, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10.5px] text-(--ms-text-muted) pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400/70 shrink-0" />
              <span className="truncate">{op}</span>
            </div>
          ))}
        </div>
      )}
      
      {pendingApproval && (
        <div className="text-[10px] text-(--ms-text-muted) break-all">
          Args: {JSON.stringify(pendingApproval.args)}
        </div>
      )}
    </div>
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
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
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
            type="button"
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
    </div>
  )
}
