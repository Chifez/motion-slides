import { useEffect, useRef } from 'react'

/**
 * Calls `onClickOutside` when a mousedown event occurs outside the ref element.
 * Replaces raw useEffect + document.addEventListener patterns in dropdowns.
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onClickOutside: () => void,
) {
  const callbackRef = useRef(onClickOutside)
  callbackRef.current = onClickOutside

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callbackRef.current()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref])
}
