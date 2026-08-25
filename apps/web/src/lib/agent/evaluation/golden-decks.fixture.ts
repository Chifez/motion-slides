import type { Project, Slide, SceneElement } from '@motionslides/shared'

function createBaseProject(id: string, name: string, slides: Slide[]): Project {
  return {
    id,
    name,
    description: `Benchmark project for ${name}`,
    slides,
    transitions: [],
    prototypeLayout: {},
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    synced: true,
    shareKey: id,
    visibility: 'private',
  }
}

/**
 * 1. Flawed Contrast Deck:
 * Contains text elements with dark gray text on a dark canvas (#0b0c16),
 * violating WCAG AA contrast ratio (< 4.5:1).
 */
export const flawedContrastDeck: Project = createBaseProject('flawed-contrast', 'Flawed Contrast Deck', [
  {
    id: 'slide-contrast-1',
    name: 'Unreadable Contrast Slide',
    background: '#0b0c16',
    elements: [
      {
        id: 'title-low-contrast',
        type: 'text',
        position: { x: 100, y: 100 },
        size: { width: 600, height: 60 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        animation: 'none',
        content: {
          value: 'Dark Gray Text on Dark Canvas',
          fontSize: 32,
          fontWeight: 'bold',
          fontFamily: 'Inter',
          fontStyle: 'normal',
          color: '#1a1b26', // Low contrast against #0b0c16 (approx 1.2:1)
          align: 'left',
        },
      },
      {
        id: 'subtitle-low-contrast',
        type: 'text',
        position: { x: 100, y: 180 },
        size: { width: 500, height: 40 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        animation: 'none',
        content: {
          value: 'Secondary subtitle text also unreadable',
          fontSize: 18,
          fontWeight: 'normal',
          fontFamily: 'Inter',
          fontStyle: 'normal',
          color: '#24283b', // Low contrast (approx 1.4:1)
          align: 'left',
        },
      },
    ],
  },
])

/**
 * 2. Overflow Canvas Deck:
 * Elements positioned beyond the safe 16:9 bounds (80px <= x <= 1200px, 80px <= y <= 640px).
 */
export const overflowCanvasDeck: Project = createBaseProject('overflow-canvas', 'Overflow Canvas Deck', [
  {
    id: 'slide-overflow-1',
    name: 'OutOfBounds Slide',
    background: '#0b0c16',
    elements: [
      {
        id: 'box-left-overflow',
        type: 'shape',
        position: { x: 20, y: 120 }, // Violates min X (80px)
        size: { width: 200, height: 100 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        content: {
          shapeType: 'server',
          fill: 'rgba(59, 130, 246, 0.15)',
          stroke: '#3b82f6',
          label: 'Edge Gateway',
        },
      },
      {
        id: 'box-right-overflow',
        type: 'shape',
        position: { x: 1150, y: 120 }, // 1150 + 200 = 1350px (Violates max X 1200px)
        size: { width: 200, height: 100 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        content: {
          shapeType: 'database',
          fill: 'rgba(59, 130, 246, 0.15)',
          stroke: '#3b82f6',
          label: 'Data Warehouse',
        },
      },
      {
        id: 'box-bottom-overflow',
        type: 'shape',
        position: { x: 400, y: 620 }, // 620 + 100 = 720px (Violates max Y 640px)
        size: { width: 200, height: 100 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        content: {
          shapeType: 'bucket',
          fill: 'rgba(59, 130, 246, 0.15)',
          stroke: '#3b82f6',
          label: 'Cold Archive S3',
        },
      },
    ],
  },
])

/**
 * 3. Overlapping Nodes Deck:
 * Shapes and text sharing overlapping Axis-Aligned Bounding Boxes.
 */
export const overlappingNodesDeck: Project = createBaseProject('overlapping-nodes', 'Overlapping Nodes Deck', [
  {
    id: 'slide-overlap-1',
    name: 'Colliding Nodes Slide',
    background: '#0b0c16',
    elements: [
      {
        id: 'node-a',
        type: 'shape',
        position: { x: 200, y: 200 },
        size: { width: 200, height: 100 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        content: {
          shapeType: 'server',
          fill: 'rgba(59, 130, 246, 0.15)',
          stroke: '#3b82f6',
          label: 'Service Alpha',
        },
      },
      {
        id: 'node-b',
        type: 'shape',
        position: { x: 250, y: 230 }, // Substantially overlaps node-a (x: 200-400, y: 200-300)
        size: { width: 200, height: 100 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        content: {
          shapeType: 'server',
          fill: 'rgba(16, 185, 129, 0.15)',
          stroke: '#10b981',
          label: 'Service Beta',
        },
      },
    ],
  },
])

/**
 * 4. Orphaned Connectors Deck:
 * Connector lines whose startConnection or endConnection point to non-existent node IDs.
 */
export const orphanedConnectorsDeck: Project = createBaseProject('orphaned-connectors', 'Orphaned Connectors Deck', [
  {
    id: 'slide-orphans-1',
    name: 'Orphaned Lines Slide',
    background: '#0b0c16',
    elements: [
      {
        id: 'real-node-1',
        type: 'shape',
        position: { x: 150, y: 250 },
        size: { width: 160, height: 80 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        content: {
          shapeType: 'server',
          fill: 'rgba(59, 130, 246, 0.15)',
          stroke: '#3b82f6',
          label: 'Active Node',
        },
      },
      {
        id: 'line-orphan-dead-target',
        type: 'line',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        content: {
          lineType: 'elbow',
          x1: 0,
          y1: 0,
          x2: 1,
          y2: 1,
          style: 'solid',
          arrow: 'end',
          color: '#60a5fa',
          strokeWidth: 2,
          startConnection: { elementId: 'real-node-1', handleId: 'right' },
          endConnection: { elementId: 'deleted-ghost-node-404', handleId: 'left' }, // Orphan
        },
      },
      {
        id: 'line-orphan-both-dead',
        type: 'line',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        content: {
          lineType: 'straight',
          x1: 0,
          y1: 0,
          x2: 1,
          y2: 1,
          style: 'dashed',
          arrow: 'end',
          color: '#60a5fa',
          strokeWidth: 2,
          startConnection: { elementId: 'ghost-source-99', handleId: 'right' },
          endConnection: { elementId: 'ghost-target-99', handleId: 'left' },
        },
      },
    ],
  },
])

/**
 * 5. Broken Magic Move Deck:
 * Two consecutive slides presenting the same entity with mismatched IDs.
 */
export const brokenMagicMoveDeck: Project = createBaseProject('broken-magic-move', 'Broken Magic Move Deck', [
  {
    id: 'slide-mm-1',
    name: 'Overview Architecture',
    background: '#0b0c16',
    elements: [
      {
        id: 'auth-service-slide1-uuid-aaa', // Specific ID on slide 1
        type: 'shape',
        position: { x: 200, y: 200 },
        size: { width: 160, height: 80 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        content: {
          shapeType: 'server',
          fill: 'rgba(59, 130, 246, 0.15)',
          stroke: '#3b82f6',
          label: 'Auth Gateway',
        },
      },
    ],
  },
  {
    id: 'slide-mm-2',
    name: 'Deep Dive Auth Service',
    background: '#0b0c16',
    elements: [
      {
        id: 'auth-service-slide2-uuid-bbb', // DIFFERENT ID on slide 2 (breaks Magic Move morphing)
        type: 'shape',
        position: { x: 500, y: 150 },
        size: { width: 280, height: 140 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        content: {
          shapeType: 'server',
          fill: 'rgba(59, 130, 246, 0.15)',
          stroke: '#3b82f6',
          label: 'Auth Gateway',
        },
      },
    ],
  },
])

/**
 * 6. Overloaded Density Deck:
 * Slides with excessive cognitive load (> 12 nodes, congested layout).
 */
export const overloadedDensityDeck: Project = createBaseProject('overloaded-density', 'Overloaded Density Deck', [
  {
    id: 'slide-dense-1',
    name: 'Overloaded Kitchen Sink Architecture',
    background: '#0b0c16',
    elements: Array.from({ length: 16 }, (_, i) => ({
      id: `dense-node-${i + 1}`,
      type: 'shape' as const,
      position: { x: 100 + (i % 4) * 260, y: 100 + Math.floor(i / 4) * 130 },
      size: { width: 140, height: 70 },
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      content: {
        shapeType: 'server' as const,
        fill: 'rgba(59, 130, 246, 0.15)',
        stroke: '#3b82f6',
        label: `Microservice Component ${i + 1}`,
      },
    })),
  },
])

/**
 * 7. Weak Narrative Deck:
 * Generic slide titles with no clear progression or structure.
 */
export const weakNarrativeDeck: Project = createBaseProject('weak-narrative', 'Weak Narrative Deck', [
  {
    id: 'slide-weak-1',
    name: 'Slide 1',
    background: '#0b0c16',
    elements: [
      {
        id: 't-1',
        type: 'text',
        position: { x: 100, y: 100 },
        size: { width: 400, height: 50 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        content: {
          value: 'Slide 1: Stuff',
          fontSize: 28,
          fontWeight: 'bold',
          fontFamily: 'Inter',
          fontStyle: 'normal',
          color: '#ffffff',
          align: 'left',
        },
      },
    ],
  },
  {
    id: 'slide-weak-2',
    name: 'Slide 2',
    background: '#0b0c16',
    elements: [
      {
        id: 't-2',
        type: 'text',
        position: { x: 100, y: 100 },
        size: { width: 400, height: 50 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        content: {
          value: 'Slide 2: More Stuff',
          fontSize: 28,
          fontWeight: 'bold',
          fontFamily: 'Inter',
          fontStyle: 'normal',
          color: '#ffffff',
          align: 'left',
        },
      },
    ],
  },
])

/**
 * 8. Pristine Golden Deck:
 * Exemplary 4-slide architecture presentation adhering to all guidelines (score >= 95).
 */
export const pristineGoldenDeck: Project = createBaseProject('pristine-golden', 'Enterprise Media Transcoding Engine', [
  {
    id: 'golden-slide-1',
    name: 'Hero Title',
    background: '#0b0c16',
    elements: [
      {
        id: 'hero-title',
        type: 'text',
        position: { x: 120, y: 220 },
        size: { width: 900, height: 80 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        animation: 'fade-in',
        animationDelay: 0,
        content: {
          value: 'Global Distributed Media Transcoder',
          fontSize: 48,
          fontWeight: 'bold',
          fontFamily: 'Inter',
          fontStyle: 'normal',
          color: '#ffffff',
          align: 'left',
        },
      },
      {
        id: 'hero-subtitle',
        type: 'text',
        position: { x: 120, y: 310 },
        size: { width: 800, height: 50 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        animation: 'slide-up',
        animationDelay: 0.3,
        content: {
          value: 'High-throughput 4K video encoding on serverless event mesh',
          fontSize: 22,
          fontWeight: 'normal',
          fontFamily: 'Inter',
          fontStyle: 'normal',
          color: 'rgba(255, 255, 255, 0.75)',
          align: 'left',
        },
      },
    ],
  },
  {
    id: 'golden-slide-2',
    name: 'System Topology',
    background: '#0b0c16',
    elements: [
      {
        id: 'node-edge-cdn', // Stable ID for Magic Move
        type: 'shape',
        position: { x: 120, y: 280 },
        size: { width: 180, height: 90 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        animation: 'pop',
        animationDelay: 0,
        content: {
          shapeType: 'cloud',
          fill: 'rgba(59, 130, 246, 0.15)',
          stroke: '#3b82f6',
          label: 'Cloudflare CDN',
          sublabel: 'Global Edge Ingestion',
        },
      },
      {
        id: 'node-api-gateway', // Stable ID for Magic Move
        type: 'shape',
        position: { x: 420, y: 280 },
        size: { width: 180, height: 90 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        animation: 'pop',
        animationDelay: 0.6,
        content: {
          shapeType: 'server',
          fill: 'rgba(59, 130, 246, 0.15)',
          stroke: '#3b82f6',
          label: 'API Gateway',
          sublabel: 'mTLS Authentication',
        },
      },
      {
        id: 'node-event-mesh', // Stable ID for Magic Move
        type: 'shape',
        position: { x: 720, y: 280 },
        size: { width: 180, height: 90 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        animation: 'pop',
        animationDelay: 1.2,
        content: {
          shapeType: 'queue',
          fill: 'rgba(59, 130, 246, 0.15)',
          stroke: '#3b82f6',
          label: 'Kafka Cluster',
          sublabel: 'Event Streaming',
        },
      },
      {
        id: 'line-edge-to-api',
        type: 'line',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        animation: 'draw',
        animationDelay: 0.3,
        content: {
          lineType: 'elbow',
          x1: 0,
          y1: 0,
          x2: 1,
          y2: 1,
          style: 'solid',
          arrow: 'end',
          color: '#60a5fa',
          strokeWidth: 2,
          label: 'HTTPS / HLS',
          startConnection: { elementId: 'node-edge-cdn', handleId: 'right' },
          endConnection: { elementId: 'node-api-gateway', handleId: 'left' },
        },
      },
      {
        id: 'line-api-to-kafka',
        type: 'line',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        animation: 'draw',
        animationDelay: 0.9,
        content: {
          lineType: 'elbow',
          x1: 0,
          y1: 0,
          x2: 1,
          y2: 1,
          style: 'solid',
          arrow: 'end',
          color: '#60a5fa',
          strokeWidth: 2,
          label: 'Produce Events',
          startConnection: { elementId: 'node-api-gateway', handleId: 'right' },
          endConnection: { elementId: 'node-event-mesh', handleId: 'left' },
        },
      },
    ],
  },
  {
    id: 'golden-slide-3',
    name: 'Event Processing & Storage',
    background: '#0b0c16',
    elements: [
      {
        id: 'node-event-mesh', // Exact same ID morphed from slide 2 via Magic Move
        type: 'shape',
        position: { x: 120, y: 280 },
        size: { width: 180, height: 90 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        content: {
          shapeType: 'queue',
          fill: 'rgba(59, 130, 246, 0.15)',
          stroke: '#3b82f6',
          label: 'Kafka Cluster',
          sublabel: 'Event Streaming',
        },
      },
      {
        id: 'node-transcode-worker',
        type: 'shape',
        position: { x: 450, y: 280 },
        size: { width: 180, height: 90 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        content: {
          shapeType: 'server',
          fill: 'rgba(59, 130, 246, 0.15)',
          stroke: '#3b82f6',
          label: 'FFmpeg Fleet',
          sublabel: 'GPU Cluster Autoscaling',
        },
      },
      {
        id: 'node-s3-storage',
        type: 'shape',
        position: { x: 780, y: 280 },
        size: { width: 180, height: 90 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        content: {
          shapeType: 'bucket',
          fill: 'rgba(59, 130, 246, 0.15)',
          stroke: '#3b82f6',
          label: 'Amazon S3',
          sublabel: 'Multi-Region Output',
        },
      },
      {
        id: 'line-kafka-to-worker',
        type: 'line',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        animation: 'draw',
        animationDelay: 0.3,
        content: {
          lineType: 'elbow',
          x1: 0,
          y1: 0,
          x2: 1,
          y2: 1,
          style: 'solid',
          arrow: 'end',
          color: '#60a5fa',
          strokeWidth: 2,
          label: 'Consume Chunks',
          startConnection: { elementId: 'node-event-mesh', handleId: 'right' },
          endConnection: { elementId: 'node-transcode-worker', handleId: 'left' },
        },
      },
      {
        id: 'line-worker-to-s3',
        type: 'line',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        animation: 'draw',
        animationDelay: 0.9,
        content: {
          lineType: 'elbow',
          x1: 0,
          y1: 0,
          x2: 1,
          y2: 1,
          style: 'solid',
          arrow: 'end',
          color: '#60a5fa',
          strokeWidth: 2,
          label: 'Put Transcoded MP4',
          startConnection: { elementId: 'node-transcode-worker', handleId: 'right' },
          endConnection: { elementId: 'node-s3-storage', handleId: 'left' },
        },
      },
    ],
  },
])
