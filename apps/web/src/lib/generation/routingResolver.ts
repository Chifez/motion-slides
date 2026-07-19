/**
 * routingResolver.ts
 *
 * Converts semantic routing hints into SVG path data with smooth rounded corners.
 */

export type RoutingHint =
  | 'straight'
  | 'arc-right'
  | 'arc-left'
  | 'bypass-top'
  | 'bypass-bottom'
  | 'elbow-h'
  | 'elbow-v'
  | 's-curve';

type Point = { x: number; y: number };

/**
 * buildRoundedPath
 *
 * Geometric helper that connects a series of points with straight lines,
 * replacing sharp corners with smooth quadratic Bezier arcs (Q commands).
 */
export function buildRoundedPath(points: Point[], radius = 16): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Direction vectors
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const len1 = Math.hypot(dx1, dy1);

    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const len2 = Math.hypot(dx2, dy2);

    if (len1 === 0 || len2 === 0) {
      path += ` L ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
      continue;
    }

    // Limit radius to half the length of adjacent segments to prevent overlaps
    const r = Math.min(radius, len1 / 2, len2 / 2);

    // Tangent points
    const ax = curr.x - (dx1 / len1) * r;
    const ay = curr.y - (dy1 / len1) * r;

    const bx = curr.x + (dx2 / len2) * r;
    const by = curr.y + (dy2 / len2) * r;

    // Draw straight line to tangent start A, then quadratic Bezier curve to tangent end B
    path += ` L ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
  }

  // Draw final line to the last point
  const last = points[points.length - 1];
  path += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;

  return path;
}

export function resolveRoute(
  routing: RoutingHint | undefined,
  from: Point,
  to: Point,
  canvasW: number,
  canvasH: number
): string {
  // Convert normalized [0-1] to pixels
  const fx = from.x * canvasW;
  const fy = from.y * canvasH;
  const tx = to.x * canvasW;
  const ty = to.y * canvasH;
  
  const mx = (fx + tx) / 2;
  const my = (fy + ty) / 2;

  switch (routing) {
    case 'straight':
    case undefined:
      return `M ${fx.toFixed(1)} ${fy.toFixed(1)} L ${tx.toFixed(1)} ${ty.toFixed(1)}`;

    case 'arc-right': {
      const dx = tx - fx;
      const dy = ty - fy;
      const len = Math.hypot(dx, dy);
      const cx = mx + (dy / len) * len * 0.25;
      const cy = my - (dx / len) * len * 0.25;
      return `M ${fx.toFixed(1)} ${fy.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`;
    }

    case 'arc-left': {
      const dx = tx - fx;
      const dy = ty - fy;
      const len = Math.hypot(dx, dy);
      const cx = mx - (dy / len) * len * 0.25;
      const cy = my + (dx / len) * len * 0.25;
      return `M ${fx.toFixed(1)} ${fy.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`;
    }

    case 'bypass-top': {
      const topY = Math.min(fy, ty) - 60;
      return buildRoundedPath([
        { x: fx, y: fy },
        { x: fx, y: topY },
        { x: tx, y: topY },
        { x: tx, y: ty }
      ]);
    }

    case 'bypass-bottom': {
      const botY = Math.max(fy, ty) + 60;
      return buildRoundedPath([
        { x: fx, y: fy },
        { x: fx, y: botY },
        { x: tx, y: botY },
        { x: tx, y: ty }
      ]);
    }

    case 'elbow-h':
      return buildRoundedPath([
        { x: fx, y: fy },
        { x: tx, y: fy },
        { x: tx, y: ty }
      ]);

    case 'elbow-v':
      return buildRoundedPath([
        { x: fx, y: fy },
        { x: fx, y: ty },
        { x: tx, y: ty }
      ]);

    case 's-curve':
      return `M ${fx.toFixed(1)} ${fy.toFixed(1)} C ${mx.toFixed(1)} ${fy.toFixed(1)}, ${mx.toFixed(1)} ${ty.toFixed(1)}, ${tx.toFixed(1)} ${ty.toFixed(1)}`;

    default:
      return `M ${fx.toFixed(1)} ${fy.toFixed(1)} L ${tx.toFixed(1)} ${ty.toFixed(1)}`;
  }
}
