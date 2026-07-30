import { getArrow } from 'perfect-arrows'
import type { LineContent } from '@motionslides/shared'
import { buildRoundedPath } from '@/lib/generation/routingResolver'
export { buildRoundedPath }

/**
 * toSafeNum
 * Ensures coordinate is a number and not NaN/Infinity.
 */
export function toSafeNum(val: any, fallback = 0): number {
  const n = Number(val)
  return isNaN(n) || !isFinite(n) ? fallback : n
}

/**
 * hasValidCoordinates
 * Guard to prevent <path> errors when coordinates aren't ready.
 */
export function hasValidCoordinates(content: LineContent): boolean {
  return (
    typeof content.x1 === 'number' && !isNaN(content.x1) &&
    typeof content.y1 === 'number' && !isNaN(content.y1) &&
    typeof content.x2 === 'number' && !isNaN(content.x2) &&
    typeof content.y2 === 'number' && !isNaN(content.y2)
  )
}

export function buildElbowPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  content: LineContent
): { x: number; y: number }[] {
  if (Math.abs(x2 - x1) < 0.1 && Math.abs(y2 - y1) < 0.1) {
    return [
      { x: x1, y: y1 },
      { x: x2, y: y2 }
    ]
  }

  const startHandle = content.startConnection?.handleId
  const endHandle = content.endConnection?.handleId

  let sHandle = startHandle
  let eHandle = endHandle

  if (!sHandle && !eHandle) {
    if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) {
      sHandle = x2 > x1 ? 'right' : 'left'
      eHandle = x2 > x1 ? 'left' : 'right'
    } else {
      sHandle = y2 > y1 ? 'bottom' : 'top'
      eHandle = y2 > y1 ? 'top' : 'bottom'
    }
  } else if (!sHandle) {
    if (eHandle === 'left') sHandle = 'right'
    else if (eHandle === 'right') sHandle = 'left'
    else if (eHandle === 'top') sHandle = 'bottom'
    else if (eHandle === 'bottom') sHandle = 'top'
  } else if (!eHandle) {
    if (sHandle === 'left') eHandle = 'right'
    else if (sHandle === 'right') eHandle = 'left'
    else if (sHandle === 'top') eHandle = 'bottom'
    else if (sHandle === 'bottom') eHandle = 'top'
  }

  const margin = 20

  if (sHandle === 'top' && eHandle === 'top') {
    const minY = Math.min(y1 - margin, y2 - margin)
    return [
      { x: x1, y: y1 },
      { x: x1, y: minY },
      { x: x2, y: minY },
      { x: x2, y: y2 }
    ]
  }
  if (sHandle === 'bottom' && eHandle === 'bottom') {
    const maxY = Math.max(y1 + margin, y2 + margin)
    return [
      { x: x1, y: y1 },
      { x: x1, y: maxY },
      { x: x2, y: maxY },
      { x: x2, y: y2 }
    ]
  }
  if (sHandle === 'left' && eHandle === 'left') {
    const minX = Math.min(x1 - margin, x2 - margin)
    return [
      { x: x1, y: y1 },
      { x: minX, y: y1 },
      { x: minX, y: y2 },
      { x: x2, y: y2 }
    ]
  }
  if (sHandle === 'right' && eHandle === 'right') {
    const maxX = Math.max(x1 + margin, x2 + margin)
    return [
      { x: x1, y: y1 },
      { x: maxX, y: y1 },
      { x: maxX, y: y2 },
      { x: x2, y: y2 }
    ]
  }

  // Opposite directions
  if (sHandle === 'top' && eHandle === 'bottom') {
    if (y1 - margin > y2 + margin) {
      const midY = (y1 + y2) / 2
      return [
        { x: x1, y: y1 },
        { x: x1, y: midY },
        { x: x2, y: midY },
        { x: x2, y: y2 }
      ]
    } else {
      const midX = (x1 + x2) / 2
      return [
        { x: x1, y: y1 },
        { x: x1, y: y1 - margin },
        { x: midX, y: y1 - margin },
        { x: midX, y: y2 + margin },
        { x: x2, y: y2 + margin },
        { x: x2, y: y2 }
      ]
    }
  }
  if (sHandle === 'bottom' && eHandle === 'top') {
    if (y1 + margin < y2 - margin) {
      const midY = (y1 + y2) / 2
      return [
        { x: x1, y: y1 },
        { x: x1, y: midY },
        { x: x2, y: midY },
        { x: x2, y: y2 }
      ]
    } else {
      const midX = (x1 + x2) / 2
      return [
        { x: x1, y: y1 },
        { x: x1, y: y1 + margin },
        { x: midX, y: y1 + margin },
        { x: midX, y: y2 - margin },
        { x: x2, y: y2 - margin },
        { x: x2, y: y2 }
      ]
    }
  }
  if (sHandle === 'left' && eHandle === 'right') {
    if (x1 - margin > x2 + margin) {
      const midX = (x1 + x2) / 2
      return [
        { x: x1, y: y1 },
        { x: midX, y: y1 },
        { x: midX, y: y2 },
        { x: x2, y: y2 }
      ]
    } else {
      const midY = (y1 + y2) / 2
      return [
        { x: x1, y: y1 },
        { x: x1 - margin, y: y1 },
        { x: x1 - margin, y: midY },
        { x: x2 + margin, y: midY },
        { x: x2 + margin, y: y2 },
        { x: x2, y: y2 }
      ]
    }
  }
  if (sHandle === 'right' && eHandle === 'left') {
    if (x1 + margin < x2 - margin) {
      const midX = (x1 + x2) / 2
      return [
        { x: x1, y: y1 },
        { x: midX, y: y1 },
        { x: midX, y: y2 },
        { x: x2, y: y2 }
      ]
    } else {
      const midY = (y1 + y2) / 2
      return [
        { x: x1, y: y1 },
        { x: x1 + margin, y: y1 },
        { x: x1 + margin, y: midY },
        { x: x2 - margin, y: midY },
        { x: x2 - margin, y: y2 },
        { x: x2, y: y2 }
      ]
    }
  }

  // Perpendicular directions
  if (sHandle === 'top' && eHandle === 'left') {
    return [
      { x: x1, y: y1 },
      { x: x1, y: y1 - margin },
      { x: x2 - margin, y: y1 - margin },
      { x: x2 - margin, y: y2 },
      { x: x2, y: y2 }
    ]
  }
  if (sHandle === 'top' && eHandle === 'right') {
    return [
      { x: x1, y: y1 },
      { x: x1, y: y1 - margin },
      { x: x2 + margin, y: y1 - margin },
      { x: x2 + margin, y: y2 },
      { x: x2, y: y2 }
    ]
  }
  if (sHandle === 'bottom' && eHandle === 'left') {
    return [
      { x: x1, y: y1 },
      { x: x1, y: y1 + margin },
      { x: x2 - margin, y: y1 + margin },
      { x: x2 - margin, y: y2 },
      { x: x2, y: y2 }
    ]
  }
  if (sHandle === 'bottom' && eHandle === 'right') {
    return [
      { x: x1, y: y1 },
      { x: x1, y: y1 + margin },
      { x: x2 + margin, y: y1 + margin },
      { x: x2 + margin, y: y2 },
      { x: x2, y: y2 }
    ]
  }
  if (sHandle === 'left' && eHandle === 'top') {
    return [
      { x: x1, y: y1 },
      { x: x1 - margin, y: y1 },
      { x: x1 - margin, y: y2 - margin },
      { x: x2, y: y2 - margin },
      { x: x2, y: y2 }
    ]
  }
  if (sHandle === 'left' && eHandle === 'bottom') {
    return [
      { x: x1, y: y1 },
      { x: x1 - margin, y: y1 },
      { x: x1 - margin, y: y2 + margin },
      { x: x2, y: y2 + margin },
      { x: x2, y: y2 }
    ]
  }
  if (sHandle === 'right' && eHandle === 'top') {
    return [
      { x: x1, y: y1 },
      { x: x1 + margin, y: y1 },
      { x: x1 + margin, y: y2 - margin },
      { x: x2, y: y2 - margin },
      { x: x2, y: y2 }
    ]
  }
  if (sHandle === 'right' && eHandle === 'bottom') {
    return [
      { x: x1, y: y1 },
      { x: x1 + margin, y: y1 },
      { x: x1 + margin, y: y2 + margin },
      { x: x2, y: y2 + margin },
      { x: x2, y: y2 }
    ]
  }

  // Fallback
  return [
    { x: x1, y: y1 },
    { x: x2, y: y2 }
  ]
}

export function getPathMidpoint(points: { x: number; y: number }[]): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 }
  if (points.length === 1) return points[0]
  
  let totalLength = 0
  const lengths: number[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i+1].x - points[i].x
    const dy = points[i+1].y - points[i].y
    const len = Math.hypot(dx, dy)
    lengths.push(len)
    totalLength += len
  }

  if (totalLength === 0) return points[0]

  const target = totalLength / 2
  let current = 0
  for (let i = 0; i < points.length - 1; i++) {
    const len = lengths[i]
    if (current + len >= target) {
      const remaining = target - current
      const ratio = remaining / len
      const dx = points[i+1].x - points[i].x
      const dy = points[i+1].y - points[i].y
      return {
        x: points[i].x + dx * ratio,
        y: points[i].y + dy * ratio
      }
    }
    current += len
  }

  return points[points.length - 1]
}

export function getLabelPosition(
  w: number,
  h: number,
  content: LineContent
): { x: number; y: number } {
  const x1 = toSafeNum(content.x1) * w
  const y1 = toSafeNum(content.y1) * h
  const x2 = toSafeNum(content.x2) * w
  const y2 = toSafeNum(content.y2) * h

  if (content.lineType === 'straight') {
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
  }

  if (content.lineType === 'curved') {
    if (Math.abs(x1 - x2) < 0.1 && Math.abs(y1 - y2) < 0.1) {
      return { x: x1, y: y1 }
    }
    try {
      const arrow = getArrow(x1, y1, x2, y2, {
        bow: 0.2,
        stretch: 0.5,
        padStart: 0,
        padEnd: 0,
        straights: false,
      })
      const [sx, sy, cx, cy, ex, ey] = arrow
      return {
        x: 0.25 * sx + 0.5 * cx + 0.25 * ex,
        y: 0.25 * sy + 0.5 * cy + 0.25 * ey,
      }
    } catch (e) {
      return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
    }
  }

  let points: { x: number; y: number }[] = []
  if (content.lineType === 'elbow' || content.lineType === 'branching') {
    points = buildElbowPoints(x1, y1, x2, y2, content)
  } else if (content.lineType === 'step-after') {
    points = [
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x2, y: y2 }
    ]
  } else if (content.lineType === 'step-before') {
    points = [
      { x: x1, y: y1 },
      { x: x1, y: y2 },
      { x: x2, y: y2 }
    ]
  } else {
    points = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
  }

  return getPathMidpoint(points)
}

/** Compute SVG path for a line within its bounding box */
export function buildLinePath(w: number, h: number, content: LineContent): string {
  const x1 = toSafeNum(content.x1) * w
  const y1 = toSafeNum(content.y1) * h
  const x2 = toSafeNum(content.x2) * w
  const y2 = toSafeNum(content.y2) * h

  if (content.customPath) return content.customPath

  switch (content.lineType) {
    case 'straight':
      return `M ${x1} ${y1} L ${x2} ${y2}`
    case 'elbow': {
      const points = buildElbowPoints(x1, y1, x2, y2, content)
      return buildRoundedPath(points, 16)
    }
    case 'curved': {
      if (Math.abs(x1 - x2) < 0.1 && Math.abs(y1 - y2) < 0.1) {
        return `M ${x1} ${y1} L ${x2} ${y2}`
      }
      try {
        const arrow = getArrow(x1, y1, x2, y2, {
          bow: 0.2,
          stretch: 0.5,
          padStart: 0,
          padEnd: 0,
          straights: false,
        })
        const [sx, sy, cx, cy, ex, ey] = arrow
        return `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`
      } catch (e) {
        return `M ${x1} ${y1} L ${x2} ${y2}`
      }
    }
    case 'step-after': {
      const points = [
        { x: x1, y: y1 },
        { x: x2, y: y1 },
        { x: x2, y: y2 }
      ]
      return buildRoundedPath(points, 16)
    }
    case 'step-before': {
      const points = [
        { x: x1, y: y1 },
        { x: x1, y: y2 },
        { x: x2, y: y2 }
      ]
      return buildRoundedPath(points, 16)
    }
    case 'branching': {
      const mainPoints = buildElbowPoints(x1, y1, x2, y2, content)
      let path = buildRoundedPath(mainPoints, 16)
      
      if (content.branches) {
        content.branches.forEach(b => {
          const bx = toSafeNum(b.x) * w
          const by = toSafeNum(b.y) * h
          const branchContent: LineContent = {
            ...content,
            startConnection: content.startConnection,
            endConnection: b.connection
          }
          const branchPoints = buildElbowPoints(x1, y1, bx, by, branchContent)
          path += ' ' + buildRoundedPath(branchPoints, 16)
        })
      }
      return path
    }
    default:
      return `M ${x1} ${y1} L ${x2} ${y2}`
  }
}
