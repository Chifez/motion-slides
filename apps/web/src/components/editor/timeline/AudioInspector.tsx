import { X, Trash2 } from 'lucide-react'

interface Props {
  audioInfo: any
  label: string
  accentColor: string
  onUpdate: (updates: Partial<any>) => void
  onDelete: () => void
  onClose: () => void
}

/**
 * Right-side panel showing volume, speed, and trim details for a selected audio clip.
 * Rendered when the user double-clicks a VO or BGM clip in the timeline.
 */
export function AudioInspector({ audioInfo, label, accentColor, onUpdate, onDelete, onClose }: Props) {
  const activeDuration = (audioInfo.trimEnd - audioInfo.trimStart) / audioInfo.playbackRate

  return (
    <div
      className="w-52 shrink-0 bg-[#0f0f13] border-l border-white/[0.08] flex flex-col overflow-y-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: accentColor }}>
          {label}
        </span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/8 rounded text-white/30 hover:text-white border-none bg-transparent cursor-pointer"
        >
          <X size={12} />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-3 py-3">
        {/* Delete — at the top for quick access */}
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-500/8 hover:bg-red-500/18 border border-red-900/40 hover:border-red-700/60 text-red-400/80 hover:text-red-300 text-[10px] font-semibold rounded-lg cursor-pointer transition-all"
        >
          <Trash2 size={10} /> Remove clip
        </button>

        {/* Volume */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-white/40 font-medium">Volume</span>
            <span className="font-mono text-white/70">{Math.round(audioInfo.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={audioInfo.volume}
            onChange={e => onUpdate({ volume: parseFloat(e.target.value) })}
            className="w-full h-1 rounded-full cursor-pointer"
            style={{ accentColor }}
          />
          <div className="flex justify-between text-[8px] text-white/20">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>

        {/* Speed */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-white/40 font-medium">Speed</span>
          <div className="grid grid-cols-3 gap-1">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
              <button
                key={rate}
                onClick={() => onUpdate({ playbackRate: rate })}
                className={`py-1 text-[9px] font-mono rounded cursor-pointer border transition-colors ${
                  audioInfo.playbackRate === rate
                    ? 'text-white border-transparent'
                    : 'bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/70'
                }`}
                style={
                  audioInfo.playbackRate === rate
                    ? { backgroundColor: accentColor + '33', borderColor: accentColor }
                    : {}
                }
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Trim info */}
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5 space-y-1.5 text-[10px]">
          <div className="flex justify-between text-white/40">
            <span>Trim start</span>
            <span className="font-mono text-white/60">{audioInfo.trimStart.toFixed(2)}s</span>
          </div>
          <div className="flex justify-between text-white/40">
            <span>Trim end</span>
            <span className="font-mono text-white/60">{audioInfo.trimEnd.toFixed(2)}s</span>
          </div>
          <div className="pt-1 border-t border-white/[0.06] flex justify-between font-semibold">
            <span className="text-white/50">Active</span>
            <span className="font-mono" style={{ color: accentColor }}>{activeDuration.toFixed(2)}s</span>
          </div>
        </div>
      </div>
    </div>
  )
}
