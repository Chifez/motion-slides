import { useEffect, useRef } from 'react'

/**
 * Runs an autoplay timer that fires `onTick` after `delay` ms.
 * Timer resets whenever dependencies change. Disabled when `active` is false.
 */
export function useAutoplay(
  active: boolean,
  delay: number,
  onTick: () => void,
  deps: unknown[] = [],
) {
  const tickRef = useRef(onTick)
  tickRef.current = onTick

  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => tickRef.current(), delay)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, delay, ...deps])
}
