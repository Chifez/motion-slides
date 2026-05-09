import { useState } from 'react'
import type { Slide } from '@motionslides/shared'
import { Send, Check, X, RefreshCw } from 'lucide-react'

import { StaticSlidePreview } from './ai/StaticSlidePreview'

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
    <div className="flex flex-col h-full bg-black/40">
      {/* Scrollable Slides Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {slides.map((s, i) => (
          <div key={s.id} className="group relative">
            <div className="absolute -left-1 top-2 w-4 h-4 rounded-full bg-(--ms-bg-elevated) border border-(--ms-border) flex items-center justify-center text-[8px] text-(--ms-text-muted) z-10 font-bold">
              {i + 1}
            </div>
            <div className="aspect-video bg-(--ms-bg-base) border border-blue-500/30 rounded-lg overflow-hidden shadow-2xl transition-all group-hover:border-blue-500/60 group-hover:scale-[1.01]">
              <StaticSlidePreview slide={s} />
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Bar */}
      <div className="p-3 bg-(--ms-bg-elevated)/90 backdrop-blur-md border-t border-(--ms-border) space-y-3">
        {onRefine && (
          <div className="relative">
            <input
              type="text"
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
              placeholder="Quick tweak..."
              className="w-full bg-black/40 border border-(--ms-border) rounded-lg py-1.5 pl-3 pr-8 text-[11px] text-(--ms-text-primary) placeholder:text-(--ms-text-muted) focus:outline-none focus:border-blue-500/50"
            />
            <button
              onClick={handleRefine}
              disabled={!refinePrompt.trim()}
              className="absolute right-1 top-1 bottom-1 px-1.5 text-blue-400 hover:text-blue-300 disabled:opacity-30 bg-transparent border-none cursor-pointer"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onReject}
            className="flex-1 py-1.5 bg-(--ms-bg-base) hover:bg-(--ms-border) text-(--ms-text-secondary) text-[11px] font-medium rounded-lg transition-all cursor-pointer border border-(--ms-border) flex items-center justify-center gap-1.5"
          >
            <X size={12} /> Discard
          </button>
          <button
            onClick={onAccept}
            className="flex-[2] py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer border-none shadow-lg flex items-center justify-center gap-1.5"
          >
            <Check size={12} /> Import {slides.length} Slides
          </button>
        </div>
      </div>
    </div>
  )
}
