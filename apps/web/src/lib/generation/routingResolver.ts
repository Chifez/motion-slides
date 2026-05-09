/**
 * routingResolver.ts
 *
 * Converts semantic routing hints into SVG path data.
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
      return `M ${fx} ${fy} L ${tx} ${ty}`;

    case 'arc-right': {
      const dx = tx - fx;
      const dy = ty - fy;
      const len = Math.hypot(dx, dy);
      const cx = mx + (dy / len) * len * 0.25;
      const cy = my - (dx / len) * len * 0.25;
      return `M ${fx} ${fy} Q ${cx} ${cy} ${tx} ${ty}`;
    }

    case 'arc-left': {
      const dx = tx - fx;
      const dy = ty - fy;
      const len = Math.hypot(dx, dy);
      const cx = mx - (dy / len) * len * 0.25;
      const cy = my + (dx / len) * len * 0.25;
      return `M ${fx} ${fy} Q ${cx} ${cy} ${tx} ${ty}`;
    }

    case 'bypass-top': {
      const topY = Math.min(fy, ty) - 60;
      return `M ${fx} ${fy} L ${fx} ${topY} L ${tx} ${topY} L ${tx} ${ty}`;
    }

    case 'bypass-bottom': {
      const botY = Math.max(fy, ty) + 60;
      return `M ${fx} ${fy} L ${fx} ${botY} L ${tx} ${botY} L ${tx} ${ty}`;
    }

    case 'elbow-h':
      return `M ${fx} ${fy} L ${tx} ${fy} L ${tx} ${ty}`;

    case 'elbow-v':
      return `M ${fx} ${fy} L ${fx} ${ty} L ${tx} ${ty}`;

    case 's-curve':
      return `M ${fx} ${fy} C ${mx} ${fy}, ${mx} ${ty}, ${tx} ${ty}`;

    default:
      return `M ${fx} ${fy} L ${tx} ${ty}`;
  }
}
