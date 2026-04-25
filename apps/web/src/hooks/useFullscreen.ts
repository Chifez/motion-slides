import { useEffect } from 'react'

/**
 * Previously entered native browser fullscreen, but that caused distortion
 * of the canvas scale and animation transforms. The presentation overlay is
 * already `fixed inset-0` covering the full viewport, so no native fullscreen
 * API is needed. This hook is kept as a no-op so call sites don't need to change.
 */
export function useFullscreen(_active: boolean, _onExit: () => void) {
  useEffect(() => {
    // intentionally empty — overlay mode handles presentation viewport
  }, [])
}
