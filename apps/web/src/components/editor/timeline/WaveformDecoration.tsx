import { WAVE_PATTERN } from './constants'

interface Props {
  color?: string
}

/** Repeating bar-chart decoration rendered across audio clip backgrounds */
export function WaveformDecoration({ color = 'rgba(255,255,255,0.25)' }: Props) {
  return (
    <div className="absolute inset-0 flex items-center px-3 pointer-events-none overflow-hidden gap-px">
      {Array.from({ length: 120 }).map((_, i) => {
        const h = WAVE_PATTERN[i % WAVE_PATTERN.length]
        return (
          <div
            key={i}
            style={{ height: `${h}px`, backgroundColor: color, minWidth: '2px' }}
            className="rounded-full flex-shrink-0"
          />
        )
      })}
    </div>
  )
}
