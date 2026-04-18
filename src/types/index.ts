// ─────────────────────────────────────────────
// MotionSlides – Core Type Definitions
// ─────────────────────────────────────────────

export type ShapeType =
  | 'rectangle'
  | 'database'
  | 'server'
  | 'cloud'
  | 'client'
  | 'diamond'
  | 'user'
  | 'bucket'
  | 'queue'
  | 'document'

export type LineType = 'straight' | 'elbow' | 'curved' | 'step-after' | 'step-before' | 'y-shaped'

export type ElementType = 'text' | 'code' | 'shape' | 'image' | 'line' | 'chart'

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface TextContent {
  value: string
  fontSize: number
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold'
  fontFamily: string
  fontStyle: 'normal' | 'italic'
  color: string
  align: 'left' | 'center' | 'right'
}

export interface CodeContent {
  value: string
  language: string
  fontSize?: number
  fontFamily?: string
  lineHeight?: number
  theme?: string
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area'

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
  stack?: number[]
}

export interface ChartContent {
  chartType: ChartType
  data: ChartDataPoint[]
  showLabels?: boolean
  showGrid?: boolean
  colors?: string[]
  barSize?: number
  isStacked?: boolean
}

export interface ShapeContent {
  shapeType: ShapeType
  fill: string
  stroke: string
  label?: string
}

export interface LineContent {
  lineType: LineType
  /** Normalized endpoint positions (0–1) relative to the element's bounding box */
  x1: number
  y1: number
  x2: number
  y2: number
  style: 'solid' | 'dashed' | 'dotted'
  arrow: 'none' | 'end' | 'both'
  color: string
  strokeWidth: number
  label?: string
}

export interface SceneElement {
  id: string
  type: ElementType
  position: Position
  size: Size
  rotation: number
  opacity: number
  zIndex: number
  locked?: boolean
  groupId?: string
  content: TextContent | CodeContent | ShapeContent | LineContent | ChartContent
}

export interface Slide {
  id: string
  name: string
  elements: SceneElement[]
  background: string
}

// ─────────────────────────────────────────────
// Animation & Easing
// ─────────────────────────────────────────────

export interface CubicBezier {
  x1: number
  y1: number
  x2: number
  y2: number
}

// ─────────────────────────────────────────────
// Playback & Presentation Settings
// ─────────────────────────────────────────────

export interface PlaybackSettings {
  autoplay: boolean
  autoplayDelay: number
  loop: boolean
  transitionDuration: number
  transitionEase: CubicBezier
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3'
  exportResolution: { width: number; height: number; label: string }
}

// ─────────────────────────────────────────────
// Prototype Mode
// ─────────────────────────────────────────────

export type TransitionAnimation =
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'fade'
  | 'zoom'
  | 'flip'

export interface SlideTransition {
  id: string
  fromSlideId: string
  toSlideId: string
  animation: TransitionAnimation
  duration: number
  ease: CubicBezier
  trigger: 'click' | 'auto'
  autoDelay?: number
}

export interface Project {
  id: string
  name: string
  description: string
  slides: Slide[]
  transitions: SlideTransition[]
  prototypeLayout: Record<string, { x: number; y: number }>
  createdAt: number
  updatedAt: number
  synced: boolean
}
