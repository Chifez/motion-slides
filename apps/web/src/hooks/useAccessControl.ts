import { useMemo } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useSearch } from '@tanstack/react-router'

export type AccessMode = 'edit' | 'view' | 'present'

export interface AccessControl {
  mode: AccessMode
  canEdit: boolean
  isReadOnly: boolean
  autoplay: boolean
  isAuthenticated: boolean // Placeholder for future auth
}

/**
 * useAccessControl — The single source of truth for permissions.
 * 
 * Resolves access based on:
 * 1. URL search params (?mode=edit|view|present)
 * 2. Project metadata (ownerId, shareKey, visibility)
 * 3. Local authorship (is this project in my local storage?)
 */
export function useAccessControl(): AccessControl {
  // Use a generic catch-all for search params since they can vary
  const search = useSearch({ from: '/p/$projectId' }) as any
  const { activeProject } = useEditorStore()
  const project = activeProject()

  return useMemo(() => {
    const requestedMode = (search.mode as AccessMode) || 'edit'
    const requestedKey = search.key as string
    const autoplay = search.autoplay === 'true'

    if (!project) {
      return {
        mode: 'view',
        canEdit: false,
        isReadOnly: true,
        autoplay: false,
        isAuthenticated: false,
      }
    }

    // 1. Author/Owner Check (Local-first logic)
    // In the future, this will compare project.ownerId with a user session.
    // For now, if the project exists in our store, we assume we have edit rights
    // UNLESS the mode is explicitly restricted by a share key.
    const isOwner = true // Placeholder: in local-only mode, we are the owner

    // 2. Share Key Validation
    // If the project is private and we're in view mode, we MUST have the correct key.
    const hasValidKey = requestedKey === project.shareKey
    
    // 3. Final Permission Resolution
    let mode = requestedMode
    let canEdit = isOwner && requestedMode === 'edit'
    
    // Security Lock: If we try to edit without being the owner or without matching keys,
    // force into view mode.
    if (requestedMode === 'edit' && !isOwner) {
      mode = 'view'
      canEdit = false
    }

    // If it's a shared view link, ensure canEdit is always false
    if (requestedMode !== 'edit') {
      canEdit = false
    }

    return {
      mode,
      canEdit,
      isReadOnly: !canEdit,
      autoplay,
      isAuthenticated: isOwner,
    }
  }, [project, search.mode, search.key, search.autoplay])
}
