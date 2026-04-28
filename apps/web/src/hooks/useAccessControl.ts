import { useMemo, useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useSearch, useNavigate } from '@tanstack/react-router'

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
  const navigate = useNavigate()

  // Single store subscription
  const { user, activeProject, localAuthorId } = useEditorStore()
  const project = activeProject()

  const access = useMemo(() => {
    const requestedMode = (search.mode as AccessMode) || 'edit'
    const requestedKey = search.key as string
    const autoplayParam = search.autoplay
    const autoplay = autoplayParam === 'true' ? true : autoplayParam === 'false' ? false : null

    if (!project) {
      return {
        mode: 'view' as AccessMode,
        canEdit: false,
        isReadOnly: true,
        autoplay: null,
        isAuthenticated: !!user,
        isDenied: false, // let the !project check in the page handle the UI
      }
    }

    const isOwner = !!user && project.ownerId === user.id
    const isCollaborative = project.visibility === 'collaborative'
    const isLinkShared = project.visibility === 'link-shared'
    const isPublic = project.visibility === 'public'

    // Requires matching localAuthorId to prevent draft collision between devices
    const isLocalDraft = !project.synced && project.localAuthorId === localAuthorId

    const hasValidKey = requestedKey === project.shareKey

    // Access denial — guests with no valid path to the project
    let isDenied = false
    if (!isOwner && !isLocalDraft) {
      if (isPublic) {
        isDenied = false
      } else if (isLinkShared || isCollaborative) {
        if (!hasValidKey) isDenied = true
      } else {
        isDenied = true // private project
      }
    }

    // canEdit is a capability derived purely from data — never from the URL mode
    const canEdit = isOwner || isLocalDraft || (isCollaborative && hasValidKey)

    // Graceful mode downgrade — never show an error when view is possible
    const effectiveMode: AccessMode = (requestedMode === 'edit' && !canEdit) ? 'view' : requestedMode

    return {
      mode: effectiveMode,
      canEdit,              // capability — independent of current mode
      isReadOnly: !canEdit, // write guard for store/server operations
      autoplay,
      isAuthenticated: !!user,
      isDenied,
    }
  }, [project, user, localAuthorId, search.mode, search.key, search.autoplay])

  // Silent URL rewrite when mode is downgraded, so the URL reflects reality
  // CRITICAL: Only perform the rewrite if the project actually exists to avoid 
  // navigating during initial route load/hydration.
  useEffect(() => {
    if (project && access.mode !== search.mode) {
      (navigate as any)({
        search: (s: any) => ({ ...s, mode: access.mode }),
        replace: true
      })
    }
  }, [project, access.mode, search.mode, navigate])

  return access
}

