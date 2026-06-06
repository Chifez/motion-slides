import { useState, useEffect, useRef } from 'react'
import type { SlideAudio } from '@motionslides/shared'

export function useAudioPreview(audio: SlideAudio) {
  const [peaks, setPeaks] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(audio.trimStart)

  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const startTimeRef = useRef<number>(0)
  const pauseTimeRef = useRef<number>(audio.trimStart)
  const animationFrameRef = useRef<number | null>(null)

  const audioRef = useRef(audio)
  useEffect(() => {
    audioRef.current = audio
  }, [audio])

  // Sync playbackTime and pauseTimeRef when trimStart changes externally (if not playing)
  useEffect(() => {
    if (!isPlaying) {
      setPlaybackTime(audio.trimStart)
      pauseTimeRef.current = audio.trimStart
    }
  }, [audio.trimStart, isPlaying])

  // Fetch and decode audio file
  useEffect(() => {
    let active = true
    if (!audio.url) {
      setPeaks([])
      return
    }

    async function loadAudio() {
      setIsLoading(true)
      try {
        const response = await fetch(audio.url!)
        if (!response.ok) throw new Error('Failed to fetch audio file')
        const arrayBuffer = await response.arrayBuffer()

        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

        const audioCtx = new AudioContextClass()
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
        const normalized = calculatedPeaks.map((p) => p / maxPeak)

        setPeaks(normalized)
      } catch (err) {
        console.error('[AudioPreview Hook] Failed to process audio:', err)
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

  // Dynamically update gain volume and playback rate if they change while playing
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = audio.volume
    }
  }, [audio.volume])

  useEffect(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.playbackRate.value = audio.playbackRate
    }
  }, [audio.playbackRate])

  const startPlayback = () => {
    if (!audioBufferRef.current) return

    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioContextRef.current = new AudioContextClass()
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

    const currentAudio = audioRef.current

    const source = ctx.createBufferSource()
    source.buffer = audioBufferRef.current
    source.playbackRate.value = currentAudio.playbackRate
    source.loop = currentAudio.loop

    if (currentAudio.loop) {
      source.loopStart = currentAudio.trimStart
      source.loopEnd = currentAudio.trimEnd
    }

    const gainNode = ctx.createGain()
    gainNode.gain.value = currentAudio.volume

    source.connect(gainNode)
    gainNode.connect(ctx.destination)

    audioSourceRef.current = source
    gainNodeRef.current = gainNode

    let offset = pauseTimeRef.current
    if (offset < currentAudio.trimStart || offset > currentAudio.trimEnd) {
      offset = currentAudio.trimStart
    }

    const durationToPlay = currentAudio.trimEnd - offset

    startTimeRef.current = ctx.currentTime - offset / currentAudio.playbackRate

    if (currentAudio.loop) {
      source.start(0, offset)
    } else {
      source.start(0, offset, durationToPlay)
      source.onended = () => {
        if (audioSourceRef.current === source) {
          setIsPlaying(false)
          audioSourceRef.current = null
          const latestAudio = audioRef.current
          pauseTimeRef.current = latestAudio.trimStart
          setPlaybackTime(latestAudio.trimStart)
        }
      }
    }

    setIsPlaying(true)

    const updateCursor = () => {
      if (!ctx || !audioSourceRef.current) return
      const latestAudio = audioRef.current
      const elapsed = (ctx.currentTime - startTimeRef.current) * latestAudio.playbackRate

      if (latestAudio.loop) {
        const loopLen = latestAudio.trimEnd - latestAudio.trimStart
        const currentLoopPos = latestAudio.trimStart + (elapsed % loopLen)
        setPlaybackTime(currentLoopPos)
      } else {
        const currentPos = Math.min(elapsed, latestAudio.trimEnd)
        setPlaybackTime(currentPos)
        if (currentPos >= latestAudio.trimEnd) {
          setIsPlaying(false)
          audioSourceRef.current = null
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

  const seekToPercent = (percent: number) => {
    const currentAudio = audioRef.current
    const clickedTime = percent * currentAudio.duration
    const clampedTime = Math.max(currentAudio.trimStart, Math.min(clickedTime, currentAudio.trimEnd))
    setPlaybackTime(clampedTime)
    pauseTimeRef.current = clampedTime

    if (isPlaying) {
      stopPlayback()
      setTimeout(() => {
        startPlayback()
      }, 50)
    }
  }

  return {
    peaks,
    isLoading,
    isPlaying,
    playbackTime,
    togglePlay,
    seekToPercent,
  }
}
