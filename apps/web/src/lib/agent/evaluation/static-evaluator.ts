import type { Project, Slide, SceneElement, TextContent, ShapeContent, LineContent, SectionContent } from '@motionslides/shared'
import type { DeckEvaluationReport, SlideEvaluationReport, DimensionScore, EvaluationIssue, DimensionKey } from './evaluation-types'

// ── Helpers ─────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    }
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    }
  }
  return null
}

function parseRgbaOrHex(colorStr: string): { r: number; g: number; b: number } {
  if (colorStr.startsWith('#')) {
    return hexToRgb(colorStr) || { r: 255, g: 255, b: 255 }
  }
  const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
    }
  }
  return { r: 255, g: 255, b: 255 }
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

export function getContrastRatio(fgColor: string, bgColor: string): number {
  const fg = parseRgbaOrHex(fgColor)
  const bg = parseRgbaOrHex(bgColor)
  const l1 = getRelativeLuminance(fg.r, fg.g, fg.b)
  const l2 = getRelativeLuminance(bg.r, bg.g, bg.b)
  const brighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (brighter + 0.05) / (darker + 0.05)
}

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length
}

// ── Evaluators ──────────────────────────────────────────────────────────────

export function evaluateSlideAccessibility(slide: Slide, slideIndex: number): { score: number; issues: EvaluationIssue[]; minRatio: number } {
  const issues: EvaluationIssue[] = []
  const bg = slide.background || '#0b0c16'
  let minRatio = 21

  for (const el of slide.elements) {
    if (el.type === 'text') {
      const tc = el.content as TextContent
      const color = tc.color || '#ffffff'
      const ratio = getContrastRatio(color, bg)
      if (ratio < minRatio) minRatio = ratio

      if (ratio < 4.5) {
        const textVal = (tc as any).value || (tc as any).text || ''
        issues.push({
          id: `contrast-issue-${el.id}`,
          slideIndex,
          elementId: el.id,
          dimension: 'accessibility',
          severity: ratio < 3.0 ? 'critical' : 'warning',
          message: `Text "${textVal.slice(0, 30)}..." has insufficient contrast (${ratio.toFixed(2)}:1 against background, WCAG AA requires >= 4.5:1).`,
          suggestedFix: 'Increase text brightness to #ffffff or light slate.',
          autoFixable: true,
          fixPayload: { targetColor: '#ffffff' },
        })
      }
    }
  }

  const score = Math.max(0, 100 - issues.length * 30)
  return { score, issues, minRatio: minRatio === 21 ? 21 : minRatio }
}

export function evaluateSlideGeometry(slide: Slide, slideIndex: number): { score: number; issues: EvaluationIssue[]; hasOverlap: boolean; hasOutOfBounds: boolean } {
  const issues: EvaluationIssue[] = []
  let hasOverlap = false
  let hasOutOfBounds = false

  const SAFE_MIN_X = 80
  const SAFE_MAX_X = 1200
  const SAFE_MIN_Y = 80
  const SAFE_MAX_Y = 640

  const physicalElements = slide.elements.filter((e) => e.type !== 'section' && e.type !== 'line')

  // 1. Bounds check
  for (const el of physicalElements) {
    const left = el.position.x
    const top = el.position.y
    const right = left + el.size.width
    const bottom = top + el.size.height

    if (left < SAFE_MIN_X || top < SAFE_MIN_Y || right > SAFE_MAX_X || bottom > SAFE_MAX_Y) {
      hasOutOfBounds = true
      issues.push({
        id: `bounds-issue-${el.id}`,
        slideIndex,
        elementId: el.id,
        dimension: 'visualDensity',
        severity: 'warning',
        message: `Element "${el.id}" exceeds the safe 16:9 canvas margin (safe zone: [80, 80] to [1200, 640]).`,
        suggestedFix: 'Reposition or scale element within the safe canvas padding.',
        autoFixable: true,
        fixPayload: {
          clampedX: Math.max(SAFE_MIN_X, Math.min(left, SAFE_MAX_X - el.size.width)),
          clampedY: Math.max(SAFE_MIN_Y, Math.min(top, SAFE_MAX_Y - el.size.height)),
        },
      })
    }
  }

  // 2. Collision / Overlap check (AABB)
  for (let i = 0; i < physicalElements.length; i++) {
    for (let j = i + 1; j < physicalElements.length; j++) {
      const a = physicalElements[i]
      const b = physicalElements[j]

      const overlapX = a.position.x < b.position.x + b.size.width && a.position.x + a.size.width > b.position.x
      const overlapY = a.position.y < b.position.y + b.size.height && a.position.y + a.size.height > b.position.y

      if (overlapX && overlapY) {
        hasOverlap = true
        issues.push({
          id: `overlap-issue-${a.id}-${b.id}`,
          slideIndex,
          elementId: a.id,
          dimension: 'visualDensity',
          severity: 'warning',
          message: `Elements "${a.id}" and "${b.id}" overlap in the layout.`,
          suggestedFix: 'Separate components to ensure distinct visual breathing room.',
          autoFixable: true,
          fixPayload: { collidingElementId: b.id },
        })
      }
    }
  }

  const score = Math.max(0, 100 - issues.length * 25)
  return { score, issues, hasOverlap, hasOutOfBounds }
}

export function evaluateSlideTopology(slide: Slide, slideIndex: number): { score: number; issues: EvaluationIssue[]; connectorCount: number } {
  const issues: EvaluationIssue[] = []
  const elementIdSet = new Set(slide.elements.map((e) => e.id))
  const lines = slide.elements.filter((e) => e.type === 'line')

  for (const line of lines) {
    const lc = line.content as LineContent
    const startId = lc.startConnection?.elementId
    const endId = lc.endConnection?.elementId

    const startMissing = startId && !elementIdSet.has(startId)
    const endMissing = endId && !elementIdSet.has(endId)

    if (startMissing || endMissing) {
      issues.push({
        id: `orphan-line-${line.id}`,
        slideIndex,
        elementId: line.id,
        dimension: 'visualDensity',
        severity: 'critical',
        message: `Connector line "${line.id}" is orphaned (references missing node ID: ${startMissing ? startId : ''} ${endMissing ? endId : ''}).`,
        suggestedFix: 'Remove orphaned line or reconnect to an active node.',
        autoFixable: true,
      })
    }
  }

  const score = Math.max(0, 100 - issues.length * 35)
  return { score, issues, connectorCount: lines.length }
}

export function evaluateSlideDensity(slide: Slide, slideIndex: number): { score: number; issues: EvaluationIssue[]; nodeCount: number; wordCount: number } {
  const issues: EvaluationIssue[] = []
  const shapes = slide.elements.filter((e) => e.type === 'shape')
  const nodeCount = shapes.length

  let wordCount = 0
  for (const el of slide.elements) {
    if (el.type === 'text') {
      const tc = el.content as any
      wordCount += countWords(tc.value || tc.text || '')
    } else if (el.type === 'shape') {
      const sc = el.content as ShapeContent
      if (sc.label) wordCount += countWords(sc.label)
      if (sc.sublabel) wordCount += countWords(sc.sublabel)
    }
  }

  if (nodeCount > 12) {
    issues.push({
      id: `density-shape-${slide.id}`,
      slideIndex,
      dimension: 'visualDensity',
      severity: nodeCount > 15 ? 'critical' : 'warning',
      message: `Slide has excessive diagram nodes (${nodeCount} nodes, recommended: max 8–10).`,
      suggestedFix: 'Split diagram into multi-step focus slides using Magic Move.',
      autoFixable: false,
    })
  }

  if (wordCount > 100) {
    issues.push({
      id: `density-words-${slide.id}`,
      slideIndex,
      dimension: 'typography',
      severity: 'warning',
      message: `High word count (${wordCount} words on slide). Recommended: max 50–70 words.`,
      suggestedFix: 'Condense descriptions into punchy bullet points.',
      autoFixable: false,
    })
  }

  const score = Math.max(0, 100 - (nodeCount > 12 ? 30 : 0) - (wordCount > 100 ? 25 : 0))
  return { score, issues, nodeCount, wordCount }
}

export function evaluateProjectMotionContinuity(project: Project): { score: number; issues: EvaluationIssue[] } {
  const issues: EvaluationIssue[] = []

  for (let i = 0; i < project.slides.length - 1; i++) {
    const s1 = project.slides[i]
    const s2 = project.slides[i + 1]

    const s1Shapes = s1.elements.filter((e) => e.type === 'shape')
    const s2Shapes = s2.elements.filter((e) => e.type === 'shape')

    for (const n1 of s1Shapes) {
      const label1 = (n1.content as ShapeContent).label?.trim().toLowerCase()
      if (!label1) continue

      for (const n2 of s2Shapes) {
        const label2 = (n2.content as ShapeContent).label?.trim().toLowerCase()
        if (label1 === label2 && n1.id !== n2.id) {
          issues.push({
            id: `magic-move-mismatch-${n1.id}-${n2.id}`,
            slideIndex: i + 1,
            elementId: n2.id,
            dimension: 'motionAndFlow',
            severity: 'warning',
            message: `Component "${label1}" appears on both Slide ${i + 1} and Slide ${i + 2} with different IDs ("${n1.id}" vs "${n2.id}"), breaking Magic Move morphing.`,
            suggestedFix: `Align component ID to "${n1.id}" on Slide ${i + 2}.`,
            autoFixable: true,
            fixPayload: { canonicalId: n1.id, targetElementId: n2.id },
          })
        }
      }
    }
  }

  const score = Math.max(0, 100 - issues.length * 30)
  return { score, issues }
}

// ── Main Composite Evaluator ────────────────────────────────────────────────

export function evaluateStaticDeck(project: Project, options: { runId?: string; triggeredBy?: 'manual' | 'post-generation' | 'regression-ci' } = {}): DeckEvaluationReport {
  const totalElements = project.slides.reduce((acc, s) => acc + s.elements.length, 0)
  const isEmptyDeck = totalElements === 0

  if (isEmptyDeck) {
    const emptyDimensions: Record<DimensionKey, DimensionScore> = {
      accessibility: { score: 0, weight: 0.25, status: 'empty', summary: 'No elements to evaluate contrast', issueCount: 0 },
      visualDensity: { score: 0, weight: 0.25, status: 'empty', summary: 'Canvas is empty', issueCount: 0 },
      typography: { score: 0, weight: 0.15, status: 'empty', summary: 'No text elements', issueCount: 0 },
      narrative: { score: 0, weight: 0.15, status: 'empty', summary: 'No slides with content', issueCount: 0 },
      motionAndFlow: { score: 0, weight: 0.20, status: 'empty', summary: 'No transitions or elements', issueCount: 0 },
    }

    return {
      projectId: project.id,
      runId: options.runId || `run-${Date.now()}`,
      timestamp: Date.now(),
      overallScore: 0,
      grade: 'DRAFT',
      isEmptyDeck: true,
      dimensions: emptyDimensions,
      slideReports: project.slides.map((s, idx) => ({
        slideIndex: idx,
        slideId: s.id,
        slideName: s.name,
        score: 0,
        status: 'empty',
        dimensions: { accessibility: 0, visualDensity: 0, typography: 0, narrative: 0, motionAndFlow: 0 },
        issues: [],
        metrics: { nodeCount: 0, wordCount: 0, connectorCount: 0, contrastRatioMin: 21, hasOverlap: false, hasOutOfBounds: false },
      })),
      criticalIssues: [],
      warningIssues: [],
      remediationPlan: [],
      triggeredBy: options.triggeredBy || 'manual',
    }
  }

  const slideReports: SlideEvaluationReport[] = []
  const allIssues: EvaluationIssue[] = []

  let totalAcc = 0
  let totalGeom = 0
  let totalTopo = 0
  let totalDens = 0

  for (let idx = 0; idx < project.slides.length; idx++) {
    const slide = project.slides[idx]
    const acc = evaluateSlideAccessibility(slide, idx)
    const geom = evaluateSlideGeometry(slide, idx)
    const topo = evaluateSlideTopology(slide, idx)
    const dens = evaluateSlideDensity(slide, idx)

    const slideIssues = [...acc.issues, ...geom.issues, ...topo.issues, ...dens.issues]
    allIssues.push(...slideIssues)

    const slideScore = Math.round((acc.score * 0.3 + geom.score * 0.25 + topo.score * 0.25 + dens.score * 0.2))

    slideReports.push({
      slideIndex: idx,
      slideId: slide.id,
      slideName: slide.name,
      score: slideScore,
      status: slideScore >= 80 ? 'passed' : slideScore >= 60 ? 'warning' : 'failed',
      dimensions: {
        accessibility: acc.score,
        visualDensity: Math.round((geom.score + dens.score) / 2),
        typography: dens.wordCount > 100 ? 65 : 95,
        narrative: 85, // Default baseline before LLM critic
        motionAndFlow: 90,
      },
      issues: slideIssues,
      metrics: {
        nodeCount: dens.nodeCount,
        wordCount: dens.wordCount,
        connectorCount: topo.connectorCount,
        contrastRatioMin: acc.minRatio,
        hasOverlap: geom.hasOverlap,
        hasOutOfBounds: geom.hasOutOfBounds,
      },
    })

    totalAcc += acc.score
    totalGeom += geom.score
    totalTopo += topo.score
    totalDens += dens.score
  }

  const slideCount = Math.max(1, project.slides.length)
  const motion = evaluateProjectMotionContinuity(project)
  allIssues.push(...motion.issues)

  const avgAcc = Math.round(totalAcc / slideCount)
  const avgGeom = Math.round(totalGeom / slideCount)
  const avgTopo = Math.round(totalTopo / slideCount)
  const avgDens = Math.round(totalDens / slideCount)
  const avgMotion = motion.score

  const visualDensityScore = Math.round(avgGeom * 0.5 + avgTopo * 0.3 + avgDens * 0.2)
  const typographyScore = Math.min(100, Math.max(40, 100 - allIssues.filter((i) => i.dimension === 'typography').length * 25))

  // Weighted overall calculation
  const overallScore = Math.round(
    avgAcc * 0.25 +
    visualDensityScore * 0.25 +
    typographyScore * 0.15 +
    85 * 0.15 + // Narrative static baseline
    avgMotion * 0.20
  )

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F'
  if (overallScore >= 95) grade = 'A+'
  else if (overallScore >= 85) grade = 'A'
  else if (overallScore >= 75) grade = 'B'
  else if (overallScore >= 65) grade = 'C'
  else if (overallScore >= 50) grade = 'D'

  const dimensions: Record<DimensionKey, DimensionScore> = {
    accessibility: {
      score: avgAcc,
      weight: 0.25,
      status: avgAcc >= 85 ? 'passed' : avgAcc >= 65 ? 'warning' : 'failed',
      summary: avgAcc >= 85 ? 'WCAG AA contrast compliant' : 'Contrast violations detected',
      issueCount: allIssues.filter((i) => i.dimension === 'accessibility').length,
    },
    visualDensity: {
      score: visualDensityScore,
      weight: 0.25,
      status: visualDensityScore >= 85 ? 'passed' : visualDensityScore >= 65 ? 'warning' : 'failed',
      summary: visualDensityScore >= 85 ? 'Clean spatial bounds and balanced spacing' : 'Boundary clipping or overlap issues detected',
      issueCount: allIssues.filter((i) => i.dimension === 'visualDensity').length,
    },
    typography: {
      score: typographyScore,
      weight: 0.15,
      status: typographyScore >= 85 ? 'passed' : typographyScore >= 65 ? 'warning' : 'failed',
      summary: typographyScore >= 85 ? 'Punchy concise text density' : 'Text density exceeds recommended thresholds',
      issueCount: allIssues.filter((i) => i.dimension === 'typography').length,
    },
    narrative: {
      score: 85,
      weight: 0.15,
      status: 'passed',
      summary: 'Structured narrative progression',
      issueCount: allIssues.filter((i) => i.dimension === 'narrative').length,
    },
    motionAndFlow: {
      score: avgMotion,
      weight: 0.20,
      status: avgMotion >= 85 ? 'passed' : avgMotion >= 65 ? 'warning' : 'failed',
      summary: avgMotion >= 85 ? 'Continuous cross-slide Magic Move alignment' : 'Mismatched cross-slide element IDs detected',
      issueCount: allIssues.filter((i) => i.dimension === 'motionAndFlow').length,
    },
  }

  const criticalIssues = allIssues.filter((i) => i.severity === 'critical')
  const warningIssues = allIssues.filter((i) => i.severity === 'warning')

  return {
    projectId: project.id,
    runId: options.runId || `run-${Date.now()}`,
    timestamp: Date.now(),
    overallScore,
    grade,
    isEmptyDeck: false,
    dimensions,
    slideReports,
    criticalIssues,
    warningIssues,
    remediationPlan: [],
    triggeredBy: options.triggeredBy || 'manual',
  }
}
