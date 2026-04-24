import { useEffect } from 'react'

type KeyHandler = (e: KeyboardEvent) => void

/**
 * Attaches a keydown listener when `active` is true.
 * Replaces raw useEffect keyboard patterns in PresentationOverlay.
 */
export function useKeyboardShortcuts(active: boolean, handler: KeyHandler) {
  useEffect(() => {
    if (!active) return
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, handler])
}
