import { useRef, useState, useCallback } from 'react'
import type { CubicBezier } from '@motionslides/shared'
import { BEZIER_PRESETS } from '@/constants/export'

interface Props {
  value: CubicBezier
  onChange: (value: CubicBezier) => void
}

const SIZE = 140
const PAD = 16
const W = SIZE + PAD * 2

/** Clamp a value between min and max */
function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

/** Convert bezier control point to canvas coordinates */
function toCanvas(x: number, y: number): { cx: number; cy: number } {
  return { cx: PAD + x * SIZE, cy: PAD + (1 - y) * SIZE }
}

/** Convert canvas coordinates back to bezier values */
function fromCanvas(cx: number, cy: number): { x: number; y: number } {
  return {
    x: clamp((cx - PAD) / SIZE, 0, 1),
    y: clamp(1 - (cy - PAD) / SIZE, -0.5, 1.5),
  }
}

/** Sample the cubic bezier curve at parameter t */
function sampleBezier(t: number, p0: number, p1: number, p2: number, p3: number) {
  const mt = 1 - t
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3
}

/** Default fallback bezier (Apple ease) */
const DEFAULT_BEZIER: CubicBezier = { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 }

/** Normalize potentially stale string values from persisted sessions */
function normalizeBezier(v: unknown): CubicBezier {
  if (v && typeof v === 'object' && 'x1' in v) return v as CubicBezier
  return { ...DEFAULT_BEZIER }
}

export function BezierEditor({ value: rawValue, onChange }: Props) {
  // Guard against legacy string values (e.g. 'ease-out') still in session storage
  const value = normalizeBezier(rawValue)

  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<'p1' | 'p2' | null>(null)

  const p1 = toCanvas(value.x1, value.y1)
  const p2 = toCanvas(value.x2, value.y2)
  const start = toCanvas(0, 0)
  const end = toCanvas(1, 1)

  // Build the curve path by sampling
  const curvePath = (() => {
    const points: string[] = []
    for (let i = 0; i <= 50; i++) {
      const t = i / 50
      const x = sampleBezier(t, 0, value.x1, value.x2, 1)
      const y = sampleBezier(t, 0, value.y1, value.y2, 1)
      const { cx, cy } = toCanvas(x, y)
      points.push(`${i === 0 ? 'M' : 'L'} ${cx} ${cy}`)
    }
    return points.join(' ')
  })()

  const handlePointerDown = useCallback((point: 'p1' | 'p2') => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(point)
      ; (e.target as SVGElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const { x, y } = fromCanvas(cx, cy)

    if (dragging === 'p1') {
      onChange({ ...value, x1: x, y1: y })
    } else {
      onChange({ ...value, x2: x, y2: y })
    }
  }, [dragging, value, onChange])

  const handlePointerUp = useCallback(() => {
    setDragging(null)
  }, [])

  // Find active preset
  const activePreset = BEZIER_PRESETS.find(
    (p) =>
      Math.abs(p.value.x1 - value.x1) < 0.01 &&
      Math.abs(p.value.y1 - value.y1) < 0.01 &&
      Math.abs(p.value.x2 - value.x2) < 0.01 &&
      Math.abs(p.value.y2 - value.y2) < 0.01,
  )

  return (
    <div className="flex flex-col gap-2">
      {/* SVG Canvas */}
      <div className="bg-[#0d0d0d] rounded-lg border border-white/6 p-1">
        <svg
          ref={svgRef}
          width={W}
          height={W}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ cursor: dragging ? 'grabbing' : 'default', touchAction: 'none' }}
        >
          {/* Grid */}
          <rect x={PAD} y={PAD} width={SIZE} height={SIZE} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          <line x1={PAD} y1={PAD + SIZE / 2} x2={PAD + SIZE} y2={PAD + SIZE / 2} stroke="rgba(255,255,255,0.04)" />
          <line x1={PAD + SIZE / 2} y1={PAD} x2={PAD + SIZE / 2} y2={PAD + SIZE} stroke="rgba(255,255,255,0.04)" />

          {/* Diagonal reference (linear) */}
          <line x1={start.cx} y1={start.cy} x2={end.cx} y2={end.cy} stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="4 3" />

          {/* Control lines */}
          <line x1={start.cx} y1={start.cy} x2={p1.cx} y2={p1.cy} stroke="#3b82f6" strokeWidth={1} opacity={0.5} />
          <line x1={end.cx} y1={end.cy} x2={p2.cx} y2={p2.cy} stroke="#8b5cf6" strokeWidth={1} opacity={0.5} />

          {/* Curve */}
          <path d={curvePath} fill="none" stroke="url(#bezier-grad)" strokeWidth={2.5} strokeLinecap="round" />

          {/* Gradient */}
          <defs>
            <linearGradient id="bezier-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Start / End points */}
          <circle cx={start.cx} cy={start.cy} r={3} fill="#333" stroke="#555" strokeWidth={1} />
          <circle cx={end.cx} cy={end.cy} r={3} fill="#333" stroke="#555" strokeWidth={1} />

          {/* Control point 1 */}
          <circle
            cx={p1.cx} cy={p1.cy} r={6}
            fill={dragging === 'p1' ? '#3b82f6' : '#1e3a5f'}
            stroke="#3b82f6" strokeWidth={2}
            style={{ cursor: 'grab' }}
            onPointerDown={handlePointerDown('p1')}
          />

          {/* Control point 2 */}
          <circle
            cx={p2.cx} cy={p2.cy} r={6}
            fill={dragging === 'p2' ? '#8b5cf6' : '#3b1e5f'}
            stroke="#8b5cf6" strokeWidth={2}
            style={{ cursor: 'grab' }}
            onPointerDown={handlePointerDown('p2')}
          />
        </svg>
      </div>

      {/* Value display */}
      <div className="text-[9px] text-neutral-600 font-mono text-center">
        cubic-bezier({value.x1.toFixed(2)}, {value.y1.toFixed(2)}, {value.x2.toFixed(2)}, {value.y2.toFixed(2)})
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1">
        {BEZIER_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onChange({ ...preset.value })}
            className={`text-[9px] px-2 py-1 rounded-md border transition-colors cursor-pointer ${activePreset?.label === preset.label
                ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                : 'border-white/8 bg-[#1c1c1c] text-neutral-500 hover:text-neutral-200'
              }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
