import { useState, useRef, useCallback, useEffect } from 'react'
import { CONTROLS_AUTO_HIDE_MS } from '@/constants/animation'

/**
 * Returns `[visible, showControls]` — `visible` becomes false after
 * `delay` ms of inactivity. `showControls()` resets the timer.
 * Also listens for mousemove events when `active` is true.
 */
export function useAutoHide(active: boolean, delay = CONTROLS_AUTO_HIDE_MS) {
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    setVisible(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), delay)
  }, [delay])

  useEffect(() => {
    if (!active) return
    const handler = () => show()
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [active, show])

  return [visible, show] as const
}
