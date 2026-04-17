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

export type ElementType = 'text' | 'code' | 'shape' | 'image'

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
  color: string
  align: 'left' | 'center' | 'right'
}

export interface CodeContent {
  value: string
  language: string
}

export interface ShapeContent {
  shapeType: ShapeType
  fill: string
  stroke: string
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
  content: TextContent | CodeContent | ShapeContent
}

export interface Connection {
  id: string
  fromId: string
  toId: string
  label?: string
  style: 'solid' | 'dashed' | 'dotted'
  arrow: 'none' | 'end' | 'both'
}

export interface Slide {
  id: string
  elements: SceneElement[]
  connections: Connection[]
  background: string
}

export interface Project {
  id: string
  name: string
  description: string
  slides: Slide[]
  createdAt: number
  updatedAt: number
  synced: boolean
}

// ─────────────────────────────────────────────
// Playback & Presentation Settings
// ─────────────────────────────────────────────

export interface PlaybackSettings {
  autoplay: boolean
  autoplayDelay: number
  loop: boolean
  transitionDuration: number
  transitionEase: 'spring' | 'ease-out' | 'linear'
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3'
  exportResolution: { width: number; height: number; label: string }
}

