import { useState, memo } from 'react'
import type { UIMessage } from '@ai-sdk/react'
import { Check, Copy, FileText, Undo2 } from 'lucide-react'
import { AgentActivity, type ActivityItem } from './agent-activity'
import { AgentMarkdown } from './agent-markdown'
import { AgentThinking } from './agent-thinking'
import { formatWorkedDuration } from './use-elapsed-seconds'

/**
 * Message placement
 *
 * The rail is narrow (340-560px), so the thread is one left-aligned reading column.
 * Alternating left/right bubbles would waste ~12% of the width and force the eye to
 * zig-zag. Roles are separated by surface instead of by side:
 *   - User:  a quiet elevated surface, 13px, no avatar.
 *   - Agent: no container at all — "Worked for ..." / activity timeline at the top,
 *            then prose directly on the panel.
 */

const ATTACHED_DOCUMENT = /\n*Attached source document\.[^\n]*\n<document name=("(?:[^"\\]|\\.)*") type="[^"]*">[\s\S]*<\/document>\s*$/

/** Splits an injected document block off the user's own words so the thread shows a chip, not 40k characters. */
function splitAttachedDocument(text: string): { prompt: string; fileName: string | null } {
  const match = text.match(ATTACHED_DOCUMENT)
  if (!match) return { prompt: text, fileName: null }
  let fileName = 'document'
  try {
    fileName = JSON.parse(match[1]) as string
  } catch {
    // keep the generic label
  }
  return { prompt: text.slice(0, match.index).trim(), fileName }
}

function parseMessageParts(parts: UIMessage['parts']): {
  activityItems: ActivityItem[]
  textBlocks: Array<{ key: string; text: string }>
  plainText: string
} {
  const activityItems: ActivityItem[] = []
  const textBlocks: Array<{ key: string; text: string }> = []
  let plainText = ''

  parts.forEach((part, index) => {
    const type = String(part.type)

    if (part.type === 'text') {
      plainText += part.text
      if (!part.text.trim()) return
      const lastText = textBlocks[textBlocks.length - 1]
      if (lastText) lastText.text += part.text
      else textBlocks.push({ key: `text-${index}`, text: part.text })
      return
    }

    if (type === 'reasoning') {
      const reasoning = part as unknown as { text?: string; state?: string }
      if (!reasoning.text?.trim()) return
      activityItems.push({
        kind: 'reasoning',
        key: `reasoning-${index}`,
        text: reasoning.text,
        streaming: reasoning.state === 'streaming',
      })
    } else if (type.startsWith('tool-') || type === 'dynamic-tool' || type === 'tool-invocation') {
      activityItems.push({
        kind: 'tool',
        key: `tool-${index}`,
        toolPart: part as unknown as Record<string, unknown>,
      })
    }
  })

  return { activityItems, textBlocks, plainText }
}

interface Props {
  message: UIMessage
  isLastAssistantMessage?: boolean
  /** True while this message is the one being generated. */
  isStreaming?: boolean
  /** Wall-clock duration in seconds for this assistant turn. */
  durationSeconds?: number
  /** Timestamp (ms) when the user submitted the turn. */
  turnStartedAt?: number | null
  snapshotId?: string
  pendingApprovals?: Record<string, { toolName: string; args: any }>
  onApproveTool?: (toolCallId: string, approved: boolean) => void
  onUndo?: (messageId: string, snapshotId: string) => void
}

export const AgentMessage = memo(function AgentMessage({
  message,
  isLastAssistantMessage,
  isStreaming = false,
  durationSeconds,
  turnStartedAt,
  snapshotId,
  pendingApprovals,
  onApproveTool,
  onUndo,
}: Props) {
  const [copied, setCopied] = useState(false)
  const { activityItems, textBlocks, plainText } = parseMessageParts(message.parts ?? [])

  if (message.role === 'user') {
    const { prompt, fileName } = splitAttachedDocument(plainText)
    return (
      <div
        style={{ padding: '14px 16px' }}
        className="flex flex-col gap-2.5 rounded-xl border border-(--ms-border) bg-(--ms-bg-elevated)"
      >
        {fileName && (
          <span className="inline-flex max-w-full items-center gap-1.5 self-start rounded-md border border-(--ms-border) bg-(--ms-bg-surface) px-2 py-1 text-xs leading-4 text-(--ms-text-secondary)">
            <FileText size={12} className="shrink-0 text-(--ms-text-muted)" />
            <span className="truncate">{fileName}</span>
          </span>
        )}
        {prompt && (
          <p className="text-[13px] leading-[22px] tracking-[-0.006em] wrap-break-word whitespace-pre-wrap text-(--ms-text-primary)">
            {prompt}
          </p>
        )}
      </div>
    )
  }

  async function handleCopy() {
    if (!plainText) return
    try {
      await navigator.clipboard.writeText(plainText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const showActions = !isStreaming && (Boolean(plainText) || Boolean(snapshotId))

  return (
    <div style={{ gap: 18 }} className="group/turn flex flex-col">
      {activityItems.length > 0 ? (
        <AgentActivity
          items={activityItems}
          isStreaming={isStreaming}
          durationSeconds={durationSeconds}
          turnStartedAt={turnStartedAt}
          pendingApprovals={pendingApprovals}
          onApproveTool={onApproveTool}
        />
      ) : isStreaming ? (
        <AgentThinking turnStartedAt={turnStartedAt} />
      ) : (
        <div className="flex h-6 items-center text-xs text-(--ms-text-muted) select-none">
          Worked for {formatWorkedDuration(durationSeconds ?? 1)}
        </div>
      )}

      {textBlocks.map((block) => (
        <AgentMarkdown key={block.key}>{block.text}</AgentMarkdown>
      ))}

      {showActions && (
        <div
          className={`-ml-1.5 flex items-center gap-0.5 transition-opacity duration-150 focus-within:opacity-100 ${
            isLastAssistantMessage ? 'opacity-100' : 'opacity-0 group-hover/turn:opacity-100'
          }`}
        >
          {plainText && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? 'Copied' : 'Copy response'}
              title={copied ? 'Copied' : 'Copy response'}
              className="ms-focus-ring flex size-6 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-(--ms-text-muted) transition-[transform,background-color,color] duration-150 hover:bg-(--ms-bg-elevated) hover:text-(--ms-text-primary) active:scale-[0.93]"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          )}
          {snapshotId && (
            <button
              type="button"
              onClick={() => onUndo?.(message.id, snapshotId)}
              title="Restore the deck to how it was before this response"
              className="ms-focus-ring flex h-6 cursor-pointer items-center gap-1 rounded-md border-none bg-transparent px-1.5 text-xs text-(--ms-text-muted) transition-[transform,background-color,color] duration-150 hover:bg-(--ms-bg-elevated) hover:text-(--ms-text-primary) active:scale-[0.97]"
            >
              <Undo2 size={12} />
              Undo changes
            </button>
          )}
        </div>
      )}
    </div>
  )
})
