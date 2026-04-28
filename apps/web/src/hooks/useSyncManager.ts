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

  // Sync on page leave (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsynced = projects.some(p => !p.synced)
      if (hasUnsynced) {
        // We trigger the sync, but beforeunload is synchronous and 
        // doesn't wait for promises. Most modern browsers will kill 
        // the request unless we use navigator.sendBeacon (which our 
        // server actions don't use yet).
        // For now, we'll just try our best.
        syncProjects()
        
        // Show a confirmation dialog to give the sync a chance to finish
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [projects, syncProjects])
}
