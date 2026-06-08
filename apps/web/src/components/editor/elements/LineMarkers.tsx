import React from 'react'

interface LineMarkersProps {
  uniqueColors: string[]
  sanitizeId: (color: string) => string
}

export function LineMarkers({ uniqueColors, sanitizeId }: LineMarkersProps) {
  return (
    <defs>
      {uniqueColors.map(color => (
        <React.Fragment key={color}>
          <marker
            id={`arrow-end-${sanitizeId(color)}`}
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0,0 L0,12 L12,6 z" fill={color} />
          </marker>
          <marker
            id={`arrow-start-${sanitizeId(color)}`}
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto-start-reverse"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0,0 L0,12 L12,6 z" fill={color} />
          </marker>
        </React.Fragment>
      ))}
    </defs>
  )
}
