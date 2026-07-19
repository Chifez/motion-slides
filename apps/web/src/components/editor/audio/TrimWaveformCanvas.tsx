import { useEffect, useRef } from 'react'

interface TrimWaveformCanvasProps {
  peaks: number[]
  trimStart: number
  trimEnd: number
  duration: number
  playbackTime: number
  isPlaying: boolean
  onClick: (percent: number) => void
}

export function TrimWaveformCanvas({
  peaks,
  trimStart,
  trimEnd,
  duration,
  playbackTime,
  isPlaying,
  onClick,
}: TrimWaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || peaks.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height

    ctx.clearRect(0, 0, w, h)

    const barWidth = w / peaks.length
    const gap = 1.5

    peaks.forEach((peak, i) => {
      const x = i * barWidth
      const barHeight = peak * (h - 8)
      const y = (h - barHeight) / 2

      const barTime = (i / peaks.length) * duration
      const isWithinTrim = barTime >= trimStart && barTime <= trimEnd
      const isPlayed = isPlaying && barTime <= playbackTime && barTime >= trimStart

      if (isPlayed) {
        ctx.fillStyle = '#3b82f6'
      } else if (isWithinTrim) {
        ctx.fillStyle = '#6366f1'
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
      }

      ctx.beginPath()
      ctx.roundRect(x, y, barWidth - gap, barHeight, 2)
      ctx.fill()
    })

    if (isPlaying) {
      const playbackX = (playbackTime / duration) * w
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(playbackX, 0)
      ctx.lineTo(playbackX, h)
      ctx.stroke()
    }

    const startX = (trimStart / duration) * w
    const endX = (trimEnd / duration) * w

    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.moveTo(startX, 0)
    ctx.lineTo(startX, h)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(endX, 0)
    ctx.lineTo(endX, h)
    ctx.stroke()

  }, [peaks, trimStart, trimEnd, duration, playbackTime, isPlaying])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percent = Math.max(0, Math.min(clickX / rect.width, 1))
    onClick(percent)
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="w-full h-full cursor-pointer"
    />
  )
}
