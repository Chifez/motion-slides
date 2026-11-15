import { useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'
import { getSubOperations, getToolMeta } from './agent-tool-meta'
import { formatWorkedDuration, useElapsedSeconds } from './use-elapsed-seconds'

/**
 * AgentActivity — one collapsible timeline per run of consecutive tool calls / reasoning.
 *
 * Design intent
 *  - Quiet by default: a single 28px row replaces N stacked cards. Detail is one click away.
 *  - Open while the agent works (so progress is legible), folds away once it is done.
 *    A manual toggle always wins (`userOpen`), and the open state is derived, not synced.
 *  - Colour is status only: emerald = the run finished, rose = a step failed. Every
 *    in-flight / idle glyph is neutral, so colour never competes with the slide canvas.
 */

export type ActivityItem =
  | { kind: 'tool'; key: string; toolPart: Record<string, unknown> }
  | { kind: 'reasoning'; key: string; text: string; streaming: boolean }

type StepStatus = 'running' | 'awaiting' | 'done' | 'error' | 'stopped'
type GroupPhase = 'running' | 'awaiting' | 'stopped' | 'done'

interface PendingApproval {
  toolName: string
  args: any
}

interface Props {
  items: ActivityItem[]
  /** True only for the last assistant message while the chat is generating. */
  isStreaming: boolean
  /** Saved wall-clock duration in seconds for this turn once completed. */
  durationSeconds?: number
  /** Timestamp (ms) when the user submitted the turn. */
  turnStartedAt?: number | null
  pendingApprovals?: Record<string, PendingApproval>
  onApproveTool?: (toolCallId: string, approved: boolean) => void
}

const REPORT_TOOLS = ['synthesizeDeckFromDocument', 'generateDiagram', 'auditPresentationQuality']

function getToolStatus(toolPart: Record<string, unknown>, isAwaiting: boolean, isStreaming: boolean): StepStatus {
  if (isAwaiting) return 'awaiting'
  const state = String(toolPart.state ?? '')
  if (state === 'output-error') return 'error'
  if (state === 'output-available') {
    const output = toolPart.output as Record<string, unknown> | undefined
    return output?.success === false ? 'error' : 'done'
  }
  // No result yet: still in flight only if the message is actively streaming.
  // Otherwise the run was stopped (or reloaded mid-flight) and must not spin forever.
  return isStreaming ? 'running' : 'stopped'
}

function describeApproval(toolName: string, args: Record<string, unknown>): string {
  if (toolName === 'deleteSlide') {
    return typeof args.slideIndex === 'number'
      ? `Slide ${args.slideIndex + 1} will be removed from the deck.`
      : 'A slide will be removed from the deck.'
  }
  if (toolName === 'deleteElement') {
    if (typeof args.matchText === 'string' && args.matchText) return `“${args.matchText}” will be removed from the slide.`
    return 'An element will be removed from the slide.'
  }
  return 'Copilot is asking for permission to continue.'
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export function AgentActivity({
  items,
  isStreaming,
  durationSeconds,
  turnStartedAt,
  pendingApprovals,
  onApproveTool,
}: Props) {
  const [userOpen, setUserOpen] = useState<boolean | null>(null)

  const rows = items.map((item) => {
    let status: StepStatus
    if (item.kind === 'reasoning') {
      status = item.streaming && isStreaming ? 'running' : 'done'
    } else {
      const toolCallId = String(item.toolPart.toolCallId ?? '')
      status = getToolStatus(item.toolPart, Boolean(pendingApprovals?.[toolCallId]), isStreaming)
    }
    return { item, status }
  })

  const runningRow = [...rows].reverse().find((row) => row.status === 'running')
  const lastToolRow = [...rows].reverse().find((row) => row.item.kind === 'tool')
  const toolRows = rows.filter((row) => row.item.kind === 'tool')
  const failedCount = rows.filter((row) => row.status === 'error').length

  // Never transition to 'done' ("Worked for ...") while the assistant turn is still streaming/working.
  const phase: GroupPhase = rows.some((row) => row.status === 'awaiting')
    ? 'awaiting'
    : isStreaming || runningRow
      ? 'running'
      : rows.some((row) => row.status === 'stopped')
        ? 'stopped'
        : 'done'

  const isOpen = userOpen ?? (phase === 'running' || phase === 'awaiting')
  const liveSeconds = useElapsedSeconds(phase === 'running', turnStartedAt)
  const completedSeconds = durationSeconds ?? (liveSeconds > 0 ? liveSeconds : Math.max(1, items.length * 2))

  let runningLabel = 'Thinking'
  const activeToolSource = runningRow?.item.kind === 'tool' ? runningRow : lastToolRow
  if (activeToolSource?.item.kind === 'tool') {
    runningLabel = getToolMeta(
      String(activeToolSource.item.toolPart.toolName ?? String(activeToolSource.item.toolPart.type ?? '').replace(/^tool-/, '')),
    ).activeLabel
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setUserOpen(!isOpen)}
        aria-expanded={isOpen}
        className="ms-focus-ring group/header -ml-1.5 inline-flex h-7 max-w-full cursor-pointer items-center gap-2 rounded-md border-none bg-transparent px-1.5 text-xs text-(--ms-text-secondary) transition-colors duration-150 hover:bg-(--ms-bg-elevated) hover:text-(--ms-text-primary)"
      >
        {(phase !== 'done' || toolRows.length > 0) && (
          <span className="flex size-3.5 shrink-0 items-center justify-center">
            {phase === 'running' && (
              <img src="/logo.png" alt="" className="h-3.5 w-auto shrink-0 select-none" />
            )}
            {phase === 'awaiting' && <span className="size-2 rounded-full border border-(--ms-text-secondary)" />}
            {phase === 'stopped' && <span className="size-1.5 rounded-full bg-(--ms-text-muted)" />}
            {phase === 'done' && toolRows.length > 0 && <Check size={12} strokeWidth={2.5} className="text-emerald-500" />}
          </span>
        )}

        <span className="min-w-0 truncate">
          {phase === 'running' && <span className="ms-shimmer-text">{runningLabel}</span>}
          {phase === 'awaiting' && <span className="text-(--ms-text-primary)">Waiting for your approval</span>}
          {phase === 'stopped' && <span>Stopped</span>}
          {phase === 'done' && (
            <span>
              Worked for {formatWorkedDuration(completedSeconds)}
              {failedCount > 0 && <span className="text-rose-400"> · {failedCount} failed</span>}
            </span>
          )}
        </span>

        {phase === 'running' && liveSeconds >= 1 && (
          <span className="shrink-0 text-[11px] tabular-nums text-(--ms-text-muted)">{liveSeconds}s</span>
        )}

        <ChevronRight
          size={12}
          className={`shrink-0 text-(--ms-text-muted) transition-transform duration-150 ease-(--ms-ease-out) ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-(--ms-ease-out) ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
        inert={!isOpen}
      >
        <div className="min-h-0 overflow-hidden">
          <ol className="relative mt-[10px] mb-[4px] flex flex-col gap-[10px] py-[6px] before:absolute before:top-2 before:bottom-2 before:left-[6.5px] before:w-px before:bg-(--ms-border-strong) before:content-['']">
            {rows.map(({ item, status }) => (
              <li key={item.key}>
                {item.kind === 'tool' ? (
                  <ToolStep
                    toolPart={item.toolPart}
                    status={status}
                    pendingApproval={pendingApprovals?.[String(item.toolPart.toolCallId ?? '')]}
                    onApprove={(approved) => onApproveTool?.(String(item.toolPart.toolCallId ?? ''), approved)}
                  />
                ) : (
                  <ReasoningStep text={item.text} status={status} />
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

// ── Steps ──────────────────────────────────────────────────────────

function StepGlyph({ status }: { status: StepStatus }) {
  // The solid background masks the timeline hairline running behind the indicator.
  return (
    <span className="relative z-10 flex size-3.5 shrink-0 items-center justify-center bg-(--ms-bg-surface)">
      {status === 'running' ? (
        <img src="/logo.png" alt="" className="h-3 w-auto shrink-0 select-none" />
      ) : status === 'error' ? (
        <span className="size-1.5 rounded-full bg-rose-400" />
      ) : (
        <span className="size-1.5 rounded-full bg-(--ms-border-strong)" />
      )}
    </span>
  )
}

interface ToolStepProps {
  toolPart: Record<string, unknown>
  status: StepStatus
  pendingApproval?: PendingApproval
  onApprove: (approved: boolean) => void
}

function ToolStep({ toolPart, status, pendingApproval, onApprove }: ToolStepProps) {
  const [showDetails, setShowDetails] = useState(false)

  const type = String(toolPart.type ?? '')
  const toolName = String(toolPart.toolName ?? type.replace(/^tool-/, ''))
  const meta = getToolMeta(toolName)

  const output = status === 'done' || status === 'error' ? (toolPart.output as Record<string, unknown> | undefined) : undefined
  const input = (toolPart.input ?? toolPart.args ?? {}) as Record<string, unknown>
  const details = status === 'done' ? getSubOperations(toolName, input, output) : []

  const label =
    status === 'done' ? meta.completedLabel : status === 'error' ? `${meta.activeLabel} failed` : meta.activeLabel
  const errorText = status === 'error' ? String(output?.error ?? toolPart.errorText ?? '') : ''

  return (
    <div className="flex items-start gap-2.5">
      <StepGlyph status={status} />

      <div className="min-w-0 flex-1">
        <div className="flex min-h-3.5 items-center justify-between gap-2">
          <span
            className={`truncate text-xs leading-3.5 ${
              status === 'running' || status === 'awaiting' ? 'text-(--ms-text-primary)' : 'text-(--ms-text-secondary)'
            }`}
          >
            {label}
          </span>

          <span className="flex shrink-0 items-center gap-2">
            {status === 'done' && REPORT_TOOLS.includes(toolName) && (
              <button
                type="button"
                onClick={() => useEditorStore.getState().openCriticModal()}
                className="ms-focus-ring cursor-pointer rounded border-none bg-transparent px-1 text-[11px] leading-3.5 text-(--ms-accent) hover:underline"
              >
                View report
              </button>
            )}
            {details.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDetails((open) => !open)}
                aria-expanded={showDetails}
                className="ms-focus-ring cursor-pointer rounded border-none bg-transparent px-1 text-[11px] leading-3.5 text-(--ms-text-muted) transition-colors hover:text-(--ms-text-primary)"
              >
                {showDetails ? 'Hide' : pluralize(details.length, 'detail')}
              </button>
            )}
          </span>
        </div>

        {errorText && <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-(--ms-text-muted)">{errorText}</p>}

        {showDetails && details.length > 0 && (
          <ul className="custom-scrollbar mt-1.5 flex max-h-40 flex-col gap-1 overflow-y-auto font-mono text-[11px] leading-4 text-(--ms-text-muted)">
            {details.map((detail, index) => (
              <li key={index} className="truncate" title={detail}>
                {detail}
              </li>
            ))}
          </ul>
        )}

        {pendingApproval && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg border border-(--ms-border-strong) bg-(--ms-bg-elevated) px-2.5 py-2">
            <p className="min-w-0 flex-1 text-xs leading-4 text-(--ms-text-secondary)">
              {describeApproval(pendingApproval.toolName, pendingApproval.args ?? {})}
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => onApprove(false)}
                className="ms-focus-ring h-6 cursor-pointer rounded-md border border-(--ms-border-strong) bg-transparent px-2 text-xs font-medium text-(--ms-text-secondary) transition-[transform,background-color,color] duration-150 hover:bg-(--ms-bg-surface) hover:text-(--ms-text-primary) active:scale-[0.97]"
              >
                Deny
              </button>
              <button
                type="button"
                onClick={() => onApprove(true)}
                className="ms-focus-ring h-6 cursor-pointer rounded-md border-none bg-rose-600 px-2 text-xs font-medium text-white transition-[transform,background-color] duration-150 hover:bg-rose-500 active:scale-[0.97]"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReasoningStep({ text, status }: { text: string; status: StepStatus }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-start gap-2.5">
      <StepGlyph status={status} />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="ms-focus-ring flex min-h-3.5 cursor-pointer items-center gap-1 rounded border-none bg-transparent p-0 text-xs leading-3.5 text-(--ms-text-secondary) transition-colors hover:text-(--ms-text-primary)"
        >
          {status === 'running' ? 'Thinking' : 'Thought'}
          <ChevronRight
            size={11}
            className={`text-(--ms-text-muted) transition-transform duration-150 ease-(--ms-ease-out) ${open ? 'rotate-90' : ''}`}
          />
        </button>
        {open && (
          <p className="custom-scrollbar mt-1.5 max-h-48 overflow-y-auto text-xs leading-4 whitespace-pre-wrap text-(--ms-text-muted)">
            {text}
          </p>
        )}
      </div>
    </div>
  )
}
