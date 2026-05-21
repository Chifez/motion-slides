import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useShallow } from 'zustand/react/shallow'
import { useSearch, useNavigate, useParams, useLoaderData } from '@tanstack/react-router'
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
  const navigate = useNavigate({ from: '/p/$projectId' })
  const loaderData = useLoaderData({ from: '/p/$projectId' }) as any
  const loaderProject = loaderData?.project
  const loaderAccessDenied = loaderData?.accessDenied

  const { userId, project, localAuthorId, sessionStatus } = useEditorStore(
    useShallow((s) => ({
      userId: s.user?.id ?? null,
      project: s.projects.find((p) => p.id === projectId) ?? null,
      localAuthorId: s.localAuthorId,
      sessionStatus: s.sessionStatus,
    }))
  )

  const isPending = sessionStatus === 'loading'
  const requestedMode = (search.mode as AccessMode) || 'edit'
  const requestedKey = (search.key as string) ?? null
  const autoplayParam = search.autoplay
  const autoplay = autoplayParam === 'true' ? true : autoplayParam === 'false' ? false : null

  let access: AccessControl

  if (loaderAccessDenied) {
    access = {
      mode: requestedMode,
      canEdit: false,
      isReadOnly: true,
      autoplay,
      isAuthenticated: !!userId,
      isDenied: true,
      isPending: false,
    }
  } else if (isPending) {
    access = {
      mode: requestedMode,
      canEdit: false,
      isReadOnly: true,
      autoplay: null,
      isAuthenticated: !!userId,
      isDenied: false,
      isPending: true,
    }
  } else if (!project) {
    // If we don't have the project in the store, we are only pending
    // if there's a loaderProject that is currently being hydrated.
    // If loaderProject is null (and loaderAccessDenied is false), it's still a 404.
    const isHydrating = !!loaderProject
    access = {
      mode: requestedMode,
      canEdit: false,
      isReadOnly: true,
      autoplay,
      isAuthenticated: !!userId,
      isDenied: !isHydrating,
      isPending: isHydrating,
    }
  } else {
    const { isDenied, canEdit } = evaluateProjectAccess({
      project,
      userId,
      localAuthorId,
      requestedKey,
    })

    // Graceful mode downgrade: never error when view is possible
    const effectiveMode: AccessMode =
      requestedMode === 'edit' && !canEdit ? 'view' : requestedMode

    access = {
      mode: effectiveMode,
      canEdit,
      isReadOnly: !canEdit,
      autoplay,
      isAuthenticated: !!userId,
      isDenied,
      isPending: false,
    }
  }


  console.log(`[useAccessControl] Evaluation:`, {
    projectId,
    loaderAccessDenied,
    isPending,
    hasProject: !!project,
    projectVisibility: project?.visibility,
    projectShareKey: project?.shareKey,
    requestedKey,
    access
  })

  useEffect(() => {
    if (project && !access.isPending && access.mode !== search.mode) {
      navigate({ search: (s: any) => ({ ...s, mode: access.mode }), replace: true })
    }
  }, [project, access.mode, access.isPending, search.mode, navigate])

  return access
}
