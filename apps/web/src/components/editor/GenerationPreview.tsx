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
      <div className="p-3 bg-(--ms-bg-elevated)/90 backdrop-blur-md border-t border-(--ms-border) flex gap-2">
        <button
          onClick={onReject}
          className="flex-1 py-2 text-xs font-semibold text-(--ms-text-secondary) hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5"
        >
          <X size={12} /> Discard
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md shadow-blue-900/20 transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5"
        >
          <Check size={12} /> Add to Project
        </button>
      </div>
    </div>
  )
}
