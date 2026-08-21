import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editor-store'

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
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const state = useEditorStore.getState()
      if (!state.user) return

      const hasUnsynced = state.projects.some(p => !p.synced)
      if (hasUnsynced) {
        state.syncProjects()
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
}
