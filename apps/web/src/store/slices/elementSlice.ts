import type { StateCreator } from 'zustand'
import type { SceneElement, LineContent, Position } from '@motionslides/shared'
import type { EditorState } from '@/store/editorStore'

export interface ElementSlice {
  selectedElementIds: string[]
  setSelectedElement: (id: string | null, multi?: boolean) => void
  setSelectedElements: (ids: string[]) => void
  addElement: (element: SceneElement) => void
  updateElement: (id: string, updates: Partial<SceneElement>) => void
  updateElements: (ids: string[], updates: Partial<SceneElement>) => void
  updateElementsBatch: (
    updates: { id: string; changes: Partial<SceneElement> }[],
    options?: { silent?: boolean }
  ) => void
  deleteElement: (id: string) => void
  toggleElementLock: (id: string) => void
  duplicateElement: (id: string) => void
  groupElements: (ids: string[]) => void
  ungroupElements: (groupId: string) => void
  addSection: () => void
  recalculateLines: () => void
}

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
 */
function recalcLinesOnSlide(elements: SceneElement[]): SceneElement[] {
  let changed = false

  const next = elements.map((el) => {
    if (el.type !== 'line') return el

    const content = el.content as LineContent
    const isFork = content.lineType === 'branching'

    const points: Position[] = []

    const startPos = content.startConnection
      ? getConnectionPos(content.startConnection, elements)
      : { x: el.position.x + content.x1 * el.size.width, y: el.position.y + content.y1 * el.size.height }
    if (startPos) points.push(startPos)

    const endPos = !isFork || content.endConnection
      ? (content.endConnection
          ? getConnectionPos(content.endConnection, elements)
          : { x: el.position.x + content.x2 * el.size.width, y: el.position.y + content.y2 * el.size.height })
      : null
    if (endPos && !isFork) points.push(endPos)

    const branchPositions: (Position | null)[] = (content.branches || []).map(b => {
      if (b.connection) return getConnectionPos(b.connection, elements)
      return { x: el.position.x + b.x * el.size.width, y: el.position.y + b.y * el.size.height }
    })
    branchPositions.forEach(p => { if (p) points.push(p) })

    if (points.length < 2) return el

    const minX = Math.min(...points.map(p => p.x))
    const minY = Math.min(...points.map(p => p.y))
    const maxX = Math.max(...points.map(p => p.x))
    const maxY = Math.max(...points.map(p => p.y))
    const newW = Math.max(1, maxX - minX)
    const newH = Math.max(1, maxY - minY)

    const nx1 = startPos ? (startPos.x - minX) / newW : content.x1
    const ny1 = startPos ? (startPos.y - minY) / newH : content.y1
    
    // For branching lines the end-point is not part of the bbox, so we must
    // leave x2/y2 unchanged to avoid overwriting them with stale values.
    const nx2 = (!isFork && endPos) ? (endPos.x - minX) / newW : content.x2
    const ny2 = (!isFork && endPos) ? (endPos.y - minY) / newH : content.y2

    const nBranches = (content.branches || []).map((b, i) => {
      const p = branchPositions[i]
      if (!p) return b
      return { ...b, x: (p.x - minX) / newW, y: (p.y - minY) / newH }
    })

    const hasBranchesChanged = JSON.stringify(content.branches) !== JSON.stringify(nBranches)
    if (
      el.position.x === minX && el.position.y === minY &&
      el.size.width === newW && el.size.height === newH &&
      content.x1 === nx1 && content.y1 === ny1 &&
      (isFork || (content.x2 === nx2 && content.y2 === ny2)) &&
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

export const createElementSlice: StateCreator<EditorState, [], [], ElementSlice> = (set, get) => ({
  selectedElementIds: [],

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

  /**
   * Safe to call after deletions too — cleanupConnectionsForDeletedElement 
   * already strips dangling refs before this runs.
   */
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
            return next === sl.elements ? sl : { ...sl, elements: next }
          }),
        }
      }),
    }))
  },

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
        return { ...p, slides, updatedAt: Date.now(), synced: false }
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
        return { ...p, slides, updatedAt: Date.now(), synced: false }
      }),
    }))
    
    // Only propagate when a shape moves — line updates already carry their own
    // final geometry, so calling recalculateLines here would cause a redundant render.
    const project = get().projects.find((p) => p.id === get().activeProjectId)
    const updatedEl = project?.slides[get().activeSlideIndex]?.elements.find((e) => e.id === id)
    if (updatedEl?.type !== 'line') get().recalculateLines()
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
        return { ...p, slides, updatedAt: Date.now(), synced: false }
      }),
    }))
    get().recalculateLines()
  },

  updateElementsBatch: (updates, options = {}) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId || updates.length === 0) return

    const updateMap = new Map(updates.map(u => [u.id, u.changes]))

    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          return {
            ...sl,
            elements: sl.elements.map((el) => {
              const changes = updateMap.get(el.id)
              return changes ? ({ ...el, ...changes } as SceneElement) : el
            }),
          }
        })

        // Optimized Sync: Only update project-level metadata if not silent.
        // This prevents triggering expensive global re-renders during high-frequency drags.
        return { 
          ...p, 
          slides, 
          ...(options.silent ? { synced: false } : { updatedAt: Date.now(), synced: false })
        }
      }),
    }))

    // Line recalculation is expensive; only run if not silent or specifically needed
    if (!options.silent) {
      get().recalculateLines()
    }
  },

  deleteElement: (id) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        const slides = p.slides.map((sl, i) => {
          if (i !== activeSlideIndex) return sl
          const withoutDeleted = sl.elements.filter((el) => el.id !== id)
          const cleaned = cleanupConnectionsForDeletedElement(withoutDeleted, id)
          return { ...sl, elements: cleaned }
        })
        return { ...p, slides, updatedAt: Date.now(), synced: false }
      }),
      selectedElementIds: s.selectedElementIds.filter((x) => x !== id),
    }))
    get().recalculateLines()
  },

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
        return { ...p, slides, updatedAt: Date.now(), synced: false }
      }),
    }))
  },

  duplicateElement: (id) => {
    const { activeProjectId, activeSlideIndex } = get()
    if (!activeProjectId) return
    const project = get().projects.find((p) => p.id === activeProjectId)
    const element = project?.slides[activeSlideIndex]?.elements.find((el) => el.id === id)
    if (!element) return

    // Strip connection refs from duplicated lines so two lines don't
    // simultaneously claim ownership of the same shape anchor.
    const dupContent =
      element.type === 'line'
        ? {
            ...(element.content as LineContent),
            startConnection: undefined,
            endConnection: undefined,
            branches: (element.content as LineContent).branches?.map((b) => ({
              ...b,
              connection: undefined,
            })),
          }
        : element.content

    const newElement: SceneElement = {
      ...element,
      id: `el-${Math.random().toString(36).substr(2, 9)}`,
      position: { x: element.position.x + 20, y: element.position.y + 20 },
      zIndex: element.zIndex + 1,
      content: dupContent,
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
        return { ...p, slides, updatedAt: Date.now(), synced: false }
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
        return { ...p, slides, updatedAt: Date.now(), synced: false }
      }),
    }))
  },

  addSection: () => {
    const { activeProjectId, activeSlideIndex, selectedElementIds, activeProject, setEditingId, setSelectedElement } = get()
    if (!activeProjectId) return
    const project = activeProject()
    if (!project) return
    const slide = project.slides[activeSlideIndex]
    if (!slide) return

    let x, y, width, height
    const PADDING = 30

    if (selectedElementIds.length > 0) {
      // Pattern: Magic Wrap
      const selectedElements = slide.elements.filter(el => selectedElementIds.includes(el.id))
      const minX = Math.min(...selectedElements.map(el => el.position.x))
      const minY = Math.min(...selectedElements.map(el => el.position.y))
      const maxX = Math.max(...selectedElements.map(el => el.position.x + el.size.width))
      const maxY = Math.max(...selectedElements.map(el => el.position.y + el.size.height))

      x = minX - PADDING
      y = minY - PADDING
      width = (maxX - minX) + (PADDING * 2)
      height = (maxY - minY) + (PADDING * 2)
    } else {
      // Pattern: Viewport Drop (using slide center as proxy for now)
      width = 400
      height = 300
      x = 1280 / 2 - width / 2
      y = 720 / 2 - height / 2
    }

    const newSection: SceneElement = {
      id: `section-${Math.random().toString(36).substr(2, 9)}`,
      type: 'section',
      position: { x, y },
      size: { width, height },
      rotation: 0,
      opacity: 1,
      zIndex: 1, // Sections always stay at the bottom
      animation: 'fade-in',
      animationDelay: 0,
      content: {
        label: 'Section',
        backgroundColor: 'color-mix(in srgb, var(--ms-accent), transparent 95%)',
        borderColor: 'color-mix(in srgb, var(--ms-accent), transparent 70%)',
        borderStyle: 'dashed',
        borderWidth: 2,
        cornerRadius: 12,
      } as any
    }

    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== activeProjectId) return p
        return {
          ...p,
          slides: p.slides.map((sl, i) =>
            i !== activeSlideIndex
              ? sl
              : { ...sl, elements: [newSection, ...sl.elements] } // Section inserted at the bottom (index 0)
          ),
          updatedAt: Date.now(),
          synced: false
        }
      }),
      activeTool: 'select' // Reset tool after use
    }))

    // Immediate focus for labeling
    setSelectedElement(newSection.id)
    setEditingId(newSection.id)
  },
})
