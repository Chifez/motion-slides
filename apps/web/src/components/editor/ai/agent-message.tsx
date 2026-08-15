import { useState, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import type { UIMessage } from '@ai-sdk/react'
import {
  Sparkles, User, Check, Loader2, XCircle,
  PlusSquare, Type, Zap, Film, Navigation, Eye, Trash2, Image, WrapText, Undo2,
  ChevronDown, ChevronRight, Palette, PlayCircle, GitBranch, GitMerge,
  ShieldCheck, FileText, Share2, Copy, CheckCheck,
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
  deleteElement:                 { activeLabel: 'Deleting element',                 completedLabel: 'Element deleted',                 icon: Trash2,        color: 'text-rose-400' },
  addShapeElement:               { activeLabel: 'Adding shape',                     completedLabel: 'Shape added',                     icon: PlusSquare,    color: 'text-indigo-400' },
  generateDiagram:               { activeLabel: 'Generating architecture diagram',  completedLabel: 'Architecture diagram generated',  icon: Zap,           color: 'text-blue-400' },
  patchDiagram:                  { activeLabel: 'Patching diagram layout',          completedLabel: 'Diagram layout patched',          icon: Zap,           color: 'text-blue-400' },
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
  deleteSlide:                   { activeLabel: 'Deleting slide',                   completedLabel: 'Slide deleted',                   icon: Trash2,        color: 'text-rose-400' },
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
          ops.push(`Boundary section: "${sec.label || sec.id}"`)
        })
      }
      if (Array.isArray(args.nodes)) {
        args.nodes.forEach((node: any) => {
          ops.push(`Node: "${node.label || node.id}" (${node.shapeType || 'box'})`)
        })
      }
      if (Array.isArray(args.edges)) {
        args.edges.forEach((edge: any) => {
          ops.push(`Connector: ${edge.from} ➔ ${edge.to}${edge.label ? ` ("${edge.label}")` : ''}`)
        })
      }
      if (res.data?.placedShapes) {
        ops.push(`Auto-centered ${res.data.placedShapes} nodes & ${res.data.placedLines || 0} lines`)
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
          ops.push(`Inserted node: "${node.label || node.id}" (${node.shapeType || 'box'})`)
        })
      }
      if (Array.isArray(args.removeNodeIds)) {
        args.removeNodeIds.forEach((id: string) => {
          ops.push(`Removed node: "${id}"`)
        })
      }
      if (Array.isArray(args.addEdges)) {
        args.addEdges.forEach((edge: any) => {
          ops.push(`Routed connector: ${edge.from} ➔ ${edge.to}`)
        })
      }
      break
    }
    case 'choreographFlow': {
      if (Array.isArray(args.flowSequence)) {
        ops.push(`Causal sequence: ${args.flowSequence.join(' ➔ ')}`)
        ops.push(`Staggered entrance delays (${args.stepDelay || 0.4}s) and line draws`)
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
    color: 'text-blue-400',
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
    <div className="flex flex-col gap-1 px-2.5 py-1.5 rounded-lg bg-(--ms-bg-base) border border-(--ms-border) text-xs transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon size={12} className={`shrink-0 ${meta.color}`} />
          <span className="text-(--ms-text-secondary) font-medium text-[11.5px] truncate">
            {labelText}
          </span>
        </div>

        {pendingApproval && onApprove ? (
          <div className="flex gap-1.5 shrink-0">
            <button 
              type="button"
              onClick={() => onApprove(false)} 
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border-none cursor-pointer active:scale-[0.97] transition-all"
            >
              Deny
            </button>
            <button 
              type="button"
              onClick={() => onApprove(true)} 
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-600 text-white hover:bg-blue-500 border-none cursor-pointer active:scale-[0.97] transition-all"
            >
              Approve
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            {!hasResult && (
              <Loader2 size={11} className="text-blue-400 animate-spin" />
            )}
            {isSuccess && (
              <Check size={12} className="text-emerald-400" />
            )}
            {isError && (
              <span className="flex items-center gap-1 text-red-400 text-[10px]">
                <XCircle size={11} />
                <span className="truncate max-w-[120px]">{String(res?.error ?? toolPart.errorText ?? 'Failed')}</span>
              </span>
            )}

            {subOperations.length > 0 && (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="text-(--ms-text-muted) hover:text-(--ms-text-primary) p-0.5 rounded hover:bg-(--ms-bg-surface) bg-transparent border-none cursor-pointer transition-colors"
                title={isExpanded ? 'Collapse steps' : 'Expand steps'}
              >
                {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sub-Operations & Inner Steps Breakdown */}
      {subOperations.length > 0 && isExpanded && (
        <div className="mt-0.5 pt-1 border-t border-(--ms-border)/60 space-y-0.5">
          {subOperations.map((op, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-(--ms-text-muted) pl-1">
              <span className="w-1 h-1 rounded-full bg-blue-400/60 shrink-0" />
              <span className="truncate">{op}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Message Component ─────────────────────────────────────────

interface Props {
  message: UIMessage
  isLastAssistantMessage?: boolean
  snapshotId?: string
  pendingApprovals?: Record<string, { toolName: string; args: any }>
  onApproveTool?: (toolCallId: string, approved: boolean) => void
  onUndo?: (messageId: string, snapshotId: string) => void
}

export const AgentMessage = memo(function AgentMessage({
  message,
  isLastAssistantMessage,
  snapshotId,
  pendingApprovals,
  onApproveTool,
  onUndo,
}: Props) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const parts = message.parts ?? []
  
  const groupedParts: Array<
    | { type: 'text'; text: string }
    | { type: 'tool'; toolPart: Record<string, unknown> }
  > = []

  let fullAssistantText = ''
  let currentText = ''
  for (const p of parts) {
    if (p.type === 'text') {
      currentText += p.text
      fullAssistantText += p.text
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

  const handleCopy = async () => {
    if (!fullAssistantText) return
    try {
      await navigator.clipboard.writeText(fullAssistantText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <div className={`group relative flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
        }`}
      >
        {isUser ? (
          <User size={12} />
        ) : (
          <Sparkles size={12} />
        )}
      </div>

      {/* Content bubble */}
      <div className={`flex flex-col gap-1.5 max-w-[88%] ${isUser ? 'items-end' : 'items-start w-full'}`}>
        {isUser ? (
          <div className="px-3.5 py-2.5 rounded-2xl bg-blue-600 text-white rounded-tr-sm text-xs leading-relaxed shadow-sm">
            {groupedParts.filter(p => p.type === 'text').map(p => p.text).join('')}
          </div>
        ) : (
          <div className="w-full space-y-1.5">
            {groupedParts.map((part, index) => {
              if (part.type === 'text') {
                return (
                  <div
                    key={index}
                    className="px-3.5 py-2.5 rounded-2xl bg-(--ms-bg-elevated) border border-(--ms-border) text-(--ms-text-primary) rounded-tl-sm text-xs leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_strong]:font-semibold [&_em]:italic transition-colors"
                  >
                    <ReactMarkdown
                      components={{
                        code: ({ children }) => (
                          <code className="bg-(--ms-bg-base) border border-(--ms-border) px-1 py-0.5 rounded text-[11px] font-mono text-blue-400">
                            {children}
                          </code>
                        ),
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

            {/* Assistant Action Toolbar (Pinned on latest message, hover on older) */}
            {(isLastAssistantMessage || snapshotId || fullAssistantText) && (
              <div
                className={`flex items-center gap-1.5 pt-0.5 transition-opacity duration-150 ${
                  isLastAssistantMessage ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                {fullAssistantText && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-bg-elevated) transition-all duration-150 active:scale-[0.95] bg-transparent border border-transparent hover:border-(--ms-border) cursor-pointer"
                    title="Copy response"
                  >
                    {copied ? (
                      <>
                        <CheckCheck size={11} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}

                {snapshotId && (
                  <button 
                    type="button"
                    onClick={() => {
                      if (onUndo) {
                        onUndo(message.id, snapshotId)
                      } else {
                        useEditorStore.getState().restoreSnapshot(snapshotId)
                      }
                    }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] text-(--ms-text-muted) hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-150 active:scale-[0.95] bg-transparent border border-transparent hover:border-amber-500/20 cursor-pointer"
                    title="Revert slide changes made by this step"
                  >
                    <Undo2 size={11} />
                    <span>Revert</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
