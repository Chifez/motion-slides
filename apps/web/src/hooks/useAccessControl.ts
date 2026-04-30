import { useMemo, useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useShallow } from 'zustand/react/shallow'
import { useSearch, useNavigate, useParams } from '@tanstack/react-router'
import { evaluateProjectAccess } from '@/lib/permissions'

export type AccessMode = 'edit' | 'view' | 'present'

export interface AccessControl {
  mode: AccessMode
  canEdit: boolean
  isReadOnly: boolean
  autoplay: boolean | null
  isAuthenticated: boolean
  isDenied: boolean
  isPending: boolean
}

/**
 * useAccessControl — Thin reactive wrapper around the pure Permission Engine.
 *
 * Responsibilities:
 *   - Read URL params (projectId, mode, key)
 *   - Subscribe to the minimum required store state
 *   - Delegate all access logic to `evaluateProjectAccess`
 *   - Silently rewrite the URL when mode is downgraded (edit → view)
 *
 * It does NOT contain any business logic. All decisions are in permissions.ts.
 */
export function useAccessControl(): AccessControl {
  const search = useSearch({ from: '/p/$projectId' }) as any
  const { projectId } = useParams({ from: '/p/$projectId' })
  const navigate = useNavigate()

  // Subscribe only to what we need — URL-scoped project lookup
  const { userId, project, localAuthorId, sessionStatus } = useEditorStore(
    useShallow((s) => ({
      userId: s.user?.id ?? null,
      project: s.projects.find((p) => p.id === projectId) ?? null,
      localAuthorId: s.localAuthorId,
      sessionStatus: s.sessionStatus,
    }))
  )

  const access = useMemo(() => {
    const isPending = sessionStatus === 'loading'
    const requestedMode = (search.mode as AccessMode) || 'edit'
    const requestedKey = (search.key as string) ?? null
    const autoplayParam = search.autoplay
    const autoplay = autoplayParam === 'true' ? true : autoplayParam === 'false' ? false : null

    // While the session is still resolving, hold position — never downgrade prematurely
    if (isPending || !project) {
      return {
        mode: requestedMode,
        canEdit: false,
        isReadOnly: true,
        autoplay: null,
        isAuthenticated: !!userId,
        isDenied: false,
        isPending: true,
      }
    }

    // Delegate all decisions to the pure engine
    const { isDenied, canEdit } = evaluateProjectAccess({
      project,
      userId,
      localAuthorId,
      requestedKey,
    })

    // Graceful mode downgrade: never error when view is possible
    const effectiveMode: AccessMode =
      requestedMode === 'edit' && !canEdit ? 'view' : requestedMode

    return {
      mode: effectiveMode,
      canEdit,
      isReadOnly: !canEdit,
      autoplay,
      isAuthenticated: !!userId,
      isDenied,
      isPending: false,
    }
  }, [project, userId, localAuthorId, search.mode, search.key, search.autoplay, sessionStatus])

  // Silent URL rewrite when mode is downgraded, so the URL reflects reality
  useEffect(() => {
    if (project && !access.isPending && access.mode !== search.mode) {
      ;(navigate as any)({
        search: (s: any) => ({ ...s, mode: access.mode }),
        replace: true,
      })
    }
  }, [project, access.mode, access.isPending, search.mode, navigate])

  return access
}
