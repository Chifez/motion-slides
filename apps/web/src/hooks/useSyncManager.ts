import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'

/**
 * useSyncManager — Intentional Synchronization Manager.
 * 
 * In version 3, we move away from "sync on every change" to a session-based model.
 * Sync only happens on:
 * 1. Manual Save (Cloud icon click)
 * 2. Page Leave (beforeunload)
 * 3. Dashboard Open (handled in dashboard route)
 */
export function useSyncManager() {
  const syncProjects = useEditorStore((s) => s.syncProjects)
  const projects = useEditorStore((s) => s.projects)
  const user = useEditorStore((s) => s.user)

  // Sync on page leave (beforeunload)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Offline mode (unauthenticated) doesn't need cloud sync warnings
      if (!user) return

      const hasUnsynced = projects.some(p => !p.synced)
      if (hasUnsynced) {
        // Trigger background sync
        syncProjects()
        
        // Show native confirmation dialog for external reload/close
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [projects, syncProjects, user])
}
