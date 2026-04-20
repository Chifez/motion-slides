// ─────────────────────────────────────────────
// Editor Configuration Constants
// ─────────────────────────────────────────────

import type { ShapeType } from '@/types'

/** Supported programming languages for code blocks */
export const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Bash' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
] as const

/** Shape type options for the inspector dropdown */
export const SHAPE_OPTIONS: { value: ShapeType; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'database', label: 'Database' },
  { value: 'server', label: 'Server' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'client', label: 'Client / Screen' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'user', label: 'User / Actor' },
  { value: 'bucket', label: 'Storage / Bucket' },
  { value: 'queue', label: 'Queue' },
  { value: 'document', label: 'Document' },
]

/** Font weight mapping for text elements */
export const FONT_WEIGHT_MAP = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

/** Available font families for text elements */
export const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter', category: 'sans-serif' },
  { value: 'Outfit', label: 'Outfit', category: 'sans-serif' },
  { value: 'Playfair Display', label: 'Playfair Display', category: 'serif' },
  { value: 'Space Grotesk', label: 'Space Grotesk', category: 'sans-serif' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono', category: 'monospace' },
  { value: 'Georgia', label: 'Georgia', category: 'serif' },
  { value: 'Arial', label: 'Arial', category: 'sans-serif' },
  { value: 'Times New Roman', label: 'Times New Roman', category: 'serif' },
  { value: 'Courier New', label: 'Courier New', category: 'monospace' },
] as const

/** Resize handle positions */
export const RESIZE_HANDLES = ['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'] as const

/** Default configs for creating new elements from the toolbar */
export const DEFAULT_TEXT_ELEMENT = {
  type: 'text' as const,
  position: { x: 100, y: 100 },
  size: { width: 300, height: 60 },
  rotation: 0,
  opacity: 1,
  zIndex: 10,
  content: {
    value: 'Text',
    fontSize: 28,
    fontWeight: 'bold' as const,
    fontFamily: 'Inter',
    fontStyle: 'normal' as const,
    color: '#ffffff',
    align: 'left' as const,
  },
}

export const DEFAULT_CODE_ELEMENT = {
  type: 'code' as const,
  position: { x: 100, y: 200 },
  size: { width: 420, height: 160 },
  rotation: 0,
  opacity: 1,
  zIndex: 10,
  content: { value: '// write code here\n', language: 'javascript' },
}

export const DEFAULT_SHAPE_ELEMENT = {
  type: 'shape' as const,
  position: { x: 200, y: 200 },
  size: { width: 120, height: 120 },
  rotation: 0,
  opacity: 1,
  zIndex: 10,
  content: { shapeType: 'rectangle' as const, fill: '#1e3a5f', stroke: '#3b82f6', label: 'Service' },
}

export const DEFAULT_LINE_ELEMENT = {
  type: 'line' as const,
  position: { x: 100, y: 300 },
  size: { width: 200, height: 100 },
  rotation: 0,
  opacity: 1,
  zIndex: 5,
  content: {
    lineType: 'straight' as const,
    x1: 0, y1: 0,
    x2: 1, y2: 1,
    style: 'solid' as const,
    arrow: 'none' as const,
    color: 'rgba(255,255,255,0.5)',
    strokeWidth: 2,
  },
}

export const DEFAULT_CHART_ELEMENT = {
  type: 'chart' as const,
  position: { x: 100, y: 100 },
  size: { width: 400, height: 280 },
  rotation: 0,
  opacity: 1,
  zIndex: 10,
  content: {
    chartType: 'bar' as const,
    data: [
      { label: 'A', value: 45 },
      { label: 'B', value: 72 },
      { label: 'C', value: 38 },
      { label: 'D', value: 65 },
    ],
    showLabels: true,
    showGrid: true,
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  },
}

/** Line type presets for the toolbar dropdown */
export const LINE_TYPE_OPTIONS = [
  { value: 'straight', label: 'Straight', icon: '—' },
  { value: 'elbow', label: 'Elbow', icon: '⌐' },
  { value: 'curved', label: 'Curved', icon: '∿' },
  { value: 'step-after', label: 'Step After', icon: '┐' },
  { value: 'step-before', label: 'Step Before', icon: '└' },
  { value: 'y-shaped', label: 'Y-Shaped', icon: 'Y' },
] as const

export const CHART_TYPE_OPTIONS = [
  { value: 'line', label: 'Line', icon: '—' },
  { value: 'bar', label: 'Bar', icon: '▎' },
  { value: 'area', label: 'Area', icon: '△' },
  { value: 'pie', label: 'Pie', icon: '○' },
] as const
