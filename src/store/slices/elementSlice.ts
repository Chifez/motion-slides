import type { StateCreator } from 'zustand'
import type { SceneElement, LineContent, Position } from '@/types'
import type { EditorState } from '@/store/editorStore'

export interface ElementSlice {
  selectedElementIds: string[]
  setSelectedElement: (id: string | null, multi?: boolean) => void
  setSelectedElements: (ids: string[]) => void
  addElement: (element: SceneElement) => void
  updateElement: (id: string, updates: Partial<SceneElement>) => void
  updateElements: (ids: string[], updates: Partial<SceneElement>) => void
  updateElementsBatch: (updates: { id: string; changes: Partial<SceneElement> }[]) => void
  deleteElement: (id: string) => void
  toggleElementLock: (id: string) => void
  duplicateElement: (id: string) => void
  groupElements: (ids: string[]) => void
  ungroupElements: (groupId: string) => void
  recalculateLines: () => void
}

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

/**
 * Given a connection descriptor { elementId, handleId } and the current element
 * list, resolve the absolute canvas position of that anchor point.
 */
export function getConnectionPos(
  conn: { elementId: string; handleId: string },
  elements: SceneElement[],
): Position | null {
  const target = elements.find((e) => e.id === conn.elementId)
  if (!target) return null

  const { x, y } = target.position
  const { width: w, height: h } = target.size

  switch (conn.handleId) {
    case 'top': return { x: x + w / 2, y }
    case 'bottom': return { x: x + w / 2, y: y + h }
    case 'left': return { x, y: y + h / 2 }
    case 'right': return { x: x + w, y: y + h / 2 }
    case 'center':
    default: return { x: x + w / 2, y: y + h / 2 }
  }
}

/**
 * Walk every line element on a slide and recompute its bounding box +
 * normalised x1/y1/x2/y2 from whatever connections are currently set.
 * Returns the element array unchanged if nothing needed updating.
 */
function recalcLinesOnSlide(elements: SceneElement[]): SceneElement[] {
  let changed = false

  const next = elements.map((el) => {
    if (el.type !== 'line') return el

    const content = el.content as LineContent
    const isFork = content.lineType === 'branching'

    // 1. Collect all absolute points for this line
    const points: Position[] = []

    // Start point
    const startPos = content.startConnection
      ? getConnectionPos(content.startConnection, elements)
      : { x: el.position.x + content.x1 * el.size.width, y: el.position.y + content.y1 * el.size.height }
    if (startPos) points.push(startPos)

    // End point (Only if not a fork)
    const endPos = !isFork || content.endConnection
      ? (content.endConnection
          ? getConnectionPos(content.endConnection, elements)
          : { x: el.position.x + content.x2 * el.size.width, y: el.position.y + content.y2 * el.size.height })
      : null
    if (endPos && !isFork) points.push(endPos)

    // Branches
    const branchPositions: (Position | null)[] = (content.branches || []).map(b => {
      if (b.connection) return getConnectionPos(b.connection, elements)
      return { x: el.position.x + b.x * el.size.width, y: el.position.y + b.y * el.size.height }
    })
    branchPositions.forEach(p => { if (p) points.push(p) })

    if (points.length < 2) return el

    // 2. Calculate new bounding box
    const minX = Math.min(...points.map(p => p.x))
    const minY = Math.min(...points.map(p => p.y))
    const maxX = Math.max(...points.map(p => p.x))
    const maxY = Math.max(...points.map(p => p.y))
    const newW = Math.max(1, maxX - minX)
    const newH = Math.max(1, maxY - minY)

    // 3. Normalized coordinates
    const nx1 = startPos ? (startPos.x - minX) / newW : content.x1
    const ny1 = startPos ? (startPos.y - minY) / newH : content.y1
    const nx2 = endPos ? (endPos.x - minX) / newW : content.x2
    const ny2 = endPos ? (endPos.y - minY) / newH : content.y2

    const nBranches = (content.branches || []).map((b, i) => {
      const p = branchPositions[i]
      if (!p) return b
      return { ...b, x: (p.x - minX) / newW, y: (p.y - minY) / newH }
    })

    // Skip update if nothing changed
    const hasBranchesChanged = JSON.stringify(content.branches) !== JSON.stringify(nBranches)
    if (
      el.position.x === minX && el.position.y === minY &&
      el.size.width === newW && el.size.height === newH &&
      content.x1 === nx1 && content.y1 === ny1 &&
      content.x2 === nx2 && content.y2 === ny2 &&
      !hasBranchesChanged
    ) return el

    changed = true
    return {
      ...el,
      position: { x: minX, y: minY },
      size: { width: newW, height: newH },
      content: { 
        ...content, 
        x1: nx1, y1: ny1, 
        x2: nx2, y2: ny2,
        branches: nBranches
      },
    }
  })

  return changed ? next : elements
}

function cleanupConnectionsForDeletedElement(
  elements: SceneElement[],
  deletedId: string,
): SceneElement[] {
  return elements.map((el) => {
    if (el.type !== 'line') return el

    const content = el.content as LineContent
    const startDangling = content.startConnection?.elementId === deletedId
    const endDangling = content.endConnection?.elementId === deletedId
    
    let branchesChanged = false
    const nextBranches = content.branches?.map(b => {
      if (b.connection?.elementId === deletedId) {
        branchesChanged = true
        return { ...b, connection: undefined }
      }
      return b
    })

    if (!startDangling && !endDangling && !branchesChanged) return el

    return {
      ...el,
      content: {
        ...content,
        ...(startDangling ? { startConnection: undefined } : {}),
        ...(endDangling ? { endConnection: undefined } : {}),
        branches: nextBranches,
      } as LineContent,
    }
  })
}

// ─────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────

export const createElementSlice: StateCreator<EditorState, [], [], ElementSlice> = (set, get) => ({
  selectedElementIds: [],

  // ── Selection ─────────────────────────────────────────────────────────────

  setSelectedElement: (id, multi = false) => {
    set((s) => {
      if (id === null) return { selectedElementIds: [] }
      if (multi) {
        return s.selectedElementIds.includes(id)
          ? { selectedElementIds: s.selectedElementIds.filter((x) => x !== id) }
          : { selectedElementIds: [...s.selectedElementIds, id] }
      }
      return { selectedElementIds: [id] }
    })
  },

  setSelectedElements: (ids) => set({ selectedElementIds: ids }),

  // ── Recalculate connected lines ───────────────────────────────────────────
  //
  // Called after every mutation that can move an element (updateElement,
  // updateElements, updateElementsBatch). Safe to call after deletions too —
  // cleanupConnectionsForDeletedElement already strips dangling refs before
  // this runs, so getConnectionPos will never return null for a live line.

  recalculateLines: () => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return

    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        return {
          ...p,
          slides: p.slides.map((sl, i) => {
            if (i !== activeSlideIndex) return sl
            const next = recalcLinesOnSlide(sl.elements)
            // Avoid a new object reference if nothing changed
            return next === sl.elements ? sl : { ...sl, elements: next }
          }),
        }
      }),
    }))
  },

  // ── CRUD ──────────────────────────────────────────────────────────────────

  addElement: (element) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) =>
          i !== activeSlideIndex
            ? sl
            : { ...sl, elements: [...sl.elements, element] }
        )
        return { ...p, slides, updatedAt: Date.now() }
      }),
    }))
  },

  updateElement: (id, updates) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          return {
            ...sl,
            elements: sl.elements.map((el) =>
              el.id === id ? ({ ...el, ...updates } as SceneElement) : el
            ),
          }
        })
        return { ...p, slides, updatedAt: Date.now() }
      }),
    }))
    // Propagate: any line connected to `id` gets its geometry recalculated
    get().recalculateLines()
  },

  updateElements: (ids, updates) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId || ids.length === 0) return
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          return {
            ...sl,
            elements: sl.elements.map((el) =>
              ids.includes(el.id) ? ({ ...el, ...updates } as SceneElement) : el
            ),
          }
        })
        return { ...p, slides, updatedAt: Date.now() }
      }),
    }))
    get().recalculateLines()
  },

  updateElementsBatch: (updates) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId || updates.length === 0) return
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          return {
            ...sl,
            elements: sl.elements.map((el) => {
              const update = updates.find((u) => u.id === el.id)
              return update ? ({ ...el, ...update.changes } as SceneElement) : el
            }),
          }
        })
        return { ...p, slides, updatedAt: Date.now() }
      }),
    }))
    get().recalculateLines()
  },

  /**
   * Delete an element and automatically:
   *   1. Strip any line startConnection / endConnection pointing at it
   *   2. Recompute all remaining line geometries
   *   3. Remove the id from the selection
   */
  deleteElement: (id) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl

          // Remove the element itself
          const withoutDeleted = sl.elements.filter((el) => el.id !== id)

          // Strip dangling connection refs from any lines
          const cleaned = cleanupConnectionsForDeletedElement(withoutDeleted, id)

          return { ...sl, elements: cleaned }
        })
        return { ...p, slides, updatedAt: Date.now() }
      }),
      selectedElementIds: s.selectedElementIds.filter((x) => x !== id),
    }))
    // Recalculate geometries now that connections are clean
    get().recalculateLines()
  },

  // ── Misc ──────────────────────────────────────────────────────────────────

  toggleElementLock: (id) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          return {
            ...sl,
            elements: sl.elements.map((el) =>
              el.id === id ? { ...el, locked: !el.locked } : el
            ),
          }
        })
        return { ...p, slides, updatedAt: Date.now() }
      }),
    }))
  },

  duplicateElement: (id) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    const project = get().projects.find((p) => p.id === activeProjectId)
    const element = project?.slides[activeSlideIndex]?.elements.find((el) => el.id === id)
    if (!element) return

    const newElement: SceneElement = {
      ...element,
      id: `el-${Math.random().toString(36).substr(2, 9)}`,
      position: { x: element.position.x + 20, y: element.position.y + 20 },
      zIndex: element.zIndex + 1,
    }
    get().addElement(newElement)
    get().setSelectedElement(newElement.id)
  },

  groupElements: (ids) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId || ids.length < 2) return
    const groupId = `group-${Math.random().toString(36).substr(2, 9)}`
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          return {
            ...sl,
            elements: sl.elements.map((el) =>
              ids.includes(el.id) ? { ...el, groupId } : el
            ),
          }
        })
        return { ...p, slides, updatedAt: Date.now() }
      }),
      selectedElementIds: ids,
    }))
  },

  ungroupElements: (groupId) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          return {
            ...sl,
            elements: sl.elements.map((el) => {
              if (el.groupId !== groupId) return el
              const { groupId: _, ...rest } = el
              return rest as SceneElement
            }),
          }
        })
        return { ...p, slides, updatedAt: Date.now() }
      }),
    }))
  },
})