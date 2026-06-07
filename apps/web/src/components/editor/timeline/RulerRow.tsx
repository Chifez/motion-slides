import { PX_PER_SEC, RULER_H } from './constants'

interface Props {
  totalDuration: number
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
}

export function RulerRow({ totalDuration, onMouseDown }: Props) {
  return (
    <div
      className="flex-shrink-0 border-b relative cursor-crosshair"
      style={{ height: RULER_H, backgroundColor: 'var(--ms-tl-bg)', borderColor: 'var(--ms-tl-border)' }}
      onMouseDown={onMouseDown}
    >
      {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, idx) => {
        const isMajor = idx % 5 === 0 || idx === 0
        return (
          <div
            key={idx}
            className="absolute bottom-0 flex flex-col items-start"
            style={{ left: `${idx * PX_PER_SEC}px` }}
          >
            <span className="text-[8px] font-mono pl-1" style={{ color: isMajor ? 'var(--ms-tl-text-muted)' : 'var(--ms-tl-text-dim)' }}>
              {isMajor ? `${idx}s` : ''}
            </span>
            <div
              className={`w-px ${isMajor ? 'h-2.5' : 'h-1.5'}`}
              style={{ backgroundColor: isMajor ? 'var(--ms-tl-border-strong)' : 'var(--ms-tl-border)' }}
            />
          </div>
        )
      })}
      {Array.from({ length: Math.ceil(totalDuration * 2) }).map((_, idx) => {
        if (idx % 2 === 0) return null
        return (
          <div
            key={`h-${idx}`}
            className="absolute bottom-0 w-px h-1 bg-white/[0.04]"
            style={{ left: `${idx * 0.5 * PX_PER_SEC}px` }}
          />
        )
      })}
    </div>
  )
}
