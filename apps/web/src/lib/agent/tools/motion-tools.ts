import { z } from 'zod'
import { tool } from 'ai'
import { useEditorStore } from '../../../store/editor-store'
import type { AnimationType, TransitionAnimation, LineContent, ShapeContent } from '@motionslides/shared'

export const motionToolSchemas = {
  choreographFlow: tool({
    description: 'Choreograph a step-by-step causal execution sequence (e.g. Client -> API -> Queue -> Worker -> DB) with synchronized node entrance delays and line draw animations.',
    inputSchema: z.object({
      flowSequence: z.array(z.string()).describe('Ordered array of element IDs along the execution path'),
      stepDelay: z.number().min(0.1).max(3).optional().default(0.4).describe('Delay between consecutive steps in seconds (default: 0.4)'),
      nodeAnimation: z.enum(['fade-in', 'slide-up', 'slide-left', 'zoom-in', 'pop', 'none']).optional().default('fade-in'),
      lineAnimation: z.enum(['draw', 'fade-in', 'none']).optional().default('draw'),
      slideIndex: z.number().optional().describe('Optional target 0-based slide index'),
    }),
  }),

  optimizeMagicMove: tool({
    description: 'Scan consecutive slides, reconcile shared entity IDs, and configure seamless Magic Move morph transitions across the presentation deck.',
    inputSchema: z.object({
      autoReconcileIds: z.boolean().optional().default(true).describe('Automatically align IDs of elements with matching labels across adjacent slides'),
      setTransitions: z.boolean().optional().default(true).describe('Automatically set transition type to magic-move between consecutive slides'),
      duration: z.number().min(0.2).max(3).optional().default(0.7).describe('Magic move transition duration in seconds'),
    }),
  }),

  setSlideTimingAndTransitions: tool({
    description: 'Configure slide transition types, animation durations, and pacing across the entire presentation deck or specific slide ranges.',
    inputSchema: z.object({
      transitionType: z.enum(['magic-move', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'fade', 'zoom', 'flip']).describe('Transition animation'),
      duration: z.number().min(0.1).max(5).optional().default(0.6).describe('Transition duration in seconds'),
      trigger: z.enum(['click', 'auto']).optional().default('click'),
      autoDelay: z.number().optional().describe('Delay before auto-advancing (seconds) if trigger is auto'),
      applyTo: z.enum(['all-slides', 'active-slide']).optional().default('all-slides'),
      slideIndex: z.number().optional(),
    }),
  }),
}

export type MotionToolName = keyof typeof motionToolSchemas

export async function executeMotionTool(
  toolName: MotionToolName,
  args: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const store = useEditorStore.getState()
  const activeProjectId = store.activeProjectId
  const project = store.activeProject()

  if (!activeProjectId || !project) {
    return { success: false, error: 'No active project found.' }
  }

  switch (toolName) {
    case 'choreographFlow': {
      const {
        flowSequence,
        stepDelay = 0.4,
        nodeAnimation = 'fade-in',
        lineAnimation = 'draw',
        slideIndex,
      } = args as {
        flowSequence: string[]
        stepDelay?: number
        nodeAnimation?: AnimationType
        lineAnimation?: AnimationType
        slideIndex?: number
      }

      if (!Array.isArray(flowSequence) || flowSequence.length === 0) {
        return { success: false, error: 'flowSequence must contain at least one element ID.' }
      }

      const targetSlide = slideIndex !== undefined ? project.slides[slideIndex] : store.activeSlide()
      if (!targetSlide) {
        return { success: false, error: `Slide ${slideIndex ?? 'active'} not found.` }
      }

      const sequenceSet = new Set(flowSequence)
      const sequenceIndexMap = new Map<string, number>()
      flowSequence.forEach((id, idx) => sequenceIndexMap.set(id, idx))

      let choreographedNodeCount = 0
      let choreographedLineCount = 0

      // Update slide elements with calculated timing delays
      const updatedElements = targetSlide.elements.map((el) => {
        // If element is a node in the sequence
        if (sequenceSet.has(el.id)) {
          const idx = sequenceIndexMap.get(el.id) ?? 0
          choreographedNodeCount++
          return {
            ...el,
            animation: nodeAnimation,
            animationDelay: parseFloat((idx * stepDelay).toFixed(2)),
          }
        }

        // If element is a line connecting two adjacent nodes in the sequence
        if (el.type === 'line') {
          const lc = el.content as LineContent
          const startId = lc.startConnection?.elementId
          const endId = lc.endConnection?.elementId

          if (startId && endId && sequenceSet.has(startId) && sequenceSet.has(endId)) {
            const startIdx = sequenceIndexMap.get(startId) ?? 0
            const endIdx = sequenceIndexMap.get(endId) ?? 0

            // If connecting consecutive nodes
            if (Math.abs(endIdx - startIdx) === 1) {
              const minIdx = Math.min(startIdx, endIdx)
              choreographedLineCount++
              return {
                ...el,
                animation: lineAnimation,
                animationDelay: parseFloat((minIdx * stepDelay + stepDelay / 2).toFixed(2)),
              }
            }
          }
        }

        return el
      })

      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : {
                ...p,
                slides: p.slides.map((sl) => (sl.id === targetSlide.id ? { ...sl, elements: updatedElements } : sl)),
                updatedAt: Date.now(),
              }
        ),
      }))

      const totalDuration = parseFloat(((flowSequence.length - 1) * stepDelay + 0.6).toFixed(2))

      return {
        success: true,
        data: {
          slideName: targetSlide.name,
          choreographedNodes: choreographedNodeCount,
          choreographedLines: choreographedLineCount,
          totalDuration,
          message: `Choreographed causal flow across ${choreographedNodeCount} nodes and ${choreographedLineCount} lines with step delay ${stepDelay}s (total sequence duration: ${totalDuration}s).`,
        },
      }
    }

    case 'optimizeMagicMove': {
      const {
        autoReconcileIds = true,
        setTransitions = true,
        duration = 0.7,
      } = args as {
        autoReconcileIds?: boolean
        setTransitions?: boolean
        duration?: number
      }

      if (project.slides.length < 2) {
        return { success: false, error: 'Project must contain at least 2 slides to optimize Magic Move transitions.' }
      }

      let totalMatchedNodes = 0
      let totalReconciledNodes = 0
      const updatedSlides = [...project.slides]

      // Walk adjacent slide pairs
      for (let i = 0; i < updatedSlides.length - 1; i++) {
        const slideA = updatedSlides[i]
        const slideB = updatedSlides[i + 1]

        const nodesA = slideA.elements.filter((e) => e.type === 'shape')
        const nodesB = slideB.elements.filter((e) => e.type === 'shape')

        const idsA = new Set(nodesA.map((n) => n.id))

        // Check matched IDs
        nodesB.forEach((nb) => {
          if (idsA.has(nb.id)) {
            totalMatchedNodes++
          } else if (autoReconcileIds) {
            // Check for near match by label or sublabel
            const contentB = nb.content as ShapeContent
            const labelB = (contentB.label || '').trim().toLowerCase()

            if (labelB) {
              const matchedNodeA = nodesA.find((na) => {
                const contentA = na.content as ShapeContent
                const labelA = (contentA.label || '').trim().toLowerCase()
                return labelA && labelA === labelB
              })

              if (matchedNodeA) {
                const oldId = nb.id
                const newId = matchedNodeA.id

                // Reconcile ID in slideB elements
                slideB.elements = slideB.elements.map((el) => {
                  if (el.id === oldId) return { ...el, id: newId }
                  if (el.type === 'line') {
                    const lc = el.content as LineContent
                    let changed = false
                    const startConn = lc.startConnection
                      ? lc.startConnection.elementId === oldId
                        ? ((changed = true), { ...lc.startConnection, elementId: newId })
                        : lc.startConnection
                      : undefined
                    const endConn = lc.endConnection
                      ? lc.endConnection.elementId === oldId
                        ? ((changed = true), { ...lc.endConnection, elementId: newId })
                        : lc.endConnection
                      : undefined
                    return changed ? { ...el, content: { ...lc, startConnection: startConn, endConnection: endConn } } : el
                  }
                  return el
                })

                totalReconciledNodes++
                totalMatchedNodes++
              }
            }
          }
        })
      }

      // Configure slide transitions to magic-move
      let updatedTransitions = [...project.transitions]
      if (setTransitions) {
        for (let i = 0; i < updatedSlides.length - 1; i++) {
          const fromSlide = updatedSlides[i]
          const toSlide = updatedSlides[i + 1]
          const existingIdx = updatedTransitions.findIndex(
            (t) => t.fromSlideId === fromSlide.id && t.toSlideId === toSlide.id
          )

          if (existingIdx !== -1) {
            updatedTransitions[existingIdx] = {
              ...updatedTransitions[existingIdx],
              animation: 'magic-move' as any,
              duration,
            }
          } else {
            updatedTransitions.push({
              id: `trans-${i + 1}`,
              fromSlideId: fromSlide.id,
              toSlideId: toSlide.id,
              animation: 'magic-move' as any,
              duration,
              trigger: 'click',
              ease: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 },
            } as any)
          }
        }
      }

      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : {
                ...p,
                slides: updatedSlides,
                transitions: updatedTransitions,
                updatedAt: Date.now(),
              }
        ),
      }))

      return {
        success: true,
        data: {
          totalMatchedNodes,
          totalReconciledNodes,
          slideTransitionsCount: updatedTransitions.length,
          message: `Optimized Magic Move across ${updatedSlides.length} slides (${totalMatchedNodes} shared entities matched, ${totalReconciledNodes} IDs reconciled).`,
        },
      }
    }

    case 'setSlideTimingAndTransitions': {
      const {
        transitionType,
        duration = 0.6,
        trigger = 'click',
        autoDelay,
        applyTo = 'all-slides',
        slideIndex,
      } = args as {
        transitionType: TransitionAnimation
        duration?: number
        trigger?: 'click' | 'auto'
        autoDelay?: number
        applyTo?: 'all-slides' | 'active-slide'
        slideIndex?: number
      }

      let updatedTransitions = [...project.transitions]

      if (applyTo === 'all-slides') {
        for (let i = 0; i < project.slides.length - 1; i++) {
          const fromSlide = project.slides[i]
          const toSlide = project.slides[i + 1]
          const existingIdx = updatedTransitions.findIndex(
            (t) => t.fromSlideId === fromSlide.id && t.toSlideId === toSlide.id
          )

          if (existingIdx !== -1) {
            updatedTransitions[existingIdx] = {
              ...updatedTransitions[existingIdx],
              animation: transitionType,
              duration,
              trigger,
              autoDelay,
            }
          } else {
            updatedTransitions.push({
              id: `trans-${i + 1}`,
              fromSlideId: fromSlide.id,
              toSlideId: toSlide.id,
              animation: transitionType,
              duration,
              trigger,
              autoDelay,
              ease: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 },
            } as any)
          }
        }
      } else {
        const targetIdx = slideIndex !== undefined ? slideIndex : store.activeSlideIndex
        const fromSlide = project.slides[targetIdx]
        const toSlide = project.slides[targetIdx + 1]

        if (!fromSlide || !toSlide) {
          return { success: false, error: `No destination slide found after slide index ${targetIdx}.` }
        }

        const existingIdx = updatedTransitions.findIndex(
          (t) => t.fromSlideId === fromSlide.id && t.toSlideId === toSlide.id
        )

        if (existingIdx !== -1) {
          updatedTransitions[existingIdx] = {
            ...updatedTransitions[existingIdx],
            animation: transitionType,
            duration,
            trigger,
            autoDelay,
          }
        } else {
          updatedTransitions.push({
            id: `trans-${targetIdx + 1}`,
            fromSlideId: fromSlide.id,
            toSlideId: toSlide.id,
            animation: transitionType,
            duration,
            trigger,
            autoDelay,
            ease: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 },
          } as any)
        }
      }

      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== activeProjectId
            ? p
            : {
                ...p,
                transitions: updatedTransitions,
                updatedAt: Date.now(),
              }
        ),
      }))

      return {
        success: true,
        data: {
          transitionType,
          duration,
          trigger,
          transitionsConfigured: updatedTransitions.length,
          message: `Configured transition "${transitionType}" (duration: ${duration}s) for ${applyTo === 'all-slides' ? 'all slides' : 'active slide'}.`,
        },
      }
    }

    default:
      return { success: false, error: `Unknown motion tool: ${toolName}` }
  }
}
