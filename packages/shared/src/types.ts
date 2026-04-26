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
  | 'aws-icon'
  | 'gcp-icon'

export type LineType = 'straight' | 'elbow' | 'curved' | 'step-after' | 'step-before' | 'branching'

export type ElementType = 'text' | 'code' | 'shape' | 'image' | 'line' | 'chart'

export type AspectRatioKey = '16:9' | '9:16' | '1:1' | '4:3'

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
  listStyle?: 'none' | 'bullet' | 'numbered'
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
  iconPath?:     string
  iconCategory?: string
  iconLabel?:    string
}

export interface Connection {
  elementId: string
  handleId: 'top' | 'right' | 'bottom' | 'left' | 'center'
}

export interface BranchContent extends Position {
  /** Stable identifier used as React key; generated on creation, never changes. */
  id?: string
  style?: 'solid' | 'dashed' | 'dotted'
  color?: string
  label?: string
  arrow?: 'none' | 'end'
  connection?: Connection
  labelFontSize?: number
}

export interface LineContent {
  lineType: LineType
  /** Normalized endpoint positions (0–1) relative to the element's bounding box */
  x1: number
  y1: number
  x2: number
  y2: number
  branches?: BranchContent[]
  startConnection?: Connection
  endConnection?: Connection
  style: 'solid' | 'dashed' | 'dotted'
  arrow: 'none' | 'end' | 'both'
  color: string
  strokeWidth: number
  label?: string
  labelFontSize?: number
}

export type AnimationType = 'fade-in' | 'slide-up' | 'slide-left' | 'zoom-in' | 'pop' | 'draw' | 'none'

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
  animation?: AnimationType
  animationDelay?: number
  autoWidth?: boolean
  autoHeight?: boolean
  content: TextContent | CodeContent | ShapeContent | LineContent | ChartContent
}

export interface Slide {
  id: string
  name: string
  elements: SceneElement[]
  background: string
}

// ── AI Chat ───────────────────────────────────────────────────────────────────

export interface AIChatMessage {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  timestamp: number
  /** Present when the message contains generated slides ready to preview */
  slides?:   Slide[]
  /** Present when stage is in progress */
  progress?: {
    stage:   'preparing' | 'capturing' | 'encoding' | 'done' | 'error'
    percent: number
    message: string
  }
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
  | 'magic-move'

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
  /** Metadata for sharing and future database sync */
  shareKey: string
  ownerId?: string
  visibility: 'private' | 'link-shared' | 'public'
}

// ─── Serialized Scene Graph ───────────────────────────────────────────────────

export interface ExportProject {
  project:          SerializedProject
  playbackSettings: SerializedPlaybackSettings
  exportedAt:       number
}

export interface SerializedProject {
  id:     string
  name:   string
  slides: SerializedSlide[]
}

export interface SerializedSlide {
  id:         string
  elements:   SerializedElement[]
  background: string
  transition?: {
    type:      string
    duration:  number
    easing:    string
    direction?: string
    flipAxis?:  string
  }
}

export interface SerializedElement {
  id:       string
  type:     string
  position: { x: number; y: number }
  size:     { width: number; height: number }
  rotation: number
  opacity?: number
  content:  unknown
  style?:   unknown
  zIndex:   number
  [key: string]: unknown
}

export interface SerializedPlaybackSettings {
  exportResolution:   { width: number; height: number }
  transitionDuration: number
  autoplayDelay:      number
  aspectRatio:        string
  transitionType?:    string
  transitionEasing?:  string
}

// ─── Export Engine Types ──────────────────────────────────────────────────────

export type ExportFormat = 'mp4' | 'webm' | 'gif' | 'pdf'

export interface ExportProgressEvent {
  stage:   'preparing' | 'capturing' | 'encoding' | 'done' | 'error'
  percent: number
  message: string
  url?:    string   // present when stage === 'done'
  currentSlide?: number
  totalSlides?:  number
}
