import { useEffect, useRef, useState } from 'react'

/**
 * Wall-clock seconds since `active` first became true (or since `initialStartMs` if provided).
 *
 * The start time is kept across active/inactive flips so a group of steps that
 * pauses between tool calls reports its whole duration, not just the last burst.
 * The last value is retained once `active` turns false, so a finished run keeps
 * showing how long it took.
 */
export function useElapsedSeconds(active: boolean, initialStartMs?: number | null): number {
  const startedAt = useRef<number | null>(initialStartMs ?? null)
  const [seconds, setSeconds] = useState(() =>
    initialStartMs ? Math.max(0, Math.floor((Date.now() - initialStartMs) / 1000)) : 0,
  )

  useEffect(() => {
    if (initialStartMs && !startedAt.current) {
      startedAt.current = initialStartMs
    }
    if (!active) return
    startedAt.current ??= Date.now()
    const tick = () => {
      const start = startedAt.current ?? Date.now()
      setSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => {
      clearInterval(id)
      tick()
    }
  }, [active, initialStartMs])

  return seconds
}

/**
 * Formats a duration in seconds for the "Worked for ..." summary header
 * (e.g. "4s", "1m 12s", "5m").
 */
export function formatWorkedDuration(seconds: number): string {
  const total = Math.max(1, Math.round(seconds))
  if (total < 60) return `${total}s`
  const mins = Math.floor(total / 60)
  const rem = total % 60
  if (mins < 60) return rem === 0 ? `${mins}m` : `${mins}m ${rem}s`
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60
  return remMins === 0 ? `${hrs}h` : `${hrs}h ${remMins}m`
}
