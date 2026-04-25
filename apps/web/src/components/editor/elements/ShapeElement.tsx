import { motion } from 'framer-motion'
import type { ShapeContent, ShapeType } from '@motionslides/shared'
import { useMotionContext } from '@/context/MotionContext'

interface Props { content: ShapeContent }

// ─────────────────────────────────────────────
// Shape SVG sub-components
// Each uses motion.* elements so fill/stroke morph during transitions.
// ─────────────────────────────────────────────

interface ShapeProps {
  fill: string
  stroke: string
  transition: object
}

function RectangleShape({ fill, stroke, transition }: ShapeProps) {
  return (
    <motion.rect
      x="4" y="4" width="92" height="92" rx="6"
      animate={{ fill, stroke }}
      transition={transition}
      strokeWidth="2"
    />
  )
}

function DatabaseShape({ fill, stroke, transition }: ShapeProps) {
  return (
    <>
      <motion.ellipse cx="50" cy="20" rx="40" ry="12" animate={{ fill, stroke }} transition={transition} strokeWidth="2" />
      <motion.rect x="10" y="20" width="80" height="60" animate={{ fill }} transition={transition} stroke="none" />
      <motion.ellipse cx="50" cy="80" rx="40" ry="12" animate={{ fill, stroke }} transition={transition} strokeWidth="2" />
      <motion.line x1="10" y1="20" x2="10" y2="80" animate={{ stroke }} transition={transition} strokeWidth="2" />
      <motion.line x1="90" y1="20" x2="90" y2="80" animate={{ stroke }} transition={transition} strokeWidth="2" />
    </>
  )
}

function ServerShape({ fill, stroke, transition }: ShapeProps) {
  return (
    <>
      <motion.rect x="8" y="10" width="84" height="22" rx="3" animate={{ fill, stroke }} transition={transition} strokeWidth="2" />
      <motion.rect x="8" y="39" width="84" height="22" rx="3" animate={{ fill, stroke }} transition={transition} strokeWidth="2" />
      <motion.rect x="8" y="68" width="84" height="22" rx="3" animate={{ fill, stroke }} transition={transition} strokeWidth="2" />
      <motion.circle cx="80" cy="21" r="4" animate={{ fill: stroke }} transition={transition} />
      <motion.circle cx="80" cy="50" r="4" animate={{ fill: stroke }} transition={transition} />
      <motion.circle cx="80" cy="79" r="4" animate={{ fill: stroke }} transition={transition} />
    </>
  )
}

function CloudShape({ fill, stroke, transition }: ShapeProps) {
  return (
    <motion.path
      d="M25 70 Q10 70 10 55 Q10 42 22 40 Q20 20 40 18 Q55 10 68 25 Q80 18 88 30 Q100 30 95 45 Q98 58 85 65 Q82 72 70 72 Z"
      animate={{ fill, stroke }}
      transition={transition}
      strokeWidth="2"
      transform="scale(0.95) translate(3,3)"
    />
  )
}

function ClientShape({ fill, stroke, transition }: ShapeProps) {
  return (
    <>
      <motion.rect x="10" y="8" width="80" height="55" rx="4" animate={{ fill, stroke }} transition={transition} strokeWidth="2" />
      <motion.rect x="30" y="63" width="40" height="8" animate={{ fill, stroke }} transition={transition} strokeWidth="2" />
      <motion.rect x="20" y="71" width="60" height="5" rx="2" animate={{ fill, stroke }} transition={transition} strokeWidth="2" />
      <motion.rect x="15" y="14" width="70" height="42" rx="2" animate={{ fill: stroke }} transition={transition} fillOpacity="0.15" />
    </>
  )
}

function DiamondShape({ fill, stroke, transition }: ShapeProps) {
  return (
    <motion.polygon
      points="50,5 95,50 50,95 5,50"
      animate={{ fill, stroke }}
      transition={transition}
      strokeWidth="2"
    />
  )
}

function UserShape({ fill, stroke, transition }: ShapeProps) {
  return (
    <>
      <motion.circle cx="50" cy="28" r="18" animate={{ fill, stroke }} transition={transition} strokeWidth="2" />
      <motion.path d="M15 90 Q15 60 50 60 Q85 60 85 90" animate={{ fill, stroke }} transition={transition} strokeWidth="2" strokeLinecap="round" />
    </>
  )
}

function BucketShape({ fill, stroke, transition }: ShapeProps) {
  return (
    <>
      <motion.path d="M20 30 L30 80 L70 80 L80 30 Z" animate={{ fill, stroke }} transition={transition} strokeWidth="2" />
      <motion.ellipse cx="50" cy="30" rx="30" ry="10" animate={{ fill, stroke }} transition={transition} strokeWidth="2" />
    </>
  )
}

function QueueShape({ fill, stroke, transition }: ShapeProps) {
  return (
    <>
      <motion.rect x="6" y="30" width="56" height="22" rx="4" animate={{ fill, stroke }} transition={transition} strokeWidth="2" />
      <motion.path d="M62 38 L78 41 L62 52" animate={{ fill, stroke }} transition={transition} strokeWidth="2" strokeLinejoin="round" />
      <motion.line x1="20" y1="38" x2="48" y2="38" animate={{ stroke }} transition={transition} strokeWidth="2" strokeLinecap="round" />
      <motion.line x1="20" y1="44" x2="48" y2="44" animate={{ stroke }} transition={transition} strokeWidth="2" strokeLinecap="round" />
    </>
  )
}

function DocumentShape({ fill, stroke, transition }: ShapeProps) {
  return (
    <>
      <motion.path d="M15 5 L75 5 L75 75 Q50 90 15 75 Z" animate={{ fill, stroke }} transition={transition} strokeWidth="2" />
      <motion.path d="M15 75 Q35 88 75 75" fill="none" animate={{ stroke }} transition={transition} strokeWidth="2" />
      <motion.line x1="25" y1="25" x2="65" y2="25" animate={{ stroke }} transition={transition} strokeWidth="1.5" strokeLinecap="round" />
      <motion.line x1="25" y1="38" x2="65" y2="38" animate={{ stroke }} transition={transition} strokeWidth="1.5" strokeLinecap="round" />
      <motion.line x1="25" y1="51" x2="50" y2="51" animate={{ stroke }} transition={transition} strokeWidth="1.5" strokeLinecap="round" />
    </>
  )
}

function AwsIconShape({ iconPath }: { iconPath?: string }) {
  if (!iconPath) return null
  // We use a foreignObject to render the <img> tag inside the SVG coordinate system
  return (
    <foreignObject x="0" y="0" width="100" height="100">
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={`/${iconPath}`}
          alt="AWS Icon"
          style={{
            maxWidth: '90%',
            maxHeight: '90%',
            objectFit: 'contain',
            pointerEvents: 'none'
          }}
        />
      </div>
    </foreignObject>
  )
}

const shapeMap: Record<string, React.FC<any>> = {
  rectangle: RectangleShape, database: DatabaseShape, server: ServerShape,
  cloud: CloudShape, client: ClientShape, diamond: DiamondShape,
  user: UserShape, bucket: BucketShape, queue: QueueShape, document: DocumentShape,
  'aws-icon': AwsIconShape,
  'gcp-icon': AwsIconShape,
}

/**
 * ShapeElement — renders a shape with animated fill/stroke transitions.
 *
 * When a continuing shape changes color across slides, the fill and stroke
 * cross-fade using Phase 1 easing — same timing as position/size morphing.
 * In editor mode (isTransitioning=false), all changes are instant.
 */
export function ShapeElement({ content }: Props) {
  const { isTransitioning, durationSec } = useMotionContext()

  const EASE_IN_OUT: [number, number, number, number] = [0.37, 0, 0.63, 1]

  // Phase 1 transition for color morphing
  const colorTransition = isTransitioning
    ? { duration: durationSec, ease: EASE_IN_OUT }
    : { duration: 0 }

  const ShapeSVG = shapeMap[content.shapeType] ?? RectangleShape

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <svg viewBox="0 0 100 100" className="shape-svg" style={{ flex: 1, overflow: 'visible' }}>
        <ShapeSVG
          fill={content.fill}
          stroke={content.stroke}
          transition={colorTransition}
          iconPath={content.iconPath}
        />
      </svg>
      {content.label && (
        <span style={{ fontSize: 11, color: '#ccc', fontWeight: 500, fontFamily: 'Inter, sans-serif', textAlign: 'center', userSelect: 'none' }}>
          {content.label}
        </span>
      )}
    </div>
  )
}

