import { RULER_H, formatRulerTick, getRulerIntervals } from './constants'

interface Props {
  totalDuration: number
  pxPerSec: number
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
}

/**
 * Interactive timeline ruler with zoom-adaptive major/minor ticks and `tabular-nums` labels.
 */
export function RulerRow({ totalDuration, pxPerSec, onMouseDown }: Props) {
  const { majorSec, minorSec } = getRulerIntervals(pxPerSec)
  const minorPerMajor = Math.max(1, Math.round(majorSec / minorSec))
  const totalSteps = Math.max(1, Math.ceil((totalDuration + 1) / minorSec))

  return (
    <div
      className="flex-shrink-0 border-b relative cursor-crosshair select-none"
      style={{
        height: RULER_H,
        backgroundColor: 'var(--ms-tl-surface)',
        borderColor: 'var(--ms-tl-border)',
      }}
      onMouseDown={onMouseDown}
    >
      {Array.from({ length: totalSteps }).map((_, stepIdx) => {
        const timeSec = stepIdx * minorSec
        const isMajor = stepIdx % minorPerMajor === 0
        return (
          <div
            key={stepIdx}
            className="absolute bottom-0 flex flex-col items-start pointer-events-none"
            style={{ left: `${timeSec * pxPerSec}px` }}
          >
            {isMajor && (
              <span
                className="text-[10px] font-mono tabular-nums pl-1 leading-none mb-0.5"
                style={{ color: 'var(--ms-tl-text-muted)' }}
              >
                {formatRulerTick(timeSec)}
              </span>
            )}
            <div
              className={`w-px ${isMajor ? 'h-2.5' : 'h-1.5'}`}
              style={{
                backgroundColor: isMajor ? 'var(--ms-tl-border-strong)' : 'var(--ms-tl-border)',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
