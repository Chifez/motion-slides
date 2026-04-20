import { useSyncExternalStore, useCallback } from 'react'

export function useMediaQuery(query: string) {
  const subscribe = useCallback((callback: () => void) => {
    const media = window.matchMedia(query)
    media.addEventListener('change', callback)
    return () => media.removeEventListener('change', callback)
  }, [query])

  const getSnapshot = () => window.matchMedia(query).matches
  const getServerSnapshot = () => false

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 1024px)')
}
