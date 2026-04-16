import type { Slide, SceneElement } from '../../types'

interface Props {
  slide: Slide
  elements: SceneElement[]
}

export function ConnectorLayer({ slide, elements }: Props) {
  if (!slide.connections.length) return null

  const elementMap = new Map(elements.map((el) => [el.id, el]))

  return (
    <svg className="connector-svg">
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.5)" />
        </marker>
      </defs>
      {slide.connections.map((conn) => {
        const from = elementMap.get(conn.fromId)
        const to = elementMap.get(conn.toId)
        if (!from || !to) return null

        const x1 = from.position.x + from.size.width / 2
        const y1 = from.position.y + from.size.height / 2
        const x2 = to.position.x + to.size.width / 2
        const y2 = to.position.y + to.size.height / 2

        // Cubic bezier control points for smooth routing
        const dx = x2 - x1
        const cx1 = x1 + dx * 0.4
        const cy1 = y1
        const cx2 = x2 - dx * 0.4
        const cy2 = y2

        const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`

        return (
          <path
            key={conn.id}
            d={d}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
            strokeDasharray={conn.style === 'dashed' ? '6 4' : conn.style === 'dotted' ? '2 4' : undefined}
            markerEnd={conn.arrow !== 'none' ? 'url(#arrow)' : undefined}
            markerStart={conn.arrow === 'both' ? 'url(#arrow)' : undefined}
          />
        )
      })}
    </svg>
  )
}
