import React from 'react'

interface LabelGroupProps {
  text: string
  x: number
  y: number
  fontSize: number
}

export function LabelGroup({ text, x, y, fontSize }: LabelGroupProps) {
  const charWidth = fontSize * 0.6
  const padding = 8
  const width = text.length * charWidth + padding
  const height = fontSize + padding

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={4}
        fill="#1a1a1a"
        fillOpacity={0.92}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={0.5}
      />
      <text
        x={x}
        y={y}
        fill="#a3a3a3"
        fontSize={fontSize}
        fontFamily="Inter, sans-serif"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {text}
      </text>
    </g>
  )
}
