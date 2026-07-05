import { PX_PER_SEC, SLIDE_TRACK_H, SLIDE_GRADIENTS } from './constants'
import type { SlideWithTiming } from './types'

interface Props {
  slidesWithTiming: SlideWithTiming[]
  liveSlideIndex: number
  onSlideResizeMouseDown: (e: React.MouseEvent, slideId: string, currentDuration: number) => void
  onSlideClick: (index: number, startTime: number) => void
}

export function SlideTrackRow({ slidesWithTiming, liveSlideIndex, onSlideResizeMouseDown, onSlideClick }: Props) {
  return (
    <div
      className="flex-shrink-0 border-b relative"
      style={{ height: SLIDE_TRACK_H, borderColor: 'var(--ms-tl-border)' }}
    >
      <div className="absolute inset-0" style={{ backgroundColor: 'var(--ms-tl-surface)' }} />
      {slidesWithTiming.map(item => {
        const isActive = liveSlideIndex === item.index
        const gradient = SLIDE_GRADIENTS[item.index % SLIDE_GRADIENTS.length]
        const cardW = item.duration * PX_PER_SEC

        return (
          <div
            key={item.slide.id}
            className="absolute top-2.5 group"
            onClick={() => onSlideClick(item.index, item.start)}
            style={{
              left: `${item.start * PX_PER_SEC + 2}px`,
              width: `${Math.max(40, cardW - 4)}px`,
              height: `${SLIDE_TRACK_H - 20}px`,
            }}
          >
            <div
              className={`w-full h-full rounded-lg bg-gradient-to-br cursor-pointer relative overflow-hidden transition-all ${gradient} ${
                isActive
                  ? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-[#0a0a0c] shadow-[0_0_16px_rgba(139,92,246,0.3)]'
                  : 'border border-white/10 hover:border-white/25'
              }`}
            >
              <div className="absolute top-1.5 left-2 text-[10px] font-bold font-mono" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {String(item.index + 1).padStart(2, '0')}
              </div>
              <div className="absolute bottom-1.5 right-2 text-[8px] font-mono px-1 rounded" style={{ color: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                {item.duration.toFixed(1)}s
              </div>
              {cardW > 60 && (
                <div className="absolute inset-x-2 bottom-5 flex flex-col min-w-0">
                  <span className="text-[9px] font-bold text-white/80 truncate">
                    {item.slide.name || 'Untitled Slide'}
                  </span>
                  {item.slide.script && (
                    <span className="text-[7.5px] text-white/50 truncate italic leading-tight">
                      "{item.slide.script}"
                    </span>
                  )}
                </div>
              )}
              {isActive && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              )}
            </div>
            <div
              onMouseDown={e => onSlideResizeMouseDown(e, item.slide.id, item.duration)}
              className="absolute right-0 top-0 h-full w-2 cursor-ew-resize flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Drag to resize"
            >
              <div className="w-0.5 h-4 bg-violet-400/60 rounded-full" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
