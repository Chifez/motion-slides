import { useElapsedSeconds } from './use-elapsed-seconds'

/**
 * "Thinking" row, shown between the user's send and the first visible output (and in the
 * gaps between tool rounds). Uses the MotionSlides brand mark as the active thinking indicator
 * paired with a shimmering label and elapsed second counter.
 */
export function AgentThinking({ turnStartedAt }: { turnStartedAt?: number | null }) {
  const seconds = useElapsedSeconds(true, turnStartedAt)

  return (
    <div role="status" aria-live="polite" className="flex h-7 items-center gap-2 text-xs select-none">
      <img
        src="/logo.png"
        alt=""
        className="h-3.5 w-auto shrink-0"
      />
      <span className="ms-shimmer-text">Thinking</span>
      {seconds >= 2 && <span className="tabular-nums text-(--ms-text-muted)">{seconds}s</span>}
    </div>
  )
}
