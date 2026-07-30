import { memo } from 'react'
import { Sparkles, X } from 'lucide-react'

interface Props {
  onClose: () => void
}

export const AIChatHeader = memo(function AIChatHeader({ onClose }: Props) {
  return (
    <div className="h-12 flex items-center justify-between px-4 border-b border-(--ms-border)">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400">
          <Sparkles size={16} />
        </div>
        <span className="text-sm font-semibold text-(--ms-text-primary)">AI Designer</span>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition-colors border-none bg-transparent cursor-pointer"
      >
        <X size={18} />
      </button>
    </div>
  )
})
