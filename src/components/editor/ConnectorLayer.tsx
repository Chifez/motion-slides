import { useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { nanoid } from '@/lib/nanoid'
import type { Slide, SceneElement, AnchorPosition } from '@/types'

interface Props {
  slide: Slide
  elements: SceneElement[]
}

/** Returns the position of an anchor point on an element */
function getAnchorPos(el: SceneElement, anchor: AnchorPosition) {
  const { x, y } = el.position
  const { width: w, height: h } = el.size
  switch (anchor) {
    case 'top': return { x: x + w / 2, y }
    case 'right': return { x: x + w, y: y + h / 2 }
    case 'bottom': return { x: x + w / 2, y: y + h }
    case 'left': return { x, y: y + h / 2 }
  }
}

/** Calculates the best anchor pair between two elements */
function bestAnchors(from: SceneElement, to: SceneElement): { fromAnchor: AnchorPosition; toAnchor: AnchorPosition } {
  const fc = { x: from.position.x + from.size.width / 2, y: from.position.y + from.size.height / 2 }
  const tc = { x: to.position.x + to.size.width / 2, y: to.position.y + to.size.height / 2 }
  const dx = tc.x - fc.x
  const dy = tc.y - fc.y

  let fromAnchor: AnchorPosition
  let toAnchor: AnchorPosition

  if (Math.abs(dx) > Math.abs(dy)) {
    fromAnchor = dx > 0 ? 'right' : 'left'
    toAnchor = dx > 0 ? 'left' : 'right'
  } else {
    fromAnchor = dy > 0 ? 'bottom' : 'top'
    toAnchor = dy > 0 ? 'top' : 'bottom'
  }
  return { fromAnchor, toAnchor }
}

/** Builds a cubic bezier path between two anchor points */
function buildPath(x1: number, y1: number, x2: number, y2: number, fromAnchor: AnchorPosition, toAnchor: AnchorPosition) {
  const dist = Math.max(40, Math.hypot(x2 - x1, y2 - y1) * 0.35)
  const dir: Record<AnchorPosition, { dx: number; dy: number }> = {
    top: { dx: 0, dy: -1 }, right: { dx: 1, dy: 0 },
    bottom: { dx: 0, dy: 1 }, left: { dx: -1, dy: 0 },
  }
  const fd = dir[fromAnchor]
  const td = dir[toAnchor]
  const cx1 = x1 + fd.dx * dist
  const cy1 = y1 + fd.dy * dist
  const cx2 = x2 + td.dx * dist
  const cy2 = y2 + td.dy * dist
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`
}

const ANCHORS: AnchorPosition[] = ['top', 'right', 'bottom', 'left']

export function ConnectorLayer({ slide, elements }: Props) {
  const {
    connectMode, connectSourceId, connectSourceAnchor,
    setConnectSource, addConnection, selectedConnectionId, setSelectedConnection,
    setSelectedElement,
  } = useEditorStore()

  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const elementMap = new Map(elements.map((el) => [el.id, el]))

  const handleAnchorClick = useCallback((elementId: string, anchor: AnchorPosition) => {
    if (!connectMode) return

    if (!connectSourceId) {
      // Set source
      setConnectSource(elementId, anchor)
    } else if (connectSourceId !== elementId && connectSourceAnchor) {
      // Complete connection
      addConnection({
        id: nanoid(),
        fromId: connectSourceId,
        toId: elementId,
        fromAnchor: connectSourceAnchor,
        toAnchor: anchor,
        style: 'solid',
        arrow: 'end',
        color: 'rgba(255,255,255,0.5)',
        strokeWidth: 1.5,
      })
    }
  }, [connectMode, connectSourceId, connectSourceAnchor, setConnectSource, addConnection])

  const handleConnectionClick = useCallback((e: React.MouseEvent, connId: string) => {
    e.stopPropagation()
    setSelectedConnection(connId)
    setSelectedElement(null)
  }, [setSelectedConnection, setSelectedElement])

  // Track mouse for drag preview
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!connectMode || !connectSourceId) return
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const board = svg.parentElement
    if (!board) return
    const scale = board.getBoundingClientRect().width / board.offsetWidth
    setHoverPos({
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    })
  }, [connectMode, connectSourceId])

  const sourceEl = connectSourceId ? elementMap.get(connectSourceId) : null

  return (
    <svg
      className="connector-svg"
      onMouseMove={handleMouseMove}
      style={{ pointerEvents: connectMode ? 'all' : 'none' }}
    >
      <defs>
        <marker id="arrow-default" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.5)" />
        </marker>
        {slide.connections.map((conn) => (
          <marker key={`marker-${conn.id}`} id={`arrow-${conn.id}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={conn.color || 'rgba(255,255,255,0.5)'} />
          </marker>
        ))}
      </defs>

      {/* Rendered connections */}
      {slide.connections.map((conn) => {
        const from = elementMap.get(conn.fromId)
        const to = elementMap.get(conn.toId)
        if (!from || !to) return null

        const fa = conn.fromAnchor || bestAnchors(from, to).fromAnchor
        const ta = conn.toAnchor || bestAnchors(from, to).toAnchor
        const p1 = getAnchorPos(from, fa)
        const p2 = getAnchorPos(to, ta)
        const d = buildPath(p1.x, p1.y, p2.x, p2.y, fa, ta)
        const isSelected = selectedConnectionId === conn.id
        const strokeColor = conn.color || 'rgba(255,255,255,0.3)'
        const sw = conn.strokeWidth || 1.5

        // Midpoint for label
        const mx = (p1.x + p2.x) / 2
        const my = (p1.y + p2.y) / 2

        return (
          <g key={conn.id}>
            {/* Invisible fat hit area */}
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={12}
              style={{ pointerEvents: 'all', cursor: 'pointer' }}
              onClick={(e) => handleConnectionClick(e, conn.id)}
            />
            {/* Visible path */}
            <path
              d={d}
              fill="none"
              stroke={isSelected ? '#3b82f6' : strokeColor}
              strokeWidth={isSelected ? sw + 1 : sw}
              strokeDasharray={conn.style === 'dashed' ? '6 4' : conn.style === 'dotted' ? '2 4' : undefined}
              markerEnd={conn.arrow !== 'none' ? `url(#arrow-${conn.id})` : undefined}
              markerStart={conn.arrow === 'both' ? `url(#arrow-${conn.id})` : undefined}
              style={{ pointerEvents: 'none' }}
            />
            {/* Label */}
            {conn.label && (
              <g>
                <rect
                  x={mx - 4}
                  y={my - 8}
                  width={conn.label.length * 6 + 8}
                  height={16}
                  rx={3}
                  fill="#1a1a1a"
                  fillOpacity={0.9}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={0.5}
                />
                <text
                  x={mx}
                  y={my + 3}
                  fill="#a3a3a3"
                  fontSize="9"
                  fontFamily="Inter, sans-serif"
                >
                  {conn.label}
                </text>
              </g>
            )}
          </g>
        )
      })}

      {/* Drag preview line */}
      {connectMode && connectSourceId && connectSourceAnchor && sourceEl && hoverPos && (
        <line
          x1={getAnchorPos(sourceEl, connectSourceAnchor).x}
          y1={getAnchorPos(sourceEl, connectSourceAnchor).y}
          x2={hoverPos.x}
          y2={hoverPos.y}
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          opacity={0.6}
        />
      )}

      {/* Anchor points on elements when in connect mode */}
      {connectMode && elements.map((el) =>
        ANCHORS.map((anchor) => {
          const pos = getAnchorPos(el, anchor)
          const isSource = connectSourceId === el.id && connectSourceAnchor === anchor
          return (
            <circle
              key={`${el.id}-${anchor}`}
              cx={pos.x}
              cy={pos.y}
              r={5}
              fill={isSource ? '#3b82f6' : '#1a1a1a'}
              stroke={isSource ? '#60a5fa' : 'rgba(255,255,255,0.4)'}
              strokeWidth={1.5}
              style={{ cursor: 'pointer', pointerEvents: 'all' }}
              onClick={(e) => { e.stopPropagation(); handleAnchorClick(el.id, anchor) }}
            />
          )
        }),
      )}
    </svg>
  )
}
