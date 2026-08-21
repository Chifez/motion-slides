import { useState, useEffect } from 'react'

const waveformCache = new Map<string, number[]>()

interface Options {
  numberOfBars?: number
}

export function useAudioWaveform(
  url: string | null | undefined,
  { numberOfBars = 80 }: Options = {},
): number[] {
  const [peaks, setPeaks] = useState<number[]>([])

  useEffect(() => {
    if (!url) {
      setPeaks([])
      return
    }

    const audioUrl = url
    const cacheKey = `${audioUrl}::${numberOfBars}`

    if (waveformCache.has(cacheKey)) {
      setPeaks(waveformCache.get(cacheKey)!)
      return
    }

    const controller = new AbortController()
    let active = true

    async function generateWaveform() {
      let audioCtx: AudioContext | null = null
      try {
        const response = await fetch(audioUrl, { signal: controller.signal })
        if (!response.ok) throw new Error('Failed to fetch audio')

        const arrayBuffer = await response.arrayBuffer()
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!AudioContextClass) return

        audioCtx = new AudioContextClass()
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        const rawData = audioBuffer.getChannelData(0)
        const totalSamples = rawData.length

        const blockSize = Math.floor(totalSamples / numberOfBars)
        const computedPeaks: number[] = []

        for (let i = 0; i < numberOfBars; i++) {
          const start = i * blockSize
          let maxVal = 0
          for (let j = 0; j < blockSize; j++) {
            const val = Math.abs(rawData[start + j] || 0)
            if (val > maxVal) maxVal = val
          }
          computedPeaks.push(maxVal)
        }

        const maxPeak = Math.max(...computedPeaks) || 1
        const normalizedPeaks = computedPeaks.map((val) => val / maxPeak)

        if (active) {
          waveformCache.set(cacheKey, normalizedPeaks)
          setPeaks(normalizedPeaks)
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Error generating waveform:', err)
        }
      } finally {
        if (audioCtx) {
          try {
            await audioCtx.close()
          } catch {}
        }
      }
    }

    generateWaveform()

    return () => {
      active = false
      controller.abort()
    }
  }, [url, numberOfBars])

  return peaks
}
