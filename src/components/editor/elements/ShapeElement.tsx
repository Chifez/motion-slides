import type { ShapeContent, ShapeType } from '../../../types'

interface Props { content: ShapeContent }

function RectangleShape({ fill, stroke }: { fill: string; stroke: string }) {
  return <rect x="2" y="2" width="96" height="96" rx="6" fill={fill} stroke={stroke} strokeWidth="2" />
}

function DatabaseShape({ fill, stroke }: { fill: string; stroke: string }) {
  return <>
    <ellipse cx="50" cy="20" rx="40" ry="12" fill={fill} stroke={stroke} strokeWidth="2" />
    <rect x="10" y="20" width="80" height="60" fill={fill} stroke="none" />
    <ellipse cx="50" cy="80" rx="40" ry="12" fill={fill} stroke={stroke} strokeWidth="2" />
    <line x1="10" y1="20" x2="10" y2="80" stroke={stroke} strokeWidth="2" />
    <line x1="90" y1="20" x2="90" y2="80" stroke={stroke} strokeWidth="2" />
  </>
}

function ServerShape({ fill, stroke }: { fill: string; stroke: string }) {
  return <>
    <rect x="8" y="10" width="84" height="22" rx="3" fill={fill} stroke={stroke} strokeWidth="2" />
    <rect x="8" y="39" width="84" height="22" rx="3" fill={fill} stroke={stroke} strokeWidth="2" />
    <rect x="8" y="68" width="84" height="22" rx="3" fill={fill} stroke={stroke} strokeWidth="2" />
    <circle cx="80" cy="21" r="4" fill={stroke} />
    <circle cx="80" cy="50" r="4" fill={stroke} />
    <circle cx="80" cy="79" r="4" fill={stroke} />
  </>
}

function CloudShape({ fill, stroke }: { fill: string; stroke: string }) {
  return <path
    d="M25 70 Q10 70 10 55 Q10 42 22 40 Q20 20 40 18 Q55 10 68 25 Q80 18 88 30 Q100 30 95 45 Q98 58 85 65 Q82 72 70 72 Z"
    fill={fill} stroke={stroke} strokeWidth="2" transform="scale(0.95) translate(3,3)"
  />
}

function ClientShape({ fill, stroke }: { fill: string; stroke: string }) {
  return <>
    <rect x="10" y="8" width="80" height="55" rx="4" fill={fill} stroke={stroke} strokeWidth="2" />
    <rect x="30" y="63" width="40" height="8" fill={fill} stroke={stroke} strokeWidth="2" />
    <rect x="20" y="71" width="60" height="5" rx="2" fill={fill} stroke={stroke} strokeWidth="2" />
    <rect x="15" y="14" width="70" height="42" rx="2" fill={stroke} fillOpacity="0.15" />
  </>
}

function DiamondShape({ fill, stroke }: { fill: string; stroke: string }) {
  return <polygon points="50,5 95,50 50,95 5,50" fill={fill} stroke={stroke} strokeWidth="2" />
}

function UserShape({ fill, stroke }: { fill: string; stroke: string }) {
  return <>
    <circle cx="50" cy="28" r="18" fill={fill} stroke={stroke} strokeWidth="2" />
    <path d="M15 90 Q15 60 50 60 Q85 60 85 90" fill={fill} stroke={stroke} strokeWidth="2" strokeLinecap="round" />
  </>
}

function BucketShape({ fill, stroke }: { fill: string; stroke: string }) {
  return <>
    <path d="M20 30 L30 80 L70 80 L80 30 Z" fill={fill} stroke={stroke} strokeWidth="2" />
    <ellipse cx="50" cy="30" rx="30" ry="10" fill={fill} stroke={stroke} strokeWidth="2" />
  </>
}

function QueueShape({ fill, stroke }: { fill: string; stroke: string }) {
  return <>
    <rect x="6" y="30" width="56" height="22" rx="4" fill={fill} stroke={stroke} strokeWidth="2" />
    <path d="M62 38 L78 41 L62 52" fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
    <line x1="20" y1="38" x2="48" y2="38" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    <line x1="20" y1="44" x2="48" y2="44" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
  </>
}

function DocumentShape({ fill, stroke }: { fill: string; stroke: string }) {
  return <>
    <path
      d="M15 5 L75 5 L75 75 Q50 90 15 75 Z"
      fill={fill} stroke={stroke} strokeWidth="2"
    />
    <path d="M15 75 Q35 88 75 75" fill="none" stroke={stroke} strokeWidth="2" />
    <line x1="25" y1="25" x2="65" y2="25" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="25" y1="38" x2="65" y2="38" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="25" y1="51" x2="50" y2="51" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
  </>
}

const shapeMap: Record<ShapeType, React.FC<{ fill: string; stroke: string }>> = {
  rectangle: RectangleShape,
  database: DatabaseShape,
  server: ServerShape,
  cloud: CloudShape,
  client: ClientShape,
  diamond: DiamondShape,
  user: UserShape,
  bucket: BucketShape,
  queue: QueueShape,
  document: DocumentShape,
}

export function ShapeElement({ content }: Props) {
  const ShapeSVG = shapeMap[content.shapeType] ?? RectangleShape

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <svg viewBox="0 0 100 100" className="shape-svg" style={{ flex: 1 }}>
        <ShapeSVG fill={content.fill} stroke={content.stroke} />
      </svg>
      {content.label && (
        <span style={{ fontSize: 11, color: '#ccc', fontWeight: 500, fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
          {content.label}
        </span>
      )}
    </div>
  )
}
