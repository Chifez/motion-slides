import { MousePointer, Hand } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'

export function ToolSelector() {
  const activeTool = useEditorStore((state) => state.activeTool)
  const setActiveTool = useEditorStore((state) => state.setActiveTool)

  return (
    <div className="flex items-center bg-(--ms-bg-elevated) border border-(--ms-border) rounded-md p-0.5 mr-1 shrink-0">
      <button
        onClick={() => setActiveTool('select')}
        className={`flex items-center justify-center p-1.5 rounded-sm cursor-pointer border-none transition-all ${
          activeTool === 'select'
            ? 'bg-(--ms-border-strong) text-blue-400 shadow-sm'
            : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
        }`}
        title="Select Tool (V)"
      >
        <MousePointer size={14} />
      </button>
      <button
        onClick={() => setActiveTool('hand')}
        className={`flex items-center justify-center p-1.5 rounded-sm cursor-pointer border-none transition-all ${
          activeTool === 'hand'
            ? 'bg-(--ms-border-strong) text-blue-400 shadow-sm'
            : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
        }`}
        title="Hand Tool (H)"
      >
        <Hand size={14} />
      </button>
    </div>
  )
}
