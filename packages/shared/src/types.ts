// ─────────────────────────────────────────────
// MotionSlides – Core Type Definitions
// ─────────────────────────────────────────────

export type ShapeType =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'cylinder'
  | 'diamond'
  | 'hexagon'
  | 'database'
  | 'server'
  | 'cloud'
  | 'client'
  | 'user'
  | 'bucket'
  | 'queue'
  | 'document'
  | 'aws-icon'
  | 'gcp-icon'
  | 'icon'

export type LineType = 'straight' | 'elbow' | 'curved' | 'step-after' | 'step-before' | 'branching'

export type ElementType = 'text' | 'code' | 'shape' | 'image' | 'line' | 'chart' | 'section'

export type AspectRatioKey = '16:9' | '9:16' | '1:1' | '4:3' | 'custom'

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
  strokeWidth?: number
  sublabel?: string
  // Cluster support
  isCluster?: boolean
  clusterCount?: number
  stackDirection?: 'right' | 'down' | 'behind'
}

/**
 * SectionContent — visual grouping container for diagram tiers and boundary boxes.
 * Phase 1: Visual wrapper only (no parent/child ownership).
 */
export interface SectionContent {
  label?: string
  sectionRole?: 'layer-bg' | 'cluster-bg' | 'security-perimeter' | 'vpc-boundary'
  backgroundColor: string
  borderColor: string
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none'
  borderWidth: number
  cornerRadius: number
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
  /** For AI-generated semantic routing paths */
  customPath?: string
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
  layer?: string // For architectural diagrams auto-grouping
  animation?: AnimationType
  animationDelay?: number
  autoWidth?: boolean
  autoHeight?: boolean
  content: TextContent | CodeContent | ShapeContent | LineContent | ChartContent | SectionContent
}

export interface SlideAudio {
  id: string
  url: string            // Storage URL or data URI
  fileName: string
  duration: number       // duration in seconds
  volume: number         // 0.0 to 1.0
  loop: boolean
  playbackRate: number   // speed
  trimStart: number      // trim start point (seconds)
  trimEnd: number        // trim end point (seconds)
}

export interface Slide {
  id: string
  name: string
  elements: SceneElement[]
  background: string
  audio?: SlideAudio | null
  customWidth?: number
  customHeight?: number
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
  aspectRatio: AspectRatioKey
  exportResolution: { width: number; height: number; label: string }
  clipContent?: boolean
  backgroundMusic?: SlideAudio | null
  duckBackgroundMusic?: boolean
  customWidth?: number
  customHeight?: number
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
  playbackSettings?: PlaybackSettings
  createdAt: number
  updatedAt: number
  synced: boolean
  /** Metadata for sharing and future database sync */
  shareKey: string
  ownerId?: string
  localAuthorId?: string
  visibility: 'private' | 'link-shared' | 'collaborative' | 'public'
  parentUpdatedAt?: number
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
  audio?:     SlideAudio | null
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
  backgroundMusic?:   SlideAudio | null
  duckBackgroundMusic?: boolean
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

// ─── Storage Abstraction Types ────────────────────────────────────────────────

export interface StorageProvider {
  uploadFile(data: Uint8Array, filename: string, mimeType: string): Promise<{ url: string; key: string }>
  getDownloadUrl(key: string): Promise<string>
  deleteFile(key: string): Promise<void>
}

