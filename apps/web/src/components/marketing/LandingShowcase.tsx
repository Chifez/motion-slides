import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getTransitionStates } from '@/lib/motionShared'
import { Play, Pause, ChevronRight, ChevronLeft } from 'lucide-react'
import { buildElbowPoints, buildRoundedPath, getPathMidpoint } from '@/components/editor/elements/lineHelpers'
import { getArrow } from 'perfect-arrows'

// Canvas base dimensions to scale proportionally
const BASE_WIDTH = 1000
const BASE_HEIGHT = 562.5 // 16:9 Aspect Ratio

// High-fidelity Editor Shape Components
function CircleShape({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="#09090b" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function ServerShape({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-1.5">
      <rect x="8" y="10" width="84" height="22" rx="3.5" fill="#09090b" stroke={color} strokeWidth="1.5" />
      <rect x="8" y="39" width="84" height="22" rx="3.5" fill="#09090b" stroke={color} strokeWidth="1.5" />
      <rect x="8" y="68" width="84" height="22" rx="3.5" fill="#09090b" stroke={color} strokeWidth="1.5" />
      <circle cx="80" cy="21" r="3.5" fill={color} />
      <circle cx="80" cy="50" r="3.5" fill={color} />
      <circle cx="80" cy="79" r="3.5" fill={color} />
    </svg>
  )
}

function DatabaseShape({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-1.5">
      <ellipse cx="50" cy="18" rx="38" ry="9" fill="#09090b" stroke={color} strokeWidth="1.5" />
      <path d="M12 18 L12 82 A38 9 0 0 0 88 82 L88 18" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M12 18 L12 82 L88 82 L88 18 Z" fill="#09090b" stroke="none" />
      <ellipse cx="50" cy="82" rx="38" ry="9" fill="#09090b" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function ClientShape({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-1.5">
      <rect x="10" y="8" width="80" height="52" rx="5" fill="#09090b" stroke={color} strokeWidth="1.5" />
      <rect x="32" y="60" width="36" height="10" fill="#09090b" stroke={color} strokeWidth="1.5" />
      <rect x="18" y="70" width="64" height="6" rx="3" fill="#09090b" stroke={color} strokeWidth="1.5" />
      <rect x="16" y="14" width="68" height="40" rx="3" fill={color} fillOpacity="0.1" stroke="none" />
    </svg>
  )
}

function AwsIconShape({ iconPath }: { iconPath: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-2 bg-[#09090b] border border-zinc-800 rounded-2xl shadow-lg">
      <img
        src={`/${encodeURI(iconPath)}`}
        alt="AWS Icon"
        className="max-w-[80%] max-h-[80%] object-contain pointer-events-none"
      />
    </div>
  )
}

// Pre-tokenized codes for Slide 4 and Slide 5 to drive layout code-morphing
const CODE_SLIDE_4 = [
  { key: 'fn-def', text: 'function renderCanvas() {', type: 'keyword' },
  { key: 'const-stage', text: '  const stage = getStage();', type: 'variable' },
  { key: 'anim-stage', text: '  stage.animate();', type: 'expression' },
  { key: 'fn-end', text: '}', type: 'keyword' }
]

const CODE_SLIDE_5 = [
  { key: 'fn-def', text: 'function renderCanvas() {', type: 'keyword' },
  { key: 'const-stage', text: '  const stage = getStage();', type: 'variable' },
  { key: 'comment-line', text: '  // Magic Move resolves transitions', type: 'comment' },
  { key: 'anim-stage', text: '  stage.animate();', type: 'expression' },
  { key: 'log-line', text: '  logState(\'rendered\');', type: 'expression' },
  { key: 'fn-end', text: '}', type: 'keyword' }
]

const MOCK_SLIDES = [
  {
    id: 'slide-1',
    title: 'Welcome to MotionSlides',
    subtitle: 'Where static designs become fluid presentations',
    background: '#09090b',
    elements: [
      { id: 'text-hero', type: 'text', role: 'title', value: 'MotionSlides', x: 200, y: 200, w: 600, h: 70, fontSize: '54px', color: '#ffffff', fontWeight: 'bold' },
      { id: 'text-sub', type: 'text', role: 'body', value: 'Magic Move & Architecture Diagrams in the Browser', x: 150, y: 285, w: 700, h: 40, fontSize: '20px', color: '#a1a1aa' }
    ]
  },
  {
    id: 'slide-2',
    title: 'Logical Service Blueprint',
    subtitle: 'High-fidelity shapes with thin connectors and sections',
    background: '#09090b',
    elements: [
      // Section boundary enclosing EC2 and Lambda
      { id: 'section-boundary', type: 'section', label: 'AWS VPC Subnet', x: 260, y: 70, w: 420, h: 280 },
      
      // Solid Shapes (2)
      { id: 'source-node', type: 'shape', shape: 'circle', label: 'Client App', x: 100, y: 220, w: 90, h: 90, color: '#3b82f6' },
      { id: 'db-node', type: 'shape', shape: 'database', label: 'Main DB', x: 740, y: 220, w: 90, h: 90, color: '#3b82f6' },
      
      // AWS Service Icons (2)
      { id: 'server-node', type: 'aws-icon', label: 'EC2 Server', x: 320, y: 120, w: 90, h: 90, iconPath: 'icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_Amazon-EC2_32.svg' },
      { id: 'lambda-node', type: 'aws-icon', label: 'Lambda Fn', x: 530, y: 120, w: 90, h: 90, iconPath: 'icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_AWS-Lambda_32.svg' },
      
      // Connectors
      { 
        id: 'conn-client-server', 
        type: 'line', 
        from: 'source-node', 
        to: 'server-node', 
        label: 'request', 
        lineType: 'elbow', 
        style: 'dashed',
        startConnection: { handleId: 'right' },
        endConnection: { handleId: 'left' }
      },
      { 
        id: 'conn-server-lambda', 
        type: 'line', 
        from: 'server-node', 
        to: 'lambda-node', 
        label: 'invoke', 
        lineType: 'straight', 
        style: 'solid',
        startConnection: { handleId: 'right' },
        endConnection: { handleId: 'left' }
      },
      { 
        id: 'conn-lambda-db', 
        type: 'line', 
        from: 'lambda-node', 
        to: 'db-node', 
        label: 'write', 
        lineType: 'elbow', 
        style: 'dashed',
        startConnection: { handleId: 'right' },
        endConnection: { handleId: 'left' }
      },
      { 
        id: 'conn-client-db', 
        type: 'line', 
        from: 'source-node', 
        to: 'db-node', 
        label: 'sync', 
        lineType: 'elbow', 
        style: 'solid',
        startConnection: { handleId: 'bottom' },
        endConnection: { handleId: 'bottom' }
      }
    ]
  },
  {
    id: 'slide-3',
    title: 'Scalable System Architecture',
    subtitle: 'Dynamic layout refitting updates section boundaries automatically',
    background: '#09090b',
    elements: [
      // Section boundary grows to cover AWS nodes
      { id: 'section-boundary', type: 'section', label: 'AWS VPC Core Network', x: 240, y: 80, w: 700, h: 420 },
      
      // Solid Shapes (3)
      { id: 'source-node', type: 'shape', shape: 'circle', label: 'Client App', x: 100, y: 220, w: 90, h: 90, color: '#3b82f6' },
      { id: 'server-node', type: 'shape', shape: 'server', label: 'App Server', x: 300, y: 220, w: 90, h: 90, color: '#3b82f6' },
      { id: 'db-node', type: 'shape', shape: 'database', label: 'Local Cache', x: 520, y: 345, w: 90, h: 90, color: '#3b82f6' },
      
      // AWS Service Icons (3)
      { id: 'lambda-node', type: 'aws-icon', label: 'Lambda Fn', x: 520, y: 120, w: 90, h: 90, iconPath: 'icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_AWS-Lambda_32.svg' },
      { id: 'rds-node', type: 'aws-icon', label: 'AWS RDS', x: 740, y: 345, w: 90, h: 90, iconPath: 'icons/aws/Architecture-Service-Icons_01302026/Arch_Databases/32/Arch_Amazon-RDS_32.svg' },
      { id: 's3-node', type: 'aws-icon', label: 'S3 Store', x: 820, y: 230, w: 90, h: 90, iconPath: 'icons/aws/Architecture-Service-Icons_01302026/Arch_Storage/32/Arch_Amazon-Simple-Storage-Service_32.svg' },
      
      // Connectors
      { 
        id: 'conn-client-server', 
        type: 'line', 
        from: 'source-node', 
        to: 'server-node', 
        label: 'traffic-in', 
        lineType: 'elbow', 
        style: 'dashed',
        startConnection: { handleId: 'right' },
        endConnection: { handleId: 'left' }
      },
      { 
        id: 'conn-server-lambda', 
        type: 'line', 
        from: 'server-node', 
        to: 'lambda-node', 
        label: 'invoke', 
        lineType: 'elbow', 
        style: 'solid',
        startConnection: { handleId: 'top' },
        endConnection: { handleId: 'left' }
      },
      { 
        id: 'conn-lambda-rds', 
        type: 'line', 
        from: 'lambda-node', 
        to: 'rds-node', 
        label: 'write', 
        lineType: 'elbow', 
        style: 'dashed',
        startConnection: { handleId: 'right' },
        endConnection: { handleId: 'top' }
      },
      { 
        id: 'conn-server-db', 
        type: 'line', 
        from: 'server-node', 
        to: 'db-node', 
        label: 'read', 
        lineType: 'elbow', 
        style: 'solid',
        startConnection: { handleId: 'bottom' },
        endConnection: { handleId: 'left' }
      },
      { 
        id: 'conn-rds-s3', 
        type: 'line', 
        from: 'rds-node', 
        to: 's3-node', 
        label: 'backup', 
        lineType: 'elbow', 
        style: 'solid',
        startConnection: { handleId: 'right' },
        endConnection: { handleId: 'bottom' }
      },
      { 
        id: 'conn-client-db', 
        type: 'line', 
        from: 'source-node', 
        to: 'db-node', 
        label: 'sync', 
        lineType: 'elbow', 
        style: 'solid',
        startConnection: { handleId: 'bottom' },
        endConnection: { handleId: 'bottom' }
      }
    ]
  },
  {
    id: 'slide-4',
    title: 'Code-Aware Transitions',
    subtitle: 'Morph code structures and watch unchanged lines shift index position',
    background: '#09090b',
    elements: [
      { id: 'code-block', type: 'code', lines: CODE_SLIDE_4, x: 220, y: 130, w: 560, h: 300 }
    ]
  },
  {
    id: 'slide-5',
    title: 'Dynamic Line Morphing',
    subtitle: 'LCS comparisons determine shifted, deleted, and added lines',
    background: '#09090b',
    elements: [
      // Codeblock element persists with new code content morphs
      { id: 'code-block', type: 'code', lines: CODE_SLIDE_5, x: 220, y: 130, w: 560, h: 300 }
    ]
  }
]

function getConnectionPoint(node: any, handleId: 'left' | 'right' | 'top' | 'bottom') {
  if (handleId === 'left') {
    return { x: node.x, y: node.y + node.h / 2 }
  }
  if (handleId === 'right') {
    return { x: node.x + node.w, y: node.y + node.h / 2 }
  }
  if (handleId === 'top') {
    return { x: node.x + node.w / 2, y: node.y }
  }
  if (handleId === 'bottom') {
    return { x: node.x + node.w / 2, y: node.y + node.h }
  }
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 }
}

export function LandingShowcase() {
  const [slideIndex, setSlideIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [scale, setScale] = useState(1)
  
  const containerRef = useRef<HTMLDivElement>(null)

  // Resizes the canvas stage to center and scale fit proportionally
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    
    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      const scaleFactor = Math.min(w / BASE_WIDTH, h / BASE_HEIGHT)
      setScale(scaleFactor)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % MOCK_SLIDES.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [isPlaying])

  const activeSlide = MOCK_SLIDES[slideIndex]

  const handleNext = () => {
    setSlideIndex((prev) => (prev + 1) % MOCK_SLIDES.length)
  }

  const handlePrev = () => {
    setSlideIndex((prev) => (prev - 1 + MOCK_SLIDES.length) % MOCK_SLIDES.length)
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-6 relative select-none">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/80 pb-4 mb-4 gap-4 sm:gap-2">
        <div className="min-w-0 pr-2">
          <h3 className="text-white font-bold text-lg tracking-tight truncate">{activeSlide.title}</h3>
          <p className="text-zinc-400 text-xs mt-0.5 line-clamp-2">{activeSlide.subtitle}</p>
        </div>
        
        {/* Playback Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl transition cursor-pointer"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 shrink-0">
            <button onClick={handlePrev} className="p-1.5 text-zinc-400 hover:text-white border-none bg-transparent cursor-pointer shrink-0">
              <ChevronLeft size={16} />
            </button>
            <span className="text-[10px] font-bold text-zinc-500 px-2 min-w-[2.5rem] text-center whitespace-nowrap">
              {slideIndex + 1} / {MOCK_SLIDES.length}
            </span>
            <button onClick={handleNext} className="p-1.5 text-zinc-400 hover:text-white border-none bg-transparent cursor-pointer shrink-0">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Slide Canvas stage container */}
      <div 
        ref={containerRef}
        className="w-full aspect-[16/9] bg-[#070708] rounded-2xl border border-zinc-900/60 overflow-hidden relative shadow-inner"
      >
        {/* Scaled viewport inside the aspect ratio wrapper */}
        <div
          style={{
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <div className="absolute inset-0 w-full h-full">
            <AnimatePresence mode="sync" initial={false}>
              {/* Render Section boundaries under node/line layouts */}
              {activeSlide.elements
                .filter((el) => el.type === 'section')
                .map((sec: any) => {
                  return (
                    <motion.div
                      key={sec.id}
                      layoutId={`demo-${sec.id}`}
                      className="absolute border border-dashed border-white/10 rounded-2xl flex flex-col justify-start p-3 select-none"
                      style={{
                        left: sec.x,
                        top: sec.y,
                        width: sec.w,
                        height: sec.h,
                        background: 'rgba(255, 255, 255, 0.02)',
                        zIndex: 1,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                    >
                      <div className="inline-flex self-start text-[9px] font-black uppercase tracking-wider bg-[#101012] border border-white/10 rounded px-1.5 py-0.5 text-white/50">
                        {sec.label}
                      </div>
                    </motion.div>
                  )
                })}
            </AnimatePresence>

              {/* Draw connectors under shape layers */}
              <AnimatePresence mode="sync" initial={false}>
                {activeSlide.elements
                  .filter((el) => el.type === 'line')
                  .map((line: any) => {
                  const fromEl = activeSlide.elements.find((e) => e.id === line.from) as any
                  const toEl = activeSlide.elements.find((e) => e.id === line.to) as any
                  if (!fromEl || !toEl) return null

                  // Use port coordinates if handles are defined, otherwise centers
                  const startHandle = line.startConnection?.handleId
                  const endHandle = line.endConnection?.handleId

                  const p1 = startHandle ? getConnectionPoint(fromEl, startHandle) : { x: fromEl.x + fromEl.w / 2, y: fromEl.y + fromEl.h / 2 }
                  const p2 = endHandle ? getConnectionPoint(toEl, endHandle) : { x: toEl.x + toEl.w / 2, y: toEl.y + toEl.h / 2 }

                  const x1 = p1.x
                  const y1 = p1.y
                  const x2 = p2.x
                  const y2 = p2.y

                  // Use editor's default thin white lines (1.5px stroke, white/80)
                  const strokeColor = 'rgba(255, 255, 255, 0.8)'
                  const strokeWidth = 1.5

                  let pathD = ''
                  let labelX = (x1 + x2) / 2
                  let labelY = (y1 + y2) / 2

                  if (line.lineType === 'straight') {
                    pathD = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`
                  } else if (line.lineType === 'curved') {
                    try {
                      const arrow = getArrow(x1, y1, x2, y2, {
                        bow: 0.2,
                        stretch: 0.5,
                        padStart: 0,
                        padEnd: 0,
                        straights: false,
                      })
                      const [sx, sy, cx, cy, ex, ey] = arrow
                      pathD = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`
                    } catch (e) {
                      pathD = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`
                    }
                  } else {
                    // Default to rounded elbow paths matching the editor exactly
                    const points = buildElbowPoints(x1, y1, x2, y2, {
                      startConnection: line.startConnection,
                      endConnection: line.endConnection,
                    } as any)
                    pathD = buildRoundedPath(points, 16)
                    
                    const mid = getPathMidpoint(points)
                    labelX = mid.x
                    labelY = mid.y
                  }

                  return (
                    <motion.svg 
                      key={line.id} 
                      className="absolute inset-0 w-full h-full pointer-events-none z-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <defs>
                        <marker 
                          id={`arrow-${line.id}`} 
                          markerWidth="12" 
                          markerHeight="12" 
                          refX="10" 
                          refY="6" 
                          orient="auto" 
                          markerUnits="userSpaceOnUse"
                        >
                          <path d="M0,0 L0,12 L12,6 z" fill={strokeColor} />
                        </marker>
                      </defs>
                      <motion.path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={line.style === 'dashed' ? '8 5' : line.style === 'dotted' ? '2 4' : undefined}
                        markerEnd={`url(#arrow-${line.id})`}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.6, d: pathD }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                      <foreignObject 
                        x={labelX - 35} 
                        y={labelY - 10} 
                        width="70" 
                        height="20"
                      >
                        <div className="text-[8px] font-black uppercase text-center text-white/50 bg-[#0c0c0e] border border-white/10 px-1 py-0.5 rounded backdrop-blur-xs select-none">
                          {line.label}
                        </div>
                      </foreignObject>
                    </motion.svg>
                  )
                })}
            </AnimatePresence>


              {/* Elements (Shapes, Code, Text) */}
              <AnimatePresence mode="sync" initial={false}>
                {activeSlide.elements
                  .filter((el) => el.type !== 'line' && el.type !== 'section')
                  .map((el: any) => {
                  return (
                    <motion.div
                      key={el.id}
                      layoutId={`demo-${el.id}`}
                      className="absolute flex flex-col items-center justify-center"
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.w,
                        height: el.h,
                        zIndex: 10,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                    >
                      {el.type === 'shape' && (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <div className="w-full h-full flex-1">
                            {el.shape === 'circle' && <CircleShape color={el.color} />}
                            {el.shape === 'server' && <ServerShape color={el.color} />}
                            {el.shape === 'database' && <DatabaseShape color={el.color} />}
                            {el.shape === 'client' && <ClientShape color={el.color} />}
                          </div>
                          {el.label && (
                            <span className="text-[11px] font-bold tracking-tight text-white/80 mt-2 block whitespace-nowrap">
                              {el.label}
                            </span>
                          )}
                        </div>
                      )}

                      {el.type === 'aws-icon' && (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <div className="w-full h-full flex-1">
                            <AwsIconShape iconPath={el.iconPath} />
                          </div>
                          {el.label && (
                            <span className="text-[11px] font-bold tracking-tight text-white/85 mt-2 block whitespace-nowrap">
                              {el.label}
                            </span>
                          )}
                        </div>
                      )}

                      {el.type === 'text' && (
                        <div className="w-full text-center" style={{ color: el.color }}>
                          <span 
                            style={{ 
                              fontSize: el.fontSize, 
                              fontFamily: el.role === 'title' ? '"DM Serif Display", Georgia, serif' : 'Inter, sans-serif',
                              fontStyle: el.role === 'title' ? 'italic' : 'normal',
                              fontWeight: el.fontWeight || 'normal'
                            }} 
                            className="text-white tracking-tight leading-snug block"
                          >
                            {el.value}
                          </span>
                        </div>
                      )}

                      {el.type === 'code' && (
                        <div className="w-full h-full bg-[#0a0a0c] border border-zinc-800/80 rounded-2xl p-5 font-mono text-[11px] text-zinc-300 overflow-hidden shadow-2xl flex flex-col">
                          <div className="flex items-center gap-1.5 pb-2.5 mb-3 border-b border-zinc-800/40 opacity-60">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                            <span className="text-[9px] uppercase tracking-wider pl-2 text-zinc-400 font-bold">typescript</span>
                          </div>
                          <div className="relative flex-1 text-left select-text">
                            <AnimatePresence mode="popLayout" initial={false}>
                              {el.lines.map((line: any, idx: number) => {
                                const isComment = line.type === 'comment'
                                const isKeyword = line.type === 'keyword'
                                const isVar = line.type === 'variable'
                                return (
                                  <motion.div
                                    key={line.key}
                                    layoutId={`line-${line.key}`}
                                    className="flex items-center font-mono leading-relaxed"
                                    transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                                  >
                                    <span className="text-zinc-700 w-4 text-right pr-2 text-[9px] font-mono select-none">
                                      {idx + 1}
                                    </span>
                                    <span 
                                      className={
                                        isComment ? 'text-zinc-500 italic' 
                                        : isKeyword ? 'text-blue-400 font-semibold' 
                                        : isVar ? 'text-purple-400'
                                        : 'text-zinc-200'
                                      }
                                      style={{ fontFamily: 'ui-monospace, monospace' }}
                                    >
                                      {line.text}
                                    </span>
                                  </motion.div>
                                )
                              })}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
