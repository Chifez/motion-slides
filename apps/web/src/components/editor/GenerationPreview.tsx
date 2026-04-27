import { useState } from 'react'
import type { Slide } from '@motionslides/shared'
import { Send } from 'lucide-react'

interface Props {
  slides: Slide[]
  title:  string
  onAccept: () => void
  onReject: () => void
  onRefine?: (prompt: string) => void
}

export function GenerationPreview({ slides, title, onAccept, onReject, onRefine }: Props) {
  const [refinePrompt, setRefinePrompt] = useState('')

  const handleRefine = () => {
    if (refinePrompt.trim() && onRefine) {
      onRefine(refinePrompt.trim())
      setRefinePrompt('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-(--ms-border)">
        <h3 className="text-sm font-semibold text-(--ms-text-primary) mb-1">{title}</h3>
        <p className="text-xs text-(--ms-text-muted)">{slides.length} slides ready to import.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {slides.map((s, i) => (
          <div key={s.id} className="group relative">
            <div className="absolute -left-2 top-2 w-5 h-5 rounded-full bg-(--ms-bg-elevated) border border-(--ms-border) flex items-center justify-center text-[10px] text-(--ms-text-muted) z-10 transition-colors">
            {i + 1}
          </div>
            <div className="aspect-video bg-(--ms-bg-base) border border-(--ms-border) rounded-lg overflow-hidden shadow-lg transition-all group-hover:scale-[1.02]">
              {/* Mini preview logic could go here, but for now just showing names */}
              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                <span className="text-[10px] font-medium text-(--ms-text-secondary) mb-1 transition-colors">{s.name}</span>
                <span className="text-[8px] text-(--ms-text-muted) transition-colors">{s.elements.length} elements</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-(--ms-bg-elevated) border-t border-(--ms-border) space-y-2 transition-colors">
        {onRefine && (
          <div className="relative mb-2">
            <input
              type="text"
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
              placeholder="Refine (e.g., 'Make titles bigger')"
              className="w-full bg-black/20 border border-(--ms-border) rounded-xl py-2 pl-3 pr-10 text-xs text-(--ms-text-primary) placeholder:text-(--ms-text-muted) focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <button
              onClick={handleRefine}
              disabled={!refinePrompt.trim()}
              className="absolute right-1 top-1 bottom-1 px-2 text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center"
            >
              <Send size={14} />
            </button>
          </div>
        )}

        <button
          onClick={onAccept}
          className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer border-none"
        >
          Import into Project
        </button>
        <button
          onClick={onReject}
          className="w-full py-2 text-(--ms-text-muted) hover:text-(--ms-text-primary) text-xs transition-colors cursor-pointer border-none bg-transparent"
        >
          Discard and go back
        </button>
      </div>
    </div>
  )
}
