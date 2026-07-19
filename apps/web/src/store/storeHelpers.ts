import type { SceneElement, Slide, Project } from '@motionslides/shared'
import type { EditorState } from './editorStore'

/**
 * Shared Store Update Helpers
 *
 * The store's immutable update pattern (project → slide → element) was
 * duplicated 13+ times across slices with inconsistent metadata handling.
 * These helpers standardize the pattern into composable, type-safe utilities.
 */

interface UpdateOptions {
  /** When true, skips setting updatedAt (useful for high-frequency drags) */
  silent?: boolean
}

/**
 * Immutably update the active slide's elements within the active project.
 * Handles the 3-level nested map and metadata bookkeeping in one place.
 */
export function updateActiveSlideElements(
  state: EditorState,
  transform: (elements: SceneElement[], slide: Slide) => SceneElement[],
  opts: UpdateOptions = {},
): Partial<EditorState> {
  const { activeProjectId, activeSlideIndex } = state
  if (!activeProjectId) return {}

  return {
    projects: state.projects.map((p) => {
      if (p.id !== activeProjectId) return p
      const slides = p.slides.map((sl, i) => {
        if (i !== activeSlideIndex) return sl
        const nextElements = transform(sl.elements, sl)
        // Bail out if the transform returned the same reference (no change)
        return nextElements === sl.elements ? sl : { ...sl, elements: nextElements }
      })
      return {
        ...p,
        slides,
        ...(opts.silent
          ? { synced: false }
          : { updatedAt: Date.now(), synced: false }),
      }
    }),
  }
}

/**
 * Immutably update the active slide itself (name, background, etc.)
 */
export function updateActiveSlide(
  state: EditorState,
  updates: Partial<Pick<Slide, 'name' | 'background'>>,
): Partial<EditorState> {
  const { activeProjectId, activeSlideIndex } = state
  if (!activeProjectId) return {}

  return {
    projects: state.projects.map((p) => {
      if (p.id !== activeProjectId) return p
      const slides = p.slides.map((sl, i) => {
        if (i !== activeSlideIndex) return sl
        return { ...sl, ...updates }
      })
      return { ...p, slides, updatedAt: Date.now(), synced: false }
    }),
  }
}

/**
 * Immutably update a specific project by ID.
 * Handles the timestamp and sync flag automatically.
 */
export function updateProjectById(
  state: EditorState,
  projectId: string,
  transform: (project: Project) => Partial<Project>,
): Partial<EditorState> {
  return {
    projects: state.projects.map((p) => {
      if (p.id !== projectId) return p
      const updates = transform(p)
      return {
        ...p,
        ...updates,
        updatedAt: updates.updatedAt ?? Math.max(Date.now(), (p.updatedAt ?? 0) + 1),
        synced: updates.synced ?? false,
      }
    }),
  }
}
