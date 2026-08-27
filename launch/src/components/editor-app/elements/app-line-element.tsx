import React from 'react';
import { getArrow } from 'perfect-arrows';

export interface Point {
  x: number;
  y: number;
}

export function buildElbowPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  startHandle = 'right',
  endHandle = 'left'
): Point[] {
  if (Math.abs(x2 - x1) < 0.1 && Math.abs(y2 - y1) < 0.1) {
    return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
  }

  const margin = 20;

  if (startHandle === 'right' && endHandle === 'left') {
    const midX = (x1 + x2) / 2;
    return [
      { x: x1, y: y1 },
      { x: midX, y: y1 },
      { x: midX, y: y2 },
      { x: x2, y: y2 },
    ];
  }

  if (startHandle === 'bottom' && endHandle === 'bottom') {
    const maxY = Math.max(y1 + margin, y2 + margin) + 30;
    return [
      { x: x1, y: y1 },
      { x: x1, y: maxY },
      { x: x2, y: maxY },
      { x: x2, y: y2 },
    ];
  }

  if (startHandle === 'top' && endHandle === 'left') {
    return [
      { x: x1, y: y1 },
      { x: x1, y: y2 },
      { x: x2, y: y2 },
    ];
  }

  if (startHandle === 'bottom' && endHandle === 'left') {
    return [
      { x: x1, y: y1 },
      { x: x1, y: y2 },
      { x: x2, y: y2 },
    ];
  }

  if (startHandle === 'top' && endHandle === 'bottom') {
    const midY = (y1 + y2) / 2;
    return [
      { x: x1, y: y1 },
      { x: x1, y: midY },
      { x: x2, y: midY },
      { x: x2, y: y2 },
    ];
  }

  const midX = (x1 + x2) / 2;
  return [
    { x: x1, y: y1 },
    { x: midX, y: y1 },
    { x: midX, y: y2 },
    { x: x2, y: y2 },
  ];
}

export function buildRoundedPath(points: Point[], radius = 16): string {
  if (points.length <= 1) return '';
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const dPrev = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const dNext = Math.hypot(next.x - curr.x, next.y - curr.y);
    const r = Math.min(radius, dPrev / 2, dNext / 2);

    const startX = curr.x - (r * (curr.x - prev.x)) / dPrev;
    const startY = curr.y - (r * (curr.y - prev.y)) / dPrev;
    const endX = curr.x + (r * (next.x - curr.x)) / dNext;
    const endY = curr.y + (r * (next.y - curr.y)) / dNext;

    path += ` L ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
  }

  const last = points[points.length - 1];
  path += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return path;
}

export interface AppLineElementProps {
  id: string;
  p1: Point;
  p2: Point;
  lineType?: 'straight' | 'elbow' | 'curved';
  style?: 'solid' | 'dashed';
  startHandle?: string;
  endHandle?: string;
  drawProgress?: number;
  strokeColor?: string;
  strokeWidth?: number;
}

export function AppLineElement({
  id,
  p1,
  p2,
  lineType = 'elbow',
  style = 'solid',
  startHandle = 'right',
  endHandle = 'left',
  drawProgress = 1,
  strokeColor = 'rgba(255,255,255,0.75)',
  strokeWidth = 1.5,
}: AppLineElementProps) {
  let pathD = '';

  if (lineType === 'straight') {
    pathD = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  } else if (lineType === 'curved') {
    try {
      const arrow = getArrow(p1.x, p1.y, p2.x, p2.y, {
        bow: 0.2,
        stretch: 0.5,
        padStart: 0,
        padEnd: 0,
        straights: false,
      });
      const [sx, sy, cx, cy, ex, ey] = arrow;
      pathD = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
    } catch {
      pathD = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
  } else {
    const points = buildElbowPoints(p1.x, p1.y, p2.x, p2.y, startHandle, endHandle);
    pathD = buildRoundedPath(points, 16);
  }

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
        overflow: 'visible',
      }}
    >
      <defs>
        <marker
          id={`arrow-${id}`}
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L0,10 L10,5 z" fill={strokeColor} />
        </marker>
      </defs>

      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={style === 'dashed' ? '6 4' : undefined}
        strokeDashoffset={drawProgress < 1 ? (1 - drawProgress) * 600 : undefined}
        markerEnd={`url(#arrow-${id})`}
        opacity={0.8}
      />
    </svg>
  );
}
