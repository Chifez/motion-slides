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
        fill="#0f172a"
        fillOpacity={0.95}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={0.75}
      />
      <text
        x={x}
        y={y}
        fill="#ffffff"
        fontSize={fontSize}
        fontFamily="Inter, sans-serif"
        fontWeight={500}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {text}
      </text>
    </g>
  )
}
