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
  content: { value: 'Text', fontSize: 28, fontWeight: 'bold' as const, color: '#ffffff', align: 'left' as const },
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
