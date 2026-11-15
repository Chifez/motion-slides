/**
 * Tool presentation metadata.
 *
 * Purely typographic: no decorative icons or per-tool hues.
 */

export interface ToolMeta {
  activeLabel: string
  completedLabel: string
}

export const TOOL_META: Record<string, ToolMeta> = {
  addSlide: { activeLabel: 'Adding slide', completedLabel: 'Slide added' },
  addTextElement: { activeLabel: 'Adding text element', completedLabel: 'Text element added' },
  updateElementText: { activeLabel: 'Updating text', completedLabel: 'Text updated' },
  deleteElement: { activeLabel: 'Deleting element', completedLabel: 'Element deleted' },
  addChartElement: { activeLabel: 'Adding chart', completedLabel: 'Chart added' },
  updateChartElement: { activeLabel: 'Updating chart', completedLabel: 'Chart updated' },
  addCodeElement: { activeLabel: 'Adding code snippet', completedLabel: 'Code snippet added' },
  updateCodeElement: { activeLabel: 'Updating code snippet', completedLabel: 'Code snippet updated' },
  addShapeElement: { activeLabel: 'Adding shape', completedLabel: 'Shape added' },
  generateDiagram: { activeLabel: 'Generating architecture diagram', completedLabel: 'Architecture diagram generated' },
  patchDiagram: { activeLabel: 'Patching diagram layout', completedLabel: 'Diagram layout patched' },
  synthesizeDeckFromDocument: { activeLabel: 'Synthesizing presentation deck', completedLabel: 'Presentation deck synthesized' },
  applyDeckTheme: { activeLabel: 'Applying deck theme', completedLabel: 'Deck theme applied' },
  harmonizeSlideStyles: { activeLabel: 'Harmonizing typography', completedLabel: 'Typography harmonized' },
  choreographFlow: { activeLabel: 'Choreographing motion flow', completedLabel: 'Motion flow choreographed' },
  optimizeMagicMove: { activeLabel: 'Optimizing Magic Move', completedLabel: 'Magic Move optimized' },
  setSlideTimingAndTransitions: { activeLabel: 'Configuring transitions', completedLabel: 'Transitions configured' },
  createExploratoryBranch: { activeLabel: 'Creating Git branch', completedLabel: 'Git branch created' },
  switchBranch: { activeLabel: 'Switching Git branch', completedLabel: 'Switched Git branch' },
  listBranches: { activeLabel: 'Listing Git branches', completedLabel: 'Git branches listed' },
  agenticMergeReview: { activeLabel: 'Reviewing branch diff', completedLabel: 'Merge review completed' },
  auditPresentationQuality: { activeLabel: 'Auditing presentation quality', completedLabel: 'Quality audit completed' },
  generateSpeakerNotes: { activeLabel: 'Writing speaker notes', completedLabel: 'Speaker notes generated' },
  startPresentationMode: { activeLabel: 'Launching presentation mode', completedLabel: 'Presentation mode launched' },
  exportPresentation: { activeLabel: 'Preparing deck export', completedLabel: 'Deck export prepared' },
  addSectionElement: { activeLabel: 'Adding container section', completedLabel: 'Container section added' },
  addLineElement: { activeLabel: 'Adding connecting line', completedLabel: 'Connecting line added' },
  applyAnimation: { activeLabel: 'Applying animation', completedLabel: 'Animation applied' },
  applyAnimationToAll: { activeLabel: 'Animating slide elements', completedLabel: 'All slide elements animated' },
  setTransition: { activeLabel: 'Setting transition', completedLabel: 'Transition set' },
  goToSlide: { activeLabel: 'Navigating to slide', completedLabel: 'Navigated to slide' },
  getProjectContext: { activeLabel: 'Reading project state', completedLabel: 'Project state read' },
  setSlideBackground: { activeLabel: 'Updating slide background', completedLabel: 'Slide background updated' },
  deleteSlide: { activeLabel: 'Deleting slide', completedLabel: 'Slide deleted' },
}

// ── Extract Inner Sub-Operations ──────────────────────────────────

export function getSubOperations(toolName: string, input: any, output: any): string[] {
  const ops: string[] = []
  const args = input || {}
  const res = output || {}

  switch (toolName) {
    case 'generateDiagram': {
      if (Array.isArray(args.sections) && args.sections.length > 0) {
        args.sections.forEach((sec: any) => {
          ops.push(`Boundary section: "${sec.label || sec.id}"`)
        })
      }
      if (Array.isArray(args.nodes)) {
        args.nodes.forEach((node: any) => {
          ops.push(`Node: "${node.label || node.id}" (${node.shapeType || 'box'})`)
        })
      }
      if (Array.isArray(args.edges)) {
        args.edges.forEach((edge: any) => {
          ops.push(`Connector: ${edge.from} ➔ ${edge.to}${edge.label ? ` ("${edge.label}")` : ''}`)
        })
      }
      if (res.data?.placedShapes) {
        ops.push(`Auto-centered ${res.data.placedShapes} nodes & ${res.data.placedLines || 0} lines`)
      }
      break
    }
    case 'synthesizeDeckFromDocument': {
      if (Array.isArray(args.slides)) {
        args.slides.forEach((sl: any, i: number) => {
          ops.push(`Slide ${i + 1}: "${sl.name}" (${(sl.nodes || []).length} nodes, ${(sl.edges || []).length} lines)`)
        })
      }
      if (res.data?.slidesCreated) {
        ops.push(`Compiled ${res.data.slidesCreated} slides with Magic Move transitions`)
      }
      break
    }
    case 'patchDiagram': {
      if (Array.isArray(args.addNodes)) {
        args.addNodes.forEach((node: any) => {
          ops.push(`Inserted node: "${node.label || node.id}" (${node.shapeType || 'box'})`)
        })
      }
      if (Array.isArray(args.removeNodeIds)) {
        args.removeNodeIds.forEach((id: string) => {
          ops.push(`Removed node: "${id}"`)
        })
      }
      if (Array.isArray(args.addEdges)) {
        args.addEdges.forEach((edge: any) => {
          ops.push(`Routed connector: ${edge.from} ➔ ${edge.to}`)
        })
      }
      break
    }
    case 'choreographFlow': {
      if (Array.isArray(args.flowSequence)) {
        ops.push(`Causal sequence: ${args.flowSequence.join(' ➔ ')}`)
        ops.push(`Staggered entrance delays (${args.stepDelay || 0.4}s) and line draws`)
      }
      break
    }
    case 'optimizeMagicMove': {
      if (res.data?.totalMatchedNodes !== undefined) {
        ops.push(`Matched ${res.data.totalMatchedNodes} shared entities across slides`)
      }
      if (res.data?.totalReconciledNodes) {
        ops.push(`Reconciled ${res.data.totalReconciledNodes} entity IDs for FLIP morphing`)
      }
      break
    }
    case 'applyDeckTheme': {
      if (args.theme) ops.push(`Theme palette: ${args.theme}`)
      if (args.fontFamily) ops.push(`Font family: ${args.fontFamily}`)
      break
    }
    case 'createExploratoryBranch': {
      if (args.branchName) ops.push(`Branch: "${args.branchName}" created and checked out`)
      break
    }
    case 'auditPresentationQuality': {
      if (res.data?.qualityScore !== undefined) {
        ops.push(`Quality Score: ${res.data.qualityScore}/100 | Contrast: ${res.data.contrastViolations || 0} issues | Density: ${res.data.densityWarnings || 0}`)
      }
      break
    }
    case 'generateSpeakerNotes': {
      if (args.style) ops.push(`Generated ${args.style} talking points and presenter cues`)
      break
    }
    default: {
      if (args.label || args.text) {
        ops.push(`Target: "${args.label || args.text}"`)
      }
    }
  }

  return ops
}

export function getToolMeta(toolName: string): ToolMeta {
  const meta = TOOL_META[toolName]
  if (meta) return meta
  const readable = toolName.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
  return { activeLabel: readable, completedLabel: readable }
}
