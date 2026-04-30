import type { Project } from '@motionslides/shared'

/**
 * Pure Permission Engine
 *
 * This is the single source of truth for all access decisions in MotionSlides.
 * It is a pure function — no hooks, no side effects, no store access.
 * It can be safely called on the server (Actions, Loaders) and the client (UI).
 *
 * Access Hierarchy (highest priority first):
 *   1. Owner       — User ID matches the project's ownerId
 *   2. LocalAuthor — Device's localAuthorId matches the project's localAuthorId
 *   3. Collaborator — Valid share key + 'collaborative' visibility
 *   4. Viewer      — Valid share key + 'link-shared' visibility
 *   5. Public      — visibility === 'public'
 *   6. Denied      — everything else
 */

export interface PermissionParams {
  /** The project being accessed. Null if not found. */
  project: Project | null
  /** The currently signed-in user. Null for guests. */
  userId: string | null
  /** The stable device identity from IndexedDB. */
  localAuthorId: string | null
  /** The share key from the URL (?key=...). */
  requestedKey?: string | null
}

export interface PermissionResult {
  /** Whether access is denied entirely — show the "Access Denied" page. */
  isDenied: boolean
  /** Whether the current user can make edits. */
  canEdit: boolean
  /** Whether the current user is the cloud owner. */
  isOwner: boolean
  /** Whether the current user created this project locally. */
  isLocalAuthor: boolean
  /** Whether the share key provided is valid for this project. */
  hasValidKey: boolean
}

export function evaluateProjectAccess(params: PermissionParams): PermissionResult {
  const { project, userId, localAuthorId, requestedKey } = params

  // No project — always denied
  if (!project) {
    return {
      isDenied: true,
      canEdit: false,
      isOwner: false,
      isLocalAuthor: false,
      hasValidKey: false,
    }
  }

  const isOwner = !!userId && project.ownerId === userId
  const isLocalAuthor = !!localAuthorId && project.localAuthorId === localAuthorId
  const hasValidKey = !!requestedKey && requestedKey === project.shareKey

  const isPublic = project.visibility === 'public'
  const isLinkShared = project.visibility === 'link-shared'
  const isCollaborative = project.visibility === 'collaborative'

  // Determine view access
  const canView =
    isOwner ||
    isLocalAuthor ||
    isPublic ||
    ((isLinkShared || isCollaborative) && hasValidKey)

  // Determine edit access
  const canEdit = isOwner || isLocalAuthor || (isCollaborative && hasValidKey)

  return {
    isDenied: !canView,
    canEdit,
    isOwner,
    isLocalAuthor,
    hasValidKey,
  }
}
