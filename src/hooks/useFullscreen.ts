import { useEffect } from 'react'

/**
 * Enters fullscreen when `active` becomes true, exits when the user
 * presses Escape or exits fullscreen. Calls `onExit` when fullscreen ends.
 */
export function useFullscreen(active: boolean, onExit: () => void) {
  useEffect(() => {
    if (!active) return

    document.documentElement.requestFullscreen?.().catch(() => {})

    function onFullscreenChange() {
      if (!document.fullscreenElement) {
        onExit()
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [active, onExit])
}
