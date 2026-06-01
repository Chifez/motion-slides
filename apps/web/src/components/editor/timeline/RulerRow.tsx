import { PX_PER_SEC, RULER_H } from './constants'

interface Props {
  totalDuration: number
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
}

export function RulerRow({ totalDuration, onMouseDown }: Props) {
  return (
    <div
      className="flex-shrink-0 border-b border-white/[0.06] relative cursor-crosshair bg-[#0a0a0c]"
      style={{ height: RULER_H }}
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
            <span className={`text-[8px] font-mono pl-1 ${isMajor ? 'text-white/40' : 'text-white/15'}`}>
              {isMajor ? `${idx}s` : ''}
            </span>
            <div className={`w-px ${isMajor ? 'h-2.5 bg-white/20' : 'h-1.5 bg-white/[0.08]'}`} />
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
