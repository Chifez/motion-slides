import { memo, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Type, Layout, Shapes, Minus, BarChart3, X,
  Square, Database, Server, Cloud, Monitor, Diamond,
  User, Archive, List, FileText, Sparkles, Box,
  LineChart, BarChart, AreaChart, PieChart,
  MoveRight, CornerDownRight, Trello, GitCommit
} from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { uuid } from '@/lib/uuid'
import {
  DEFAULT_TEXT_ELEMENT, DEFAULT_CODE_ELEMENT, DEFAULT_SHAPE_ELEMENT,
  DEFAULT_LINE_ELEMENT, DEFAULT_CHART_ELEMENT, LINE_TYPE_OPTIONS,
  SHAPE_OPTIONS, CHART_TYPE_OPTIONS
} from '@/constants/editor'
import { useClickOutside } from '@/hooks/useClickOutside'
import type { LineType, ShapeType, ChartType } from '@motionslides/shared'
import { UI_SPRING } from '@/lib/motionEngine'

/**
 * MobileFloatingDock — Radial tool dock positioned in the bottom-left.
 * Sub-menus use a native-feeling Bottom Sheet with distinct iconography.
 */
export const MobileFloatingDock = memo(function MobileFloatingDock() {
  const { addElement, addSection, isPrototypeMode } = useEditorStore()
  const [isOpen, setIsOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<'main' | 'shape' | 'line' | 'chart'>('main')

  const dockRef = useRef<HTMLDivElement>(null)
  useClickOutside(dockRef, () => {
    if (activeMenu === 'main') setIsOpen(false)
  })

  const [constraints, setConstraints] = useState({ left: -30, right: 300, top: -600, bottom: 30 })

  useEffect(() => {
    const updateConstraints = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      setConstraints({
        left: -30,
        right: Math.max(0, w - 40 - 56 - 10),
        top: -Math.max(0, h - 40 - 56 - 10),
        bottom: 30,
      })
    }
    updateConstraints()
    window.addEventListener('resize', updateConstraints)
    return () => window.removeEventListener('resize', updateConstraints)
  }, [])

  if (isPrototypeMode) return null

  const handleAdd = (type: string, data?: any) => {
    switch (type) {
      case 'text': addElement({ ...DEFAULT_TEXT_ELEMENT, id: uuid() }); break
      case 'section': addSection(); break
      case 'shape':
        const isAws = data === 'aws-icon'
        const isGcp = data === 'gcp-icon'
        addElement({
          ...DEFAULT_SHAPE_ELEMENT,
          id: uuid(),
          content: {
            ...DEFAULT_SHAPE_ELEMENT.content,
            shapeType: data,
            iconPath: isAws
              ? 'icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_Amazon-EC2_32.svg'
              : isGcp
                ? 'icons/gcp/Compute Engine/SVG/ComputeEngine-512-color-rgb.svg'
                : undefined,
            iconLabel: isAws ? 'Amazon EC2' : isGcp ? 'Compute Engine' : undefined,
            iconCategory: isAws ? 'Arch_Compute' : isGcp ? 'Compute' : undefined,
            label: isAws ? 'Amazon EC2' : isGcp ? 'Compute Engine' : DEFAULT_SHAPE_ELEMENT.content.label
          }
        });
        break
      case 'line':
        const size = data === 'straight' ? { width: 200, height: 2 } : { width: 200, height: 100 }
        addElement({ ...DEFAULT_LINE_ELEMENT, id: uuid(), size, content: { ...DEFAULT_LINE_ELEMENT.content, lineType: data } });
        break
      case 'chart': addElement({ ...DEFAULT_CHART_ELEMENT, id: uuid(), content: { ...DEFAULT_CHART_ELEMENT.content, chartType: data } }); break
    }
    setIsOpen(false)
    setActiveMenu('main')
  }

  const getShapeIcon = (type: ShapeType) => {
    switch (type) {
      case 'rectangle': return <Square size={24} />
      case 'database': return <Database size={24} />
      case 'server': return <Server size={24} />
      case 'cloud': return <Cloud size={24} />
      case 'client': return <Monitor size={24} />
      case 'diamond': return <Diamond size={24} />
      case 'user': return <User size={24} />
      case 'bucket': return <Archive size={24} />
      case 'queue': return <List size={24} />
      case 'document': return <FileText size={24} />
      case 'aws-icon': return <Sparkles size={24} className="text-orange-400" />
      case 'gcp-icon': return <Box size={24} className="text-blue-400" />
      default: return <Shapes size={24} />
    }
  }

  const getLineIcon = (type: LineType) => {
    switch (type) {
      case 'straight': return <MoveRight size={24} />
      case 'elbow': return <CornerDownRight size={24} />
      case 'curved': return <motion.svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12c3-8 9 8 12 0s9-8 12 0" /></motion.svg>
      case 'step-after': return <Trello size={24} />
      case 'branching': return <GitCommit size={24} />
      default: return <Minus size={24} />
    }
  }

  const getChartIcon = (type: ChartType) => {
    switch (type) {
      case 'line': return <LineChart size={24} />
      case 'bar': return <BarChart size={24} />
      case 'area': return <AreaChart size={24} />
      case 'pie': return <PieChart size={24} />
      default: return <BarChart3 size={24} />
    }
  }

  const mainTools = [
    { id: 'text', icon: <Type size={18} />, label: 'Text' },
    { id: 'section', icon: <Layout size={18} />, label: 'Section' },
    { id: 'shape', icon: <Shapes size={18} />, label: 'Shape' },
    { id: 'line', icon: <Minus size={18} />, label: 'Line' },
    { id: 'chart', icon: <BarChart3 size={18} />, label: 'Chart' },
  ]

  const RADIUS = 115
  const TRIGGER_SIZE = 56
  const ITEM_SIZE = 44
  const CENTER_OFFSET = (TRIGGER_SIZE - ITEM_SIZE) / 2

  return (
    <>
      <motion.div
        drag
        dragConstraints={constraints}
        dragElastic={0.1}
        dragMomentum={false}
        className="fixed bottom-10 left-10 z-100 cursor-grab active:cursor-grabbing select-none"
        ref={dockRef}
      >
        <AnimatePresence>
          {isOpen && activeMenu === 'main' && mainTools.map((tool, i) => {
            const angle = (i / (mainTools.length - 1)) * 90
            const radian = angle * (Math.PI / 180)
            const targetX = Math.cos(radian) * RADIUS + CENTER_OFFSET
            const targetY = Math.sin(radian) * -RADIUS + CENTER_OFFSET

            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, x: CENTER_OFFSET, y: CENTER_OFFSET, scale: 0.95 }}
                animate={{ opacity: 1, x: targetX, y: targetY, scale: 1 }}
                exit={{ opacity: 0, x: CENTER_OFFSET, y: CENTER_OFFSET, scale: 0.95 }}
                transition={{ ...UI_SPRING, delay: i * 0.04 }}
                onClick={() => {
                  if (['shape', 'line', 'chart'].includes(tool.id)) {
                    setActiveMenu(tool.id as any)
                  } else {
                    handleAdd(tool.id)
                  }
                }}
                className="absolute w-11 h-11 rounded-full bg-(--ms-bg-elevated) border border-(--ms-border) shadow-2xl flex items-center justify-center text-(--ms-text-secondary) active:bg-(--ms-accent) active:text-white transition-colors cursor-pointer outline-none"
              >
                {tool.icon}
              </motion.button>
            )
          })}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition active:scale-90 border-none cursor-pointer z-10 ${isOpen ? 'bg-(--ms-bg-elevated) text-(--ms-text-primary)' : 'bg-(--ms-accent) text-white'
            }`}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X size={26} />
              </motion.div>
            ) : (
              <motion.div key="plus" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Plus size={28} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </motion.div>

      <AnimatePresence>
        {activeMenu !== 'main' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveMenu('main')}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-110"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={UI_SPRING}
              className="fixed bottom-0 left-0 right-0 bg-(--ms-bg-elevated) border-t border-(--ms-border) rounded-t-[2.5rem] shadow-2xl z-120 p-6 pb-12"
            >
              <div className="w-12 h-1.5 bg-(--ms-border) rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-(--ms-text-muted)">
                  Select {activeMenu}
                </h3>
                <button
                  onClick={() => setActiveMenu('main')}
                  className="p-2 rounded-full bg-(--ms-bg-base) text-(--ms-text-secondary) hover:text-(--ms-text-primary) border-none cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {activeMenu === 'shape' && SHAPE_OPTIONS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => handleAdd('shape', s.value)}
                    className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-(--ms-bg-base) hover:bg-(--ms-border) transition border-none cursor-pointer group"
                  >
                    <div className="w-10 h-10 flex items-center justify-center text-(--ms-text-secondary) group-hover:text-(--ms-accent) transition-colors">
                      {getShapeIcon(s.value)}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-(--ms-text-muted) group-hover:text-(--ms-text-primary) text-center leading-tight">
                      {s.label}
                    </span>
                  </button>
                ))}

                {activeMenu === 'line' && LINE_TYPE_OPTIONS.map(l => (
                  <button
                    key={l.value}
                    onClick={() => handleAdd('line', l.value)}
                    className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-(--ms-bg-base) hover:bg-(--ms-border) transition border-none cursor-pointer group"
                  >
                    <div className="w-10 h-10 flex items-center justify-center text-(--ms-text-secondary) group-hover:text-(--ms-accent) transition-colors">
                      {getLineIcon(l.value as any)}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-(--ms-text-muted) group-hover:text-(--ms-text-primary) text-center leading-tight">
                      {l.label}
                    </span>
                  </button>
                ))}

                {activeMenu === 'chart' && CHART_TYPE_OPTIONS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => handleAdd('chart', c.value)}
                    className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-(--ms-bg-base) hover:bg-(--ms-border) transition border-none cursor-pointer group"
                  >
                    <div className="w-10 h-10 flex items-center justify-center text-(--ms-text-secondary) group-hover:text-(--ms-accent) transition-colors">
                      {getChartIcon(c.value as any)}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-(--ms-text-muted) group-hover:text-(--ms-text-primary) text-center leading-tight">
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
})
