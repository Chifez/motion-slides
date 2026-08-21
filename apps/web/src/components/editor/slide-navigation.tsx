import { memo, useState, useRef } from 'react'
import {
  ChevronLeft, ChevronRight, MousePointer, Hand, Type, Layout, Code2,
  Shapes, Minus, BarChart3, ChevronDown, Plus
} from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'
import { uuid } from '@/lib/uuid'
import {
  DEFAULT_TEXT_ELEMENT, DEFAULT_CODE_ELEMENT, DEFAULT_SHAPE_ELEMENT,
  DEFAULT_LINE_ELEMENT, DEFAULT_CHART_ELEMENT, LINE_TYPE_OPTIONS,
  SHAPE_OPTIONS, CHART_TYPE_OPTIONS
} from '@/constants/editor'
import { useClickOutside } from '@/hooks/use-click-outside'
import type { LineType, ShapeType, ChartType } from '@motionslides/shared'

const dockBtnCls = "p-1.5 rounded-lg text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border)/60 active:scale-95 transition cursor-pointer border-none bg-transparent flex items-center justify-center"
const dockBtnActiveCls = "p-1.5 rounded-lg bg-blue-600/15 text-blue-400 active:scale-95 transition cursor-pointer border-none flex items-center justify-center shadow-xs"

/**
 * 🧭 SlideNavigation — Unified Floating Canvas Dock (Tools, Insert & Navigation)
 */
export const SlideNavigation = memo(function SlideNavigation() {
  const activeSlideIndex = useEditorStore(s => s.activeSlideIndex)
  const totalSlides = useEditorStore(s => s.activeProject()?.slides.length ?? 0)
  const setActiveSlide = useEditorStore(s => s.setActiveSlide)
  const zoom = useEditorStore(s => s.camera.zoom)
  const resetCamera = useEditorStore(s => s.resetCamera)
  const activeTool = useEditorStore(s => s.activeTool)
  const setActiveTool = useEditorStore(s => s.setActiveTool)
  const { addElement, addSection } = useEditorStore()

  // Popover menus
  const [showShapeMenu, setShowShapeMenu] = useState(false)
  const shapeRef = useRef<HTMLDivElement>(null)
  useClickOutside(shapeRef, () => setShowShapeMenu(false))

  const [showLineMenu, setShowLineMenu] = useState(false)
  const lineRef = useRef<HTMLDivElement>(null)
  useClickOutside(lineRef, () => setShowLineMenu(false))

  const [showChartMenu, setShowChartMenu] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  useClickOutside(chartRef, () => setShowChartMenu(false))

  const [showCompactInsert, setShowCompactInsert] = useState(false)
  const compactInsertRef = useRef<HTMLDivElement>(null)
  useClickOutside(compactInsertRef, () => setShowCompactInsert(false))

  if (totalSlides === 0) return null

  const addText = () => addElement({ ...DEFAULT_TEXT_ELEMENT, id: uuid() })
  const addCode = () => addElement({ ...DEFAULT_CODE_ELEMENT, id: uuid() })

  const addShape = (shapeType: ShapeType = 'rectangle') => {
    const isAws = shapeType === 'aws-icon'
    const isGcp = shapeType === 'gcp-icon'

    addElement({
      ...DEFAULT_SHAPE_ELEMENT,
      id: uuid(),
      content: {
        ...DEFAULT_SHAPE_ELEMENT.content,
        shapeType,
        iconPath: isAws
          ? 'icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_Amazon-EC2_32.svg'
          : isGcp
          ? 'icons/gcp/Compute Engine/SVG/ComputeEngine-512-color-rgb.svg'
          : undefined,
        iconLabel: isAws ? 'Amazon EC2' : isGcp ? 'Compute Engine' : undefined,
        iconCategory: isAws ? 'Arch_Compute' : isGcp ? 'Compute' : undefined,
        label: isAws ? 'Amazon EC2' : isGcp ? 'Compute Engine' : DEFAULT_SHAPE_ELEMENT.content.label
      }
    })
    setShowShapeMenu(false)
    setShowCompactInsert(false)
  }

  const addChart = (chartType: ChartType = 'bar') => {
    addElement({
      ...DEFAULT_CHART_ELEMENT,
      id: uuid(),
      content: { ...DEFAULT_CHART_ELEMENT.content, chartType }
    })
    setShowChartMenu(false)
    setShowCompactInsert(false)
  }

  const addLine = (lineType: LineType) => {
    const branches = lineType === 'branching' ? [
      { x: 1, y: 0 },
      { x: 1, y: 1 }
    ] : undefined

    const lineContent = { ...DEFAULT_LINE_ELEMENT.content, lineType, branches }
    const size = lineType === 'straight'
      ? { width: 200, height: 2 }
      : { width: 200, height: 100 }

    addElement({
      ...DEFAULT_LINE_ELEMENT,
      id: uuid(),
      size,
      content: lineContent,
    })
    setShowLineMenu(false)
    setShowCompactInsert(false)
  }

  return (
    <div
      className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-(--ms-bg-surface)/90 border border-(--ms-border) rounded-2xl p-1 backdrop-blur-xl shadow-2xl z-40 select-none max-w-[calc(100vw-32px)]"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* 1. Pointer & Hand Tools (Desktop & Tablet) */}
      <div className="hidden sm:flex items-center gap-0.5 bg-(--ms-bg-base)/60 rounded-xl p-0.5 border border-(--ms-border)/40">
        <button
          onClick={() => setActiveTool('select')}
          className={activeTool === 'select' ? dockBtnActiveCls : dockBtnCls}
          title="Select Tool (V)"
        >
          <MousePointer size={14} />
        </button>
        <button
          onClick={() => setActiveTool('hand')}
          className={activeTool === 'hand' ? dockBtnActiveCls : dockBtnCls}
          title="Hand / Pan Tool (H)"
        >
          <Hand size={14} />
        </button>
      </div>

      <div className="hidden sm:block w-px h-4 bg-(--ms-border) mx-1" />

      {/* 2. Expanded Insert Tools (Desktop >= 900px) */}
      <div className="hidden md:flex items-center gap-0.5">
        <button className={dockBtnCls} onClick={addText} title="Add Text (T)">
          <Type size={14} />
        </button>
        <button className={dockBtnCls} onClick={addSection} title="Add Section Boundary">
          <Layout size={14} />
        </button>
        <button className={dockBtnCls} onClick={addCode} title="Add Code Block">
          <Code2 size={14} />
        </button>

        {/* Shape Menu */}
        <div className="relative" ref={shapeRef}>
          <button
            className={`${dockBtnCls} gap-0.5 px-1.5`}
            onClick={() => setShowShapeMenu(!showShapeMenu)}
            title="Add Shape / Architecture Icon"
          >
            <Shapes size={14} />
            <ChevronDown size={10} className="opacity-50" />
          </button>
          {showShapeMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl shadow-2xl z-50 p-1.5 w-44 max-h-64 overflow-y-auto custom-scrollbar">
              {SHAPE_OPTIONS.map((so) => (
                <button
                  key={so.value}
                  onClick={() => addShape(so.value as ShapeType)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition cursor-pointer border-none bg-transparent text-left"
                >
                  {so.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Connector / Line Menu */}
        <div className="relative" ref={lineRef}>
          <button
            className={`${dockBtnCls} gap-0.5 px-1.5`}
            onClick={() => setShowLineMenu(!showLineMenu)}
            title="Add Connector / Line"
          >
            <Minus size={14} />
            <ChevronDown size={10} className="opacity-50" />
          </button>
          {showLineMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl shadow-2xl z-50 p-1.5 w-38">
              {LINE_TYPE_OPTIONS.map((lt) => (
                <button
                  key={lt.value}
                  onClick={() => addLine(lt.value as LineType)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition cursor-pointer border-none bg-transparent text-left"
                >
                  <span className="text-sm w-4 text-center">{lt.icon}</span>
                  {lt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chart Menu */}
        <div className="relative" ref={chartRef}>
          <button
            className={`${dockBtnCls} gap-0.5 px-1.5`}
            onClick={() => setShowChartMenu(!showChartMenu)}
            title="Add Chart"
          >
            <BarChart3 size={14} />
            <ChevronDown size={10} className="opacity-50" />
          </button>
          {showChartMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl shadow-2xl z-50 p-1.5 w-36">
              {CHART_TYPE_OPTIONS.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => addChart(ct.value as ChartType)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition cursor-pointer border-none bg-transparent text-left"
                >
                  <span className="text-sm w-4 text-center">{ct.icon}</span>
                  {ct.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2b. Compact Insert Trigger (Tablet 640px - 899px) */}
      <div className="hidden sm:flex md:hidden relative" ref={compactInsertRef}>
        <button
          className={`${dockBtnCls} gap-1 px-2 font-medium text-xs`}
          onClick={() => setShowCompactInsert(!showCompactInsert)}
          title="Insert Element"
        >
          <Plus size={14} />
          <span>Insert</span>
          <ChevronDown size={10} className="opacity-50" />
        </button>
        {showCompactInsert && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl shadow-2xl z-50 p-1.5 w-44 space-y-0.5">
            <button onClick={addText} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border) cursor-pointer border-none bg-transparent text-left">
              <Type size={14} />
              <span>Text</span>
            </button>
            <button onClick={addSection} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border) cursor-pointer border-none bg-transparent text-left">
              <Layout size={14} />
              <span>Section</span>
            </button>
            <button onClick={addCode} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border) cursor-pointer border-none bg-transparent text-left">
              <Code2 size={14} />
              <span>Code Block</span>
            </button>
            <button onClick={() => addShape('rectangle')} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border) cursor-pointer border-none bg-transparent text-left">
              <Shapes size={14} />
              <span>Shape</span>
            </button>
            <button onClick={() => addLine('straight')} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border) cursor-pointer border-none bg-transparent text-left">
              <Minus size={14} />
              <span>Connector</span>
            </button>
            <button onClick={() => addChart('bar')} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border) cursor-pointer border-none bg-transparent text-left">
              <BarChart3 size={14} />
              <span>Chart</span>
            </button>
          </div>
        )}
      </div>

      <div className="hidden sm:block w-px h-4 bg-(--ms-border) mx-1" />

      {/* 3. Slide Stepper & Zoom Reset */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setActiveSlide(activeSlideIndex - 1)}
          disabled={activeSlideIndex === 0}
          className="p-1.5 rounded-lg text-(--ms-text-muted) hover:text-(--ms-text-primary) disabled:opacity-20 disabled:cursor-default transition cursor-pointer border-none bg-transparent"
          title="Previous Slide"
        >
          <ChevronLeft size={15} />
        </button>

        <span className="text-xs text-(--ms-text-muted) font-semibold min-w-[42px] text-center tracking-tight">
          {activeSlideIndex + 1} / {totalSlides}
        </span>

        <button
          onClick={() => setActiveSlide(activeSlideIndex + 1)}
          disabled={activeSlideIndex >= totalSlides - 1}
          className="p-1.5 rounded-lg text-(--ms-text-muted) hover:text-(--ms-text-primary) disabled:opacity-20 disabled:cursor-default transition cursor-pointer border-none bg-transparent"
          title="Next Slide"
        >
          <ChevronRight size={15} />
        </button>

        <div className="w-px h-4 bg-(--ms-border) mx-0.5" />

        <button
          onClick={() => resetCamera()}
          title="Reset zoom to 100%"
          className="text-[11px] text-(--ms-text-muted) hover:text-(--ms-text-primary) font-mono font-medium border-none bg-transparent cursor-pointer px-1.5 py-1 rounded-md hover:bg-(--ms-border)/50 transition"
        >
          {Math.round(zoom * 100)}%
        </button>
      </div>
    </div>
  )
})
