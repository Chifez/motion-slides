import { useState, useEffect, useRef } from 'react'
import { Volume2, Gauge, RotateCw, Play, Pause, Loader2, Scissors } from 'lucide-react'
import type { SlideAudio } from '@motionslides/shared'

interface AudioTimelineEditorProps {
  audio: SlideAudio
  onUpdate: (updates: Partial<SlideAudio>) => void
}

export function AudioTimelineEditor({ audio, onUpdate }: AudioTimelineEditorProps) {
  const [peaks, setPeaks] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(audio.trimStart)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const startTimeRef = useRef<number>(0)
  const pauseTimeRef = useRef<number>(audio.trimStart)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    let active = true
    if (!audio.url) return

    async function loadAudio() {
      setIsLoading(true)
      try {
        const res = await fetch(audio.url)
        if (!res.ok) throw new Error('Failed to fetch audio file')
        const arrayBuffer = await res.arrayBuffer()
        
        // We initialize AudioContext lazily on user gesture to conform to browser policies,
        // but here we can decode data with a temporary offline context or raw context.
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        
        if (!active) return
        audioBufferRef.current = decodedBuffer

        const channelData = decodedBuffer.getChannelData(0)
        const sampleCount = 120
        const blockSize = Math.floor(channelData.length / sampleCount)
        const calculatedPeaks: number[] = []

        for (let i = 0; i < sampleCount; i++) {
          const start = i * blockSize
          let max = 0
          for (let j = 0; j < blockSize; j++) {
            const val = Math.abs(channelData[start + j] || 0)
            if (val > max) max = val
          }
          calculatedPeaks.push(max)
        }

        const maxPeak = Math.max(...calculatedPeaks, 0.01)
        const normalized = calculatedPeaks.map(p => p / maxPeak)
        
        setPeaks(normalized)
      } catch (err) {
        console.error('[Waveform Generator] Failed to process audio:', err)
        setPeaks(Array.from({ length: 80 }, () => Math.random() * 0.6 + 0.2))
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadAudio()

    return () => {
      active = false
      stopPlayback()
    }
  }, [audio.url])

  useEffect(() => {
    return () => {
      stopPlayback()
    }
  }, [audio.url])

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

      const barTime = (i / peaks.length) * audio.duration
      const isWithinTrim = barTime >= audio.trimStart && barTime <= audio.trimEnd
      const isPlayed = isPlaying && barTime <= playbackTime && barTime >= audio.trimStart

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
      const playbackX = (playbackTime / audio.duration) * w
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(playbackX, 0)
      ctx.lineTo(playbackX, h)
      ctx.stroke()
    }

    const startX = (audio.trimStart / audio.duration) * w
    const endX = (audio.trimEnd / audio.duration) * w

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

  }, [peaks, audio.trimStart, audio.trimEnd, audio.duration, playbackTime, isPlaying])

  const startPlayback = () => {
    if (!audioBufferRef.current) return

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    const ctx = audioContextRef.current
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop()
      } catch (e) {}
    }

    const source = ctx.createBufferSource()
    source.buffer = audioBufferRef.current
    source.playbackRate.value = audio.playbackRate
    source.loop = audio.loop
    
    if (audio.loop) {
      source.loopStart = audio.trimStart
      source.loopEnd = audio.trimEnd
    }

    const gainNode = ctx.createGain()
    gainNode.gain.value = audio.volume
    
    source.connect(gainNode)
    gainNode.connect(ctx.destination)

    audioSourceRef.current = source
    gainNodeRef.current = gainNode

    let offset = pauseTimeRef.current
    if (offset < audio.trimStart || offset > audio.trimEnd) {
      offset = audio.trimStart
    }

    const durationToPlay = audio.trimEnd - offset
    
    startTimeRef.current = ctx.currentTime - (offset / audio.playbackRate)
    
    if (audio.loop) {
      source.start(0, offset)
    } else {
      source.start(0, offset, durationToPlay)
      source.onended = () => {
        if (audioSourceRef.current === source) {
          setIsPlaying(false)
          pauseTimeRef.current = audio.trimStart
          setPlaybackTime(audio.trimStart)
        }
      }
    }

    setIsPlaying(true)
    
    const updateCursor = () => {
      if (!ctx || !isPlaying) return
      const elapsed = (ctx.currentTime - startTimeRef.current) * audio.playbackRate
      
      if (audio.loop) {
        const loopLen = audio.trimEnd - audio.trimStart
        const currentLoopPos = audio.trimStart + (elapsed % loopLen)
        setPlaybackTime(currentLoopPos)
      } else {
        const currentPos = Math.min(elapsed, audio.trimEnd)
        setPlaybackTime(currentPos)
        if (currentPos >= audio.trimEnd) {
          setIsPlaying(false)
          return
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateCursor)
    }
    
    animationFrameRef.current = requestAnimationFrame(updateCursor)
  }

  const stopPlayback = () => {
    setIsPlaying(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop()
      } catch (e) {}
      audioSourceRef.current = null
    }

    if (audioContextRef.current) {
      pauseTimeRef.current = playbackTime
    }
  }

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback()
    } else {
      startPlayback()
    }
  }

  const handleWaveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = clickX / rect.width
    const clickedTime = percent * audio.duration

    const clampedTime = Math.max(audio.trimStart, Math.min(clickedTime, audio.trimEnd))
    setPlaybackTime(clampedTime)
    pauseTimeRef.current = clampedTime

    if (isPlaying) {
      stopPlayback()
      setTimeout(startPlayback, 50)
    }
  }

  const handleTrimStartChange = (val: number) => {
    const start = Math.max(0, Math.min(val, audio.trimEnd - 0.2))
    onUpdate({ trimStart: start })
    if (playbackTime < start) {
      setPlaybackTime(start)
      pauseTimeRef.current = start
    }
  }

  const handleTrimEndChange = (val: number) => {
    const end = Math.min(audio.duration, Math.max(val, audio.trimStart + 0.2))
    onUpdate({ trimEnd: end })
    if (playbackTime > end) {
      setPlaybackTime(end)
      pauseTimeRef.current = end
    }
  }

  return (
    <div className="flex flex-col gap-4 p-3 bg-(--ms-bg-surface) border border-(--ms-border) rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Scissors size={14} className="text-(--ms-accent)" />
          <span className="text-xs font-semibold text-(--ms-text-primary)">
            Trim & Audio Settings
          </span>
        </div>
        <button
          onClick={togglePlay}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-(--ms-bg-base) hover:bg-(--ms-border) text-(--ms-text-primary) transition-all border border-(--ms-border) cursor-pointer"
          title={isPlaying ? 'Pause preview' : 'Play preview'}
        >
          {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>

      <div className="relative h-16 bg-(--ms-bg-base)/30 border border-(--ms-border)/50 rounded-md overflow-hidden flex items-center justify-center">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-(--ms-accent)" />
            <span className="text-[10px] text-(--ms-text-muted)">Generating Waveform...</span>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onClick={handleWaveformClick}
            className="w-full h-full cursor-pointer"
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] text-(--ms-text-muted)">
          <span>Trim Start: {audio.trimStart.toFixed(2)}s</span>
          <span>Trim End: {audio.trimEnd.toFixed(2)}s</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-medium text-(--ms-text-muted)">Start Point</span>
            <input
              type="range"
              min={0}
              max={audio.duration}
              step={0.05}
              value={audio.trimStart}
              onChange={(e) => handleTrimStartChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-(--ms-border) rounded-lg appearance-none cursor-pointer accent-(--ms-accent)"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-medium text-(--ms-text-muted)">End Point</span>
            <input
              type="range"
              min={0}
              max={audio.duration}
              step={0.05}
              value={audio.trimEnd}
              onChange={(e) => handleTrimEndChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-(--ms-border) rounded-lg appearance-none cursor-pointer accent-(--ms-accent)"
            />
          </div>
        </div>
      </div>

      <hr className="border-(--ms-border) my-1" />

      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-2.5">
          <Volume2 size={14} className="text-(--ms-text-muted) shrink-0" />
          <div className="flex-1 flex items-center justify-between gap-3">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audio.volume}
              onChange={(e) => onUpdate({ volume: parseFloat(e.target.value) })}
              className="flex-1 h-1 bg-(--ms-border) rounded-lg appearance-none cursor-pointer accent-(--ms-accent)"
            />
            <span className="text-[10px] font-mono text-(--ms-text-secondary) w-8 text-right">
              {Math.round(audio.volume * 100)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Gauge size={14} className="text-(--ms-text-muted) shrink-0" />
          <div className="flex-1 flex items-center justify-between gap-3">
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={audio.playbackRate}
              onChange={(e) => onUpdate({ playbackRate: parseFloat(e.target.value) })}
              className="flex-1 h-1 bg-(--ms-border) rounded-lg appearance-none cursor-pointer accent-(--ms-accent)"
            />
            <span className="text-[10px] font-mono text-(--ms-text-secondary) w-8 text-right">
              {audio.playbackRate.toFixed(1)}x
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pl-0.5">
          <div className="flex items-center gap-2.5">
            <RotateCw size={14} className="text-(--ms-text-muted)" />
            <span className="text-xs text-(--ms-text-secondary)">Loop Playback</span>
          </div>
          <button
            onClick={() => onUpdate({ loop: !audio.loop })}
            className={`w-7 h-4 rounded-full p-0.5 transition-colors cursor-pointer border-none ${
              audio.loop ? 'bg-(--ms-accent)' : 'bg-(--ms-border)'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform ${
                audio.loop ? 'translate-x-3' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
