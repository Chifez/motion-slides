import { useMemo } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useSearch } from '@tanstack/react-router'

export type AccessMode = 'edit' | 'view' | 'present'

export interface AccessControl {
  mode: AccessMode
  canEdit: boolean
  isReadOnly: boolean
  autoplay: boolean | null
  isAuthenticated: boolean
  isDenied: boolean
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
  const { user } = useEditorStore()
  const { activeProject } = useEditorStore()
  const project = activeProject()

  return useMemo(() => {
    const requestedMode = (search.mode as AccessMode) || 'edit'
    const requestedKey = search.key as string
    const autoplayParam = search.autoplay
    const autoplay = autoplayParam === 'true' ? true : autoplayParam === 'false' ? false : null

    if (!project) {
      return {
        mode: 'view',
        canEdit: false,
        isReadOnly: true,
        autoplay: false,
        isAuthenticated: false,
        isDenied: false, // handeled by null project check in page
      }
    }

    const isOwner = user && project.ownerId === user.id
    const isCollaborative = project.visibility === 'collaborative'
    const isLinkShared = project.visibility === 'link-shared'
    const isPublic = project.visibility === 'public'
    const isLocalDraft = !project.synced

    // 2. Access Validation
    const hasValidKey = requestedKey === project.shareKey
    
    // Logic for Denial:
    // Deny if:
    // 1. Project is NOT public AND
    // 2. User is NOT owner AND
    // 3. User is NOT local author AND
    // 4. (Link-shared or Collaborative) AND Key is missing/wrong
    // OR
    // 5. Visibility is Private AND User is NOT owner/local
    
    let isDenied = false
    if (!isOwner && !isLocalDraft) {
      if (isPublic) {
        isDenied = false
      } else if (isLinkShared || isCollaborative) {
        if (!hasValidKey) isDenied = true
      } else {
        // Must be Private
        isDenied = true
      }
    }

    // 3. Final Permission Resolution
    let mode = requestedMode
    // canEdit is true if:
    // 1. You are the owner (always)
    // 2. Visibility is collaborative (with valid key)
    // 3. It's a local draft (unsynced)
    let canEdit = (isOwner || (isCollaborative && hasValidKey) || isLocalDraft) && requestedMode === 'edit'
    
    // Security Lock: If we try to edit without permission, force into view mode.
    if (requestedMode === 'edit' && !isOwner && !(isCollaborative && hasValidKey) && !isLocalDraft) {
      mode = 'view'
      canEdit = false
    }

    // If it's a shared view link, ensure canEdit is always false for this hook's output
    if (requestedMode !== 'edit') {
      canEdit = false
    }

    return {
      mode,
      canEdit,
      isReadOnly: !canEdit,
      autoplay,
      isAuthenticated: !!user,
      isDenied,
    }
  }, [project, user, search.mode, search.key, search.autoplay])
}
