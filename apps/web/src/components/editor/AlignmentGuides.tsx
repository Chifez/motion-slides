import { useEditorStore } from '@/store/editorStore'

export function AlignmentGuides() {
  const alignmentGuides = useEditorStore(s => s.alignmentGuides ?? [])
  if (alignmentGuides.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-[290]">
      <svg className="w-full h-full" style={{ position: 'absolute', inset: 0 }}>
        {alignmentGuides.map((guide, idx) => {
          if (guide.type === 'v') {
            // Vertical guideline (X is fixed, Y extends from start to end)
            return (
              <line
                key={idx}
                x1={guide.coord}
                y1={guide.start}
                x2={guide.coord}
                y2={guide.end}
                stroke="#ff00ff"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            )
          } else {
            // Horizontal guideline (Y is fixed, X extends from start to end)
            return (
              <line
                key={idx}
                x1={guide.start}
                y1={guide.coord}
                x2={guide.end}
                y2={guide.coord}
                stroke="#ff00ff"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            )
          }
        })}
      </svg>
    </div>
  )
}
