import { useEffect, useRef } from 'react'
import { WAVE_PATTERN, resolveCanvasColor } from './constants'
import { useAudioWaveform } from '@/hooks/use-audio-waveform'

interface Props {
  color?: string
  audioUrl?: string
  trimStart?: number
  trimEnd?: number
  duration?: number
}

/**
 * Renders decoded audio peak bars (or a subtle fallback cadence) onto a DPR-aware canvas,
 * resolving CSS custom properties and redrawing when the root theme class changes.
 */
export function WaveformDecoration({
  color = 'rgba(255,255,255,0.25)',
  audioUrl,
  trimStart = 0,
  trimEnd,
  duration,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const allPeaks = useAudioWaveform(audioUrl, { numberOfBars: 200 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function draw() {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)

      const w = rect.width
      const h = rect.height
      ctx.clearRect(0, 0, w, h)

      const effectiveDuration = duration ?? null
      const effectiveTrimEnd = trimEnd ?? effectiveDuration
      const trimWindow =
        effectiveDuration != null && effectiveTrimEnd != null
          ? effectiveTrimEnd - trimStart
          : null

      type Bar = { xFraction: number; peak: number }
      const bars: Bar[] = []

      if (allPeaks.length > 0 && effectiveDuration != null && trimWindow != null && trimWindow > 0) {
        allPeaks.forEach((peak, i) => {
          const barTime = (i / allPeaks.length) * effectiveDuration
          if (barTime >= trimStart && barTime <= (effectiveTrimEnd ?? effectiveDuration)) {
            bars.push({ xFraction: (barTime - trimStart) / trimWindow, peak })
          }
        })
      }

      const drawBars: Bar[] =
        bars.length > 0
          ? bars
          : Array.from({ length: 60 }, (_, i) => ({
              xFraction: i / 60,
              peak: WAVE_PATTERN[i % WAVE_PATTERN.length] / 28,
            }))

      const barWidth = Math.max(1.5, w / drawBars.length - 1.5)
      const resolvedColor = resolveCanvasColor(canvas, color)
      const maxBarHeight = Math.max(4, h - 14)

      ctx.fillStyle = resolvedColor
      drawBars.forEach(({ xFraction, peak }) => {
        const barH = Math.max(2, peak * maxBarHeight)
        const x = xFraction * w
        const y = h - 4 - barH
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barH, 1)
        ctx.fill()
      })
    }

    draw()

    const resizeObserver = new ResizeObserver(draw)
    resizeObserver.observe(canvas)

    const themeObserver = new MutationObserver(draw)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      resizeObserver.disconnect()
      themeObserver.disconnect()
    }
  }, [allPeaks, color, trimStart, trimEnd, duration])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  )
}
