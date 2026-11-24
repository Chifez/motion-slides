import { ArrowLeftRight, FileText, Mic } from 'lucide-react'
import type { SlideTransition } from '@motionslides/shared'
import { SLIDE_TRACK_H, TRANSITION_LABELS } from './constants'
import type { ResizingSlideState, SlideWithTiming } from './types'

export interface TransitionSeamTarget {
  fromSlideId: string
  toSlideId: string
  transition: SlideTransition | null
  anchorRect: DOMRect
}

interface Props {
  slidesWithTiming: SlideWithTiming[]
  liveSlideIndex: number
  pxPerSec: number
  resizingSlide: ResizingSlideState | null
  onSlideResizeMouseDown: (e: React.MouseEvent, slideId: string, currentDuration: number) => void
  onSlideClick: (index: number, startTime: number) => void
  onTransitionSeamClick: (target: TransitionSeamTarget) => void
}

/**
 * Slides track displaying real slide-background-tinted cards, duration readouts,
 * audio/script badges, right-edge duration resizing, and clickable transition seam pills.
 */
export function SlideTrackRow({
  slidesWithTiming,
  liveSlideIndex,
  pxPerSec,
  resizingSlide,
  onSlideResizeMouseDown,
  onSlideClick,
  onTransitionSeamClick,
}: Props) {
  return (
    <div
      className="flex-shrink-0 border-b relative"
      style={{
        height: SLIDE_TRACK_H,
        borderColor: 'var(--ms-tl-border)',
        backgroundColor: 'var(--ms-tl-track-bg)',
      }}
    >
      {slidesWithTiming.map(item => {
        const isActive = liveSlideIndex === item.index
        const isResizingThis = resizingSlide?.slideId === item.slide.id
        const displayDuration = isResizingThis ? resizingSlide.duration : item.duration
        const cardW = item.duration * pxPerSec
        const hasAudio = Boolean(item.slide.audio)
        const hasScript = Boolean(item.slide.script && item.slide.script.trim())

        return (
          <div
            key={item.slide.id}
            className="absolute top-2 group"
            onClick={() => onSlideClick(item.index, item.start)}
            style={{
              left: `${item.start * pxPerSec + 2}px`,
              width: `${Math.max(40, cardW - 4)}px`,
              height: `${SLIDE_TRACK_H - 16}px`,
            }}
          >
            <div
              className={`w-full h-full rounded-lg cursor-pointer relative overflow-hidden transition-[box-shadow,border-color] duration-150 ${
                isActive
                  ? 'ring-[1.5px] ring-(--ms-accent) shadow-[0_2px_12px_rgba(37,99,235,0.22)]'
                  : 'ring-1 ring-black/15 dark:ring-white/10 hover:ring-black/35 dark:hover:ring-white/25'
              }`}
              style={{ background: item.slide.background || '#18181b' }}
            >
              {/* Scrim keeps slide typography crisp regardless of bright or light slide backgrounds */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to top, rgba(9,9,11,0.86) 0%, rgba(9,9,11,0.52) 55%, rgba(9,9,11,0.34) 100%)',
                }}
              />

              {/* Top row: slide index + status icons */}
              <div className="relative z-10 flex items-center justify-between px-2 pt-1.5 gap-1">
                <span
                  className={`text-[10px] font-mono tabular-nums font-semibold px-1 py-0.5 rounded leading-none ${
                    isActive
                      ? 'bg-(--ms-accent) text-white'
                      : 'bg-black/40 text-white/85'
                  }`}
                >
                  {String(item.index + 1).padStart(2, '0')}
                </span>

                {cardW > 64 && (
                  <div className="flex items-center gap-1 text-white/55">
                    {hasScript && <FileText size={9} aria-label="Has script" />}
                    {hasAudio && <Mic size={9} aria-label="Has voiceover" />}
                  </div>
                )}
              </div>

              {/* Bottom row: title + duration pill */}
              <div className="relative z-10 flex items-end justify-between gap-1.5 px-2 pt-2.5">
                {cardW > 76 ? (
                  <span className="text-[11px] font-medium text-white/90 truncate leading-tight min-w-0">
                    {item.slide.name || 'Untitled Slide'}
                  </span>
                ) : (
                  <span />
                )}
                <span
                  className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded leading-none shrink-0 ${
                    isResizingThis
                      ? 'bg-(--ms-accent) text-white font-semibold'
                      : 'bg-black/45 text-white/70'
                  }`}
                >
                  {displayDuration.toFixed(1)}s
                </span>
              </div>
            </div>

            {/* Right edge duration resize handle */}
            <div
              onMouseDown={e => onSlideResizeMouseDown(e, item.slide.id, item.duration)}
              onClick={e => e.stopPropagation()}
              className={`absolute right-0 top-0 h-full w-2.5 cursor-ew-resize flex items-center justify-center z-10 transition-opacity duration-150 ${
                isResizingThis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              title="Drag to adjust slide duration (hold Shift for 0.5s steps)"
            >
              <div className="w-0.5 h-5 bg-white/80 rounded-full shadow" />
            </div>
          </div>
        )
      })}

      {/* Clickable Transition Seam Pills between adjacent slides */}
      {slidesWithTiming.slice(0, -1).map((item, idx) => {
        const nextItem = slidesWithTiming[idx + 1]
        const transition = item.outgoingTransition
        const animLabel = transition ? (TRANSITION_LABELS[transition.animation] ?? transition.animation) : 'Cut'
        return (
          <button
            key={`seam-${item.slide.id}`}
            type="button"
            onClick={e => {
              e.stopPropagation()
              onTransitionSeamClick({
                fromSlideId: item.slide.id,
                toSlideId: nextItem.slide.id,
                transition,
                anchorRect: e.currentTarget.getBoundingClientRect(),
              })
            }}
            style={{ left: `${item.end * pxPerSec}px` }}
            title={`Transition: ${animLabel}${transition ? ` (${transition.duration}ms)` : ''}`}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 h-5 px-1.5 rounded-full border border-(--ms-tl-border-strong) bg-(--ms-bg-elevated) text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) hover:border-(--ms-accent) shadow-sm flex items-center gap-1 cursor-pointer transition-[border-color,color,transform] duration-150 active:scale-[0.95]"
          >
            <ArrowLeftRight size={9} />
          </button>
        )
      })}
    </div>
  )
}
