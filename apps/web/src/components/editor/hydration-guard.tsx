import { useState, useEffect } from 'react'
import { LoadingPage } from '@/components/ui/LoadingPage'

interface Props {
  children: React.ReactNode
}

let hasHydratedGlobal = false

/**
 * HydrationGuard
 *
 * Renders a loading state until the component has mounted on the client.
 * This ensures that client-only state (like IndexedDB) does not cause
 * hydration mismatches with server-rendered content.
 */
export function HydrationGuard({ children }: Props) {
  const [isMounted, setIsMounted] = useState(hasHydratedGlobal)

  useEffect(() => {
    hasHydratedGlobal = true
    setIsMounted(true)
  }, [])

  if (!isMounted) return <LoadingPage />

  return <>{children}</>
}
