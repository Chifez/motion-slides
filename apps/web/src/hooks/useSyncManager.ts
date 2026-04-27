import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'

/**
 * useSyncManager — Background synchronization hook.
 * Watches for local changes and pushes them to the server with debouncing.
 */
export function useSyncManager() {
  const syncProjects = useEditorStore((s) => s.syncProjects)
  const projects = useEditorStore((s) => s.projects)
  const user = useEditorStore((s) => s.user)
  const isSyncing = useEditorStore((s) => s.isSyncing)
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const isFirstMount = useRef(true)

  // Trigger sync when projects change (debounced)
  useEffect(() => {
    if (!user) return
    
    // Skip the very first mount if projects were just hydrated
    if (isFirstMount.current) {
      isFirstMount.current = false
      // But still do an initial sync to get remote projects
      syncProjects()
      return
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    // Debounce sync to prevent hammering the server on every keystroke
    debounceTimer.current = setTimeout(() => {
      if (!isSyncing) {
        syncProjects()
      }
    }, 3000)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [projects, user, syncProjects])
}
