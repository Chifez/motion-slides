import { useState, useRef } from 'react'
import { Type, Code2, Shapes, Minus, ChevronDown, BarChart3 } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { uuid } from '@/lib/uuid'
import { 
  DEFAULT_TEXT_ELEMENT, DEFAULT_CODE_ELEMENT, DEFAULT_SHAPE_ELEMENT, 
  DEFAULT_LINE_ELEMENT, DEFAULT_CHART_ELEMENT, LINE_TYPE_OPTIONS, 
  SHAPE_OPTIONS, CHART_TYPE_OPTIONS 
} from '@/constants/editor'
import { useClickOutside } from '@/hooks/useClickOutside'
import type { LineType, ShapeType, ChartType } from '@motionslides/shared'

const btnBase = "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-(--ms-border) bg-(--ms-bg-elevated) text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border)"

export function ElementButtons() {
  const { addElement } = useEditorStore()
  
  const [showLineMenu, setShowLineMenu] = useState(false)
  const lineRef = useRef<HTMLDivElement>(null)
  useClickOutside(lineRef, () => setShowLineMenu(false))

  const [showShapeMenu, setShowShapeMenu] = useState(false)
  const shapeRef = useRef<HTMLDivElement>(null)
  useClickOutside(shapeRef, () => setShowShapeMenu(false))

  const [showChartMenu, setShowChartMenu] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  useClickOutside(chartRef, () => setShowChartMenu(false))

  const addText = () => addElement({ ...DEFAULT_TEXT_ELEMENT, id: uuid() })
  const addCode = () => addElement({ ...DEFAULT_CODE_ELEMENT, id: uuid() })
  
  const addShape = (shapeType: ShapeType = 'rectangle') => {
    const isAws = shapeType === 'aws-icon'
    const isGcp = shapeType === 'gcp-icon'
    const isIcon = isAws || isGcp

    addElement({ 
      ...DEFAULT_SHAPE_ELEMENT, 
      id: uuid(),
      content: { 
        ...DEFAULT_SHAPE_ELEMENT.content, 
        shapeType,
        iconPath: isAws 
          ? 'icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_Amazon-EC2_32.svg'
          : isGcp
          ? 'icons/gcp/Compute/Compute Engine.svg'
          : undefined,
        iconLabel: isAws ? 'Amazon EC2' : isGcp ? 'Compute Engine' : undefined,
        iconCategory: isAws ? 'Arch_Compute' : isGcp ? 'Compute' : undefined,
        label: isAws ? 'Amazon EC2' : isGcp ? 'Compute Engine' : DEFAULT_SHAPE_ELEMENT.content.label
      }
    })
    setShowShapeMenu(false)
  }

  const addChart = (chartType: ChartType = 'bar') => {
    addElement({ 
      ...DEFAULT_CHART_ELEMENT, 
      id: uuid(),
      content: { ...DEFAULT_CHART_ELEMENT.content, chartType }
    })
    setShowChartMenu(false)
  }

  const addLine = (lineType: LineType) => {
    const branches = lineType === 'branching' ? [
      { x: 1, y: 0 }, // Up
      { x: 1, y: 1 }  // Down
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
  }

  return (
    <>
      <button className={btnBase} onClick={addText}>
        <Type size={13} /> Text
      </button>
      <button className={btnBase} onClick={addCode}>
        <Code2 size={13} /> Code
      </button>

      <div className="relative" ref={shapeRef}>
        <button className={btnBase} onClick={() => setShowShapeMenu(!showShapeMenu)}>
          <Shapes size={13} /> Shape <ChevronDown size={10} />
        </button>
        {showShapeMenu && (
          <div className="absolute left-0 top-full mt-1.5 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-lg shadow-2xl z-50 p-1.5 w-44 max-h-64 overflow-y-auto custom-scrollbar transition-colors">
            {SHAPE_OPTIONS.map((so) => (
              <button
                key={so.value}
                onClick={() => addShape(so.value as ShapeType)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition-colors cursor-pointer border-none bg-transparent text-left"
              >
                {so.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative" ref={chartRef}>
        <button className={btnBase} onClick={() => setShowChartMenu(!showChartMenu)}>
          <BarChart3 size={13} /> Chart <ChevronDown size={10} />
        </button>
        {showChartMenu && (
          <div className="absolute left-0 top-full mt-1.5 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-lg shadow-2xl z-50 p-1.5 w-36 transition-colors">
            {CHART_TYPE_OPTIONS.map((ct) => (
              <button
                key={ct.value}
                onClick={() => addChart(ct.value as ChartType)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition-colors cursor-pointer border-none bg-transparent text-left"
              >
                <span className="text-base w-4 text-center">{ct.icon}</span>
                {ct.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-(--ms-border) mx-0.5" />
      <div className="relative" ref={lineRef}>
        <button
          className={btnBase}
          onClick={() => setShowLineMenu(!showLineMenu)}
        >
          <Minus size={13} /> Line <ChevronDown size={10} />
        </button>
        {showLineMenu && (
          <div className="absolute left-0 top-full mt-1.5 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-lg shadow-2xl z-50 p-1.5 w-36 transition-colors">
            {LINE_TYPE_OPTIONS.map((lt) => (
              <button
                key={lt.value}
                onClick={() => addLine(lt.value as LineType)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition-colors cursor-pointer border-none bg-transparent text-left"
              >
                <span className="text-base w-4 text-center">{lt.icon}</span>
                {lt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
