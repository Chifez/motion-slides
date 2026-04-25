import type { Slide } from '@motionslides/shared'

interface Props {
  slides: Slide[]
  title:  string
  onAccept: () => void
  onReject: () => void
}

export function GenerationPreview({ slides, title, onAccept, onReject }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
        <p className="text-xs text-neutral-400">{slides.length} slides ready to import.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {slides.map((s, i) => (
          <div key={s.id} className="group relative">
            <div className="absolute -left-2 top-2 w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] text-neutral-400 z-10">
              {i + 1}
            </div>
            <div className="aspect-video bg-[#0a0a0a] border border-neutral-700 rounded-lg overflow-hidden shadow-lg transition-transform group-hover:scale-[1.02]">
              {/* Mini preview logic could go here, but for now just showing names */}
              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                <span className="text-[10px] font-medium text-neutral-300 mb-1">{s.name}</span>
                <span className="text-[8px] text-neutral-500">{s.elements.length} elements</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-neutral-900 border-t border-white/5 space-y-2">
        <button
          onClick={onAccept}
          className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer border-none"
        >
          Import into Project
        </button>
        <button
          onClick={onReject}
          className="w-full py-2 text-neutral-400 hover:text-white text-xs transition-colors cursor-pointer border-none bg-transparent"
        >
          Discard and go back
        </button>
      </div>
    </div>
  )
}
