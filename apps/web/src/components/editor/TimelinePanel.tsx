import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Play, Pause, Square, Volume2, ChevronDown, ChevronUp,
  Trash2, X, Mic, Music, Layers, SkipBack, SkipForward,
} from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useShallow } from 'zustand/react/shallow'
import { MotionStage } from './MotionStage'
import { getCanvasDimensions } from '@motionslides/shared'
import { usePermissions } from '@/context/PermissionContext'

const PX_PER_SEC = 80

// ─── Waveform bar decoration ───────────────────────────────────────────────────
const WAVE_PATTERN = [3, 7, 12, 18, 14, 9, 20, 15, 6, 22, 17, 10, 25, 19, 8, 23, 14, 11, 18, 6, 21, 13, 7, 24, 16]

function WaveformDecoration({ color = 'rgba(255,255,255,0.25)' }: { color?: string }) {
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

// ─── Slide thumbnail card (colored gradient) ───────────────────────────────────
const SLIDE_GRADIENTS = [
  'from-violet-900/80 to-indigo-900/80',
  'from-blue-900/80 to-cyan-900/80',
  'from-emerald-900/80 to-teal-900/80',
  'from-rose-900/80 to-pink-900/80',
  'from-amber-900/80 to-orange-900/80',
  'from-purple-900/80 to-fuchsia-900/80',
]

// ─── Scaled stage for preview ──────────────────────────────────────────────────
interface ScaledStageProps {
  slide: any
  previousSlide: any
  settings: any
  activeTransition: any
}

function ScaledStage({ slide, previousSlide, settings, activeTransition }: ScaledStageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const canvasDims = getCanvasDimensions(settings.aspectRatio)

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return
      const cw = containerRef.current.clientWidth
      const ch = containerRef.current.clientHeight
      const scaleFactor = Math.min(cw / canvasDims.width, ch / canvasDims.height)
      setScale(scaleFactor * 0.98)
    }
    handleResize()
    const observer = new ResizeObserver(handleResize)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [canvasDims.width, canvasDims.height])

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <div
        style={{
          width: canvasDims.width,
          height: canvasDims.height,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
        }}
        className="relative shadow-2xl"
      >
        <MotionStage
          slide={slide}
          previousSlide={previousSlide}
          settings={settings}
          activeTransition={activeTransition}
          mode="presentation"
        />
      </div>
    </div>
  )
}

// ─── Audio Settings Popover ────────────────────────────────────────────────────
interface AudioPopoverProps {
  audioInfo: any
  onUpdate: (updates: Partial<any>) => void
  onDelete: () => void
  onClose: () => void
}

function AudioPopover({ audioInfo, onUpdate, onDelete, onClose }: AudioPopoverProps) {
  return (
    <div
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-xl border border-white/10 bg-[#1a1a1f]/95 shadow-2xl backdrop-blur-xl p-4 flex flex-col gap-3"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-widest uppercase text-white/60">Audio Settings</span>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white border-none bg-transparent cursor-pointer">
          <X size={12} />
        </button>
      </div>

      {/* Volume */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-white/50">
          <span>Volume</span>
          <span className="font-mono text-white/80">{Math.round(audioInfo.volume * 100)}%</span>
        </div>
        <input
          type="range" min="0" max="1" step="0.05"
          value={audioInfo.volume}
          onChange={e => onUpdate({ volume: parseFloat(e.target.value) })}
          className="w-full h-1 rounded-full cursor-pointer accent-violet-500"
        />
      </div>

      {/* Speed */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-white/50">Speed</span>
        <div className="grid grid-cols-4 gap-1">
          {[0.5, 0.75, 1, 1.25, 1.5, 2].slice(0, 4).map(rate => (
            <button
              key={rate}
              onClick={() => onUpdate({ playbackRate: rate })}
              className={`py-1 text-[9px] font-mono rounded cursor-pointer border transition-colors ${
                audioInfo.playbackRate === rate
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Trim info */}
      <div className="text-[10px] text-white/40 bg-white/5 rounded-lg p-2.5 space-y-1">
        <div className="flex justify-between">
          <span>Duration</span>
          <span className="font-mono text-violet-400">
            {((audioInfo.trimEnd - audioInfo.trimStart) / audioInfo.playbackRate).toFixed(2)}s
          </span>
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-semibold rounded-lg cursor-pointer transition-colors"
      >
        <Trash2 size={11} /> Remove Track
      </button>
    </div>
  )
}

// ─── Main TimelinePanel ────────────────────────────────────────────────────────
export function TimelinePanel() {
  usePermissions()

  const timelineTracksVisible = useEditorStore(s => s.timelineTracksVisible ?? true)
  const setTimelineTracksVisible = useEditorStore(s => s.setTimelineTracksVisible)
  const activeSlideIndex = useEditorStore(s => s.activeSlideIndex)
  const previousSlideIndex = useEditorStore(s => s.previousSlideIndex)
  const setActiveSlide = useEditorStore(s => s.setActiveSlide)
  const playbackSettings = useEditorStore(s => s.playbackSettings)
  const activeProjectId = useEditorStore(s => s.activeProjectId)
  const updateProject = useEditorStore(s => s.updateProject)

  const project = useEditorStore(useShallow(s => s.projects.find(p => p.id === s.activeProjectId) ?? null))
  const slides = project?.slides ?? []
  const transitions = project?.transitions ?? []

  const activeSlide = slides[activeSlideIndex] ?? null
  const previousSlide = previousSlideIndex !== null ? (slides[previousSlideIndex] ?? null) : null
  const { activeTransition } = useEditorStore(useShallow(s => s.getPlaybackTransitions()))

  // ── Playback State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [selectedAudioKey, setSelectedAudioKey] = useState<{ type: 'voiceover'; slideId: string } | { type: 'bgm' } | null>(null)

  const bgMusicAudioRef = useRef<HTMLAudioElement | null>(null)
  const slideAudioRef = useRef<HTMLAudioElement | null>(null)
  const activeSlideAudioIdRef = useRef<string | null>(null)
  const requestRef = useRef<number | null>(null)
  const previousTimeRef = useRef<number | null>(null)
  const timelineBodyRef = useRef<HTMLDivElement>(null)

  // ── Timing computation
  const slidesWithTiming = useMemo(() => {
    let current = 0
    return slides.map((s, idx) => {
      const hasTransition = idx > 0
      const transitionDuration = hasTransition ? (playbackSettings.transitionDuration ?? 500) : 0
      const transitionObj = transitions.find(t => t.fromSlideId === s.id && t.trigger === 'auto')
      const configuredSlideDuration = transitionObj
        ? (transitionObj.autoDelay ?? 3000)
        : (playbackSettings.autoplayDelay ?? 3000)
      const activeAudioDurationMs = s.audio
        ? ((s.audio.trimEnd - s.audio.trimStart) / s.audio.playbackRate) * 1000
        : 0
      const durationMs = Math.max(configuredSlideDuration, activeAudioDurationMs)
      const durationSec = durationMs / 1000
      const start = current
      const end = current + durationSec
      current = end
      return { slide: s, index: idx, start, end, duration: durationSec, transitionDuration: transitionDuration / 1000 }
    })
  }, [slides, transitions, playbackSettings])

  const totalDuration = useMemo(() => {
    if (slidesWithTiming.length === 0) return 0
    return slidesWithTiming[slidesWithTiming.length - 1].end
  }, [slidesWithTiming])

  const getSlideIndexAtTime = useCallback((time: number) => {
    const found = slidesWithTiming.find(s => time >= s.start && time < s.end)
    if (found) return found.index
    if (time >= totalDuration) return Math.max(0, slides.length - 1)
    return 0
  }, [slidesWithTiming, totalDuration, slides.length])

  const syncDucking = useCallback((isDuckTarget: boolean) => {
    const bgAudio = bgMusicAudioRef.current
    const musicConfig = playbackSettings.backgroundMusic
    if (!bgAudio || !musicConfig) return
    bgAudio.volume = isDuckTarget && playbackSettings.duckBackgroundMusic !== false
      ? musicConfig.volume * 0.2
      : musicConfig.volume
  }, [playbackSettings.backgroundMusic, playbackSettings.duckBackgroundMusic])

  const animatePlayback = useCallback((time: number) => {
    if (previousTimeRef.current !== null) {
      const delta = (time - previousTimeRef.current) / 1000
      setCurrentTime(prevTime => {
        let nextTime = prevTime + delta
        if (nextTime >= totalDuration) {
          if (playbackSettings.loop) {
            nextTime = 0
            if (bgMusicAudioRef.current && playbackSettings.backgroundMusic) {
              bgMusicAudioRef.current.currentTime = playbackSettings.backgroundMusic.trimStart
            }
          } else {
            setIsPlaying(false)
            return 0
          }
        }
        return nextTime
      })
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animatePlayback)
  }, [totalDuration, playbackSettings.loop, playbackSettings.backgroundMusic])

  useEffect(() => {
    if (isPlaying) {
      previousTimeRef.current = null
      requestRef.current = requestAnimationFrame(animatePlayback)
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
        requestRef.current = null
      }
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current) }
  }, [isPlaying, animatePlayback])

  useEffect(() => {
    if (!project) return
    const musicConfig = playbackSettings.backgroundMusic
    if (musicConfig) {
      if (!bgMusicAudioRef.current) {
        bgMusicAudioRef.current = new Audio(musicConfig.url)
        bgMusicAudioRef.current.loop = musicConfig.loop
      }
      const bgAudio = bgMusicAudioRef.current
      bgAudio.playbackRate = musicConfig.playbackRate
      if (isPlaying) {
        const bgRelativeTime = musicConfig.trimStart + currentTime
        if (bgRelativeTime <= musicConfig.trimEnd) {
          if (bgAudio.paused) {
            bgAudio.currentTime = bgRelativeTime
            bgAudio.play().catch(() => {})
          } else if (Math.abs(bgAudio.currentTime - bgRelativeTime) > 0.25) {
            bgAudio.currentTime = bgRelativeTime
          }
        } else { bgAudio.pause() }
      } else { bgAudio.pause() }
    } else {
      if (bgMusicAudioRef.current) { bgMusicAudioRef.current.pause(); bgMusicAudioRef.current = null }
    }

    const activeIdx = getSlideIndexAtTime(currentTime)
    if (activeIdx !== activeSlideIndex) setActiveSlide(activeIdx)

    const currentSlideTiming = slidesWithTiming[activeIdx]
    const slideAudioConfig = currentSlideTiming?.slide?.audio

    if (slideAudioConfig) {
      const relativeOffset = currentTime - currentSlideTiming.start
      const audioRelativeTime = slideAudioConfig.trimStart + relativeOffset
      if (isPlaying && audioRelativeTime >= slideAudioConfig.trimStart && audioRelativeTime <= slideAudioConfig.trimEnd) {
        if (!slideAudioRef.current || activeSlideAudioIdRef.current !== slideAudioConfig.id) {
          if (slideAudioRef.current) slideAudioRef.current.pause()
          slideAudioRef.current = new Audio(slideAudioConfig.url)
          activeSlideAudioIdRef.current = slideAudioConfig.id
        }
        const slideAudio = slideAudioRef.current
        slideAudio.volume = slideAudioConfig.volume
        slideAudio.playbackRate = slideAudioConfig.playbackRate
        if (slideAudio.paused) {
          slideAudio.currentTime = audioRelativeTime
          slideAudio.play().catch(() => {})
          syncDucking(true)
        } else if (Math.abs(slideAudio.currentTime - audioRelativeTime) > 0.25) {
          slideAudio.currentTime = audioRelativeTime
        }
      } else {
        if (slideAudioRef.current) {
          slideAudioRef.current.pause()
          slideAudioRef.current = null
          activeSlideAudioIdRef.current = null
          syncDucking(false)
        }
      }
    } else {
      if (slideAudioRef.current) {
        slideAudioRef.current.pause()
        slideAudioRef.current = null
        activeSlideAudioIdRef.current = null
        syncDucking(false)
      }
    }

    if (!isPlaying) {
      slideAudioRef.current?.pause()
      bgMusicAudioRef.current?.pause()
    }
  }, [isPlaying, currentTime, activeSlideIndex, slidesWithTiming, playbackSettings.backgroundMusic, getSlideIndexAtTime, setActiveSlide, project, syncDucking])

  useEffect(() => {
    return () => {
      bgMusicAudioRef.current?.pause()
      slideAudioRef.current?.pause()
    }
  }, [])

  // Auto-scroll playhead into view while playing
  useEffect(() => {
    if (!isPlaying || !timelineBodyRef.current) return
    const playheadX = currentTime * PX_PER_SEC
    const container = timelineBodyRef.current
    const { scrollLeft, clientWidth } = container
    if (playheadX > scrollLeft + clientWidth * 0.75) {
      container.scrollLeft = playheadX - clientWidth * 0.25
    }
  }, [currentTime, isPlaying])

  // ── Ruler scrub
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const scrollLeft = timelineBodyRef.current?.scrollLeft ?? 0
    const clickX = e.clientX - rect.left + scrollLeft
    setCurrentTime(Math.max(0, Math.min(clickX / PX_PER_SEC, totalDuration)))

    const handleMouseMove = (ev: MouseEvent) => {
      const dragX = ev.clientX - rect.left + (timelineBodyRef.current?.scrollLeft ?? 0)
      setCurrentTime(Math.max(0, Math.min(dragX / PX_PER_SEC, totalDuration)))
    }
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  // ── Slide resize drag
  const handleSlideResizeMouseDown = (e: React.MouseEvent, slideId: string, currentDuration: number) => {
    e.stopPropagation()
    const startX = e.clientX
    const handleMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startX
      const targetDuration = Math.max(1, currentDuration + deltaX / PX_PER_SEC)
      const slideIdx = slides.findIndex(s => s.id === slideId)
      if (slideIdx === -1) return
      const existingTransIdx = transitions.findIndex(t => t.fromSlideId === slideId)
      let updatedTransitions = [...transitions]
      if (existingTransIdx !== -1) {
        updatedTransitions[existingTransIdx] = {
          ...updatedTransitions[existingTransIdx],
          trigger: 'auto',
          autoDelay: Math.round(targetDuration * 1000),
        }
      } else {
        const nextSlideId = slides[slideIdx + 1]?.id || slides[0].id
        updatedTransitions.push({
          id: Math.random().toString(36).substring(2, 9),
          fromSlideId: slideId, toSlideId: nextSlideId,
          animation: 'fade', duration: playbackSettings.transitionDuration,
          ease: playbackSettings.transitionEase, trigger: 'auto',
          autoDelay: Math.round(targetDuration * 1000),
        })
      }
      if (activeProjectId) updateProject(activeProjectId, { transitions: updatedTransitions, synced: false })
    }
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    const ms = Math.floor((time % 1) * 10)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`
  }

  const selectedAudioInfo = useMemo(() => {
    if (!selectedAudioKey) return null
    if (selectedAudioKey.type === 'voiceover') {
      return slides.find(sl => sl.id === selectedAudioKey.slideId)?.audio || null
    }
    return playbackSettings.backgroundMusic || null
  }, [selectedAudioKey, slides, playbackSettings])

  const updateSelectedAudio = (updates: Partial<any>) => {
    if (!selectedAudioKey || !activeProjectId) return
    if (selectedAudioKey.type === 'voiceover') {
      const updatedSlides = slides.map(s => {
        if (s.id !== selectedAudioKey.slideId || !s.audio) return s
        return { ...s, audio: { ...s.audio, ...updates } }
      })
      updateProject(activeProjectId, { slides: updatedSlides, synced: false })
    } else {
      const currentBgm = playbackSettings.backgroundMusic
      if (currentBgm) {
        updateProject(activeProjectId, {
          playbackSettings: { ...playbackSettings, backgroundMusic: { ...currentBgm, ...updates } },
          synced: false,
        })
      }
    }
  }

  const deleteSelectedAudio = () => {
    if (!selectedAudioKey || !activeProjectId) return
    if (selectedAudioKey.type === 'voiceover') {
      updateProject(activeProjectId, {
        slides: slides.map(s => s.id === selectedAudioKey.slideId ? { ...s, audio: null } : s),
        synced: false,
      })
    } else {
      updateProject(activeProjectId, {
        playbackSettings: { ...playbackSettings, backgroundMusic: null },
        synced: false,
      })
    }
    setSelectedAudioKey(null)
  }

  const timelineWidth = Math.max(900, totalDuration * PX_PER_SEC + 300)

  // Track row heights (must be consistent between labels and body)
  const RULER_H = 32
  const SLIDE_TRACK_H = 80
  const VO_TRACK_H = 52
  const BGM_TRACK_H = 52

  return (
    <div className="flex flex-col w-full h-full bg-[#0c0c0e] overflow-hidden select-none">

      {/* ══ Toolbar ══════════════════════════════════════════════════════════ */}
      <div className="h-10 shrink-0 flex items-center justify-between px-4 bg-[#111115] border-b border-white/[0.06] z-20">
        {/* Left: mode label + transport */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-white/30">
            <Layers size={12} />
            <span>Timeline</span>
          </div>

          <div className="w-px h-4 bg-white/10" />

          {/* Transport controls */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => { setCurrentTime(0); setIsPlaying(false) }}
              className="p-1.5 text-white/40 hover:text-white hover:bg-white/8 rounded transition-colors cursor-pointer border-none bg-transparent"
              title="Return to start"
            >
              <SkipBack size={13} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause' : 'Play'}
              className={`flex items-center justify-center w-7 h-7 rounded-full transition-all cursor-pointer border-none shadow-lg ${
                isPlaying
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-violet-600 text-white hover:bg-violet-500'
              }`}
            >
              {isPlaying
                ? <Pause size={12} fill="currentColor" />
                : <Play size={12} fill="currentColor" className="ml-0.5" />}
            </button>
            <button
              onClick={() => { setCurrentTime(totalDuration); setIsPlaying(false) }}
              className="p-1.5 text-white/40 hover:text-white hover:bg-white/8 rounded transition-colors cursor-pointer border-none bg-transparent"
              title="Go to end"
            >
              <SkipForward size={13} />
            </button>
          </div>

          {/* Timecode */}
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-white/90 tabular-nums">{formatTime(currentTime)}</span>
            <span className="text-white/20">/</span>
            <span className="text-white/35 tabular-nums">{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Right: Loop + track toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateProject(activeProjectId || '', {
              playbackSettings: { ...playbackSettings, loop: !playbackSettings.loop }
            })}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border cursor-pointer transition-all ${
              playbackSettings.loop
                ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                : 'bg-transparent border-white/10 text-white/30 hover:text-white/60'
            }`}
          >
            Loop
          </button>

          <button
            onClick={() => setTimelineTracksVisible(!timelineTracksVisible)}
            className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md border border-white/10 text-white/40 hover:text-white/80 hover:border-white/20 transition-all cursor-pointer bg-transparent"
          >
            {timelineTracksVisible ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            {timelineTracksVisible ? 'Hide Tracks' : 'Show Tracks'}
          </button>
        </div>
      </div>

      {/* ══ Preview Area ═════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0c0c0e] to-[#0f0f12] px-8 py-4 relative">

        {/* Ambient glow behind screen */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[60%] h-[50%] rounded-full bg-violet-900/10 blur-3xl" />
        </div>

        {/* The preview screen frame */}
        <div className="relative w-full max-w-3xl rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_25px_60px_rgba(0,0,0,0.6)] bg-black"
          style={{ aspectRatio: '16/9' }}>
          {activeSlide ? (
            <ScaledStage
              slide={activeSlide}
              previousSlide={previousSlide}
              settings={playbackSettings}
              activeTransition={activeTransition}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
              No slides yet
            </div>
          )}

          {/* Screen corner accent lines */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-violet-500/40 rounded-tl-xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-violet-500/40 rounded-tr-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-violet-500/40 rounded-bl-xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-violet-500/40 rounded-br-xl pointer-events-none" />

          {/* Slide indicator badge */}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-white/50 px-2 py-0.5 rounded-md">
            {activeSlideIndex + 1} / {slides.length}
          </div>
        </div>

        {/* Slide dot nav */}
        {slides.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { setActiveSlide(idx); setCurrentTime(slidesWithTiming[idx]?.start ?? 0) }}
                className={`rounded-full border-none cursor-pointer transition-all ${
                  idx === activeSlideIndex
                    ? 'w-5 h-1.5 bg-violet-500'
                    : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ══ Timeline Tracks ══════════════════════════════════════════════════ */}
      {timelineTracksVisible && (
        <div
          className="shrink-0 border-t border-white/[0.06] flex bg-[#0a0a0c] overflow-hidden"
          style={{ height: `${RULER_H + SLIDE_TRACK_H + VO_TRACK_H + BGM_TRACK_H + 1}px` }}
        >
          {/* ── Left label column ── */}
          <div className="w-[88px] shrink-0 bg-[#0d0d10] border-r border-white/[0.06] flex flex-col z-10">
            {/* Ruler label */}
            <div
              className="border-b border-white/[0.06] flex items-center justify-center"
              style={{ height: RULER_H }}
            />

            {/* Slides label */}
            <div
              className="border-b border-white/[0.06] flex flex-col items-center justify-center gap-1 text-white/30"
              style={{ height: SLIDE_TRACK_H }}
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Layers size={14} className="text-indigo-400" />
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase text-white/30">Slides</span>
            </div>

            {/* V.O. label */}
            <div
              className="border-b border-white/[0.06] flex flex-col items-center justify-center gap-1"
              style={{ height: VO_TRACK_H }}
            >
              <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Mic size={12} className="text-violet-400" />
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase text-white/30">V.O.</span>
            </div>

            {/* Music label */}
            <div
              className="flex flex-col items-center justify-center gap-1"
              style={{ height: BGM_TRACK_H }}
            >
              <div className="w-7 h-7 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center">
                <Music size={12} className="text-sky-400" />
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase text-white/30">Music</span>
            </div>
          </div>

          {/* ── Scrollable timeline body ── */}
          <div
            ref={timelineBodyRef}
            className="flex-1 overflow-x-auto overflow-y-hidden relative"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
          >
            <div className="relative flex flex-col" style={{ width: timelineWidth, height: '100%' }}>

              {/* Playhead line (spans all rows) */}
              <div
                className="absolute top-0 bottom-0 z-30 pointer-events-none"
                style={{ left: `${currentTime * PX_PER_SEC}px`, width: '1px', background: 'rgba(239,68,68,0.9)', boxShadow: '0 0 6px rgba(239,68,68,0.5)' }}
              >
                {/* Top diamond handle */}
                <div className="absolute -top-0.5 -left-[5px] w-2.5 h-2.5 bg-red-500 rotate-45 shadow-md" />
              </div>

              {/* ── Ruler Row ── */}
              <div
                className="flex-shrink-0 border-b border-white/[0.06] relative cursor-crosshair bg-[#0a0a0c]"
                style={{ height: RULER_H }}
                onMouseDown={handleRulerMouseDown}
              >
                {Array.from({ length: Math.ceil(totalDuration) + 6 }).map((_, idx) => {
                  const isMajor = idx % 5 === 0
                  return (
                    <div
                      key={idx}
                      className="absolute bottom-0 flex flex-col items-start"
                      style={{ left: `${idx * PX_PER_SEC}px` }}
                    >
                      <span className={`text-[8px] font-mono pl-1 ${isMajor ? 'text-white/40' : 'text-white/15'}`}>
                        {isMajor ? `${idx}s` : ''}
                      </span>
                      <div className={`w-px ${isMajor ? 'h-2.5 bg-white/20' : 'h-1.5 bg-white/08'}`} />
                    </div>
                  )
                })}
                {/* Half-second minor ticks */}
                {Array.from({ length: Math.ceil(totalDuration * 2) + 12 }).map((_, idx) => {
                  if (idx % 2 === 0) return null
                  return (
                    <div
                      key={`h-${idx}`}
                      className="absolute bottom-0 w-px h-1 bg-white/[0.04]"
                      style={{ left: `${(idx * 0.5) * PX_PER_SEC}px` }}
                    />
                  )
                })}
              </div>

              {/* ── Slide Cards Row ── */}
              <div
                className="flex-shrink-0 border-b border-white/[0.06] relative"
                style={{ height: SLIDE_TRACK_H }}
              >
                {/* Track background stripe */}
                <div className="absolute inset-0 bg-[#0d0d11]" />

                {slidesWithTiming.map((item) => {
                  const isActive = activeSlideIndex === item.index
                  const gradient = SLIDE_GRADIENTS[item.index % SLIDE_GRADIENTS.length]
                  const cardW = item.duration * PX_PER_SEC

                  return (
                    <div
                      key={item.slide.id}
                      className="absolute top-2.5 group"
                      style={{
                        left: `${item.start * PX_PER_SEC + 2}px`,
                        width: `${Math.max(40, cardW - 4)}px`,
                        height: `${SLIDE_TRACK_H - 20}px`,
                      }}
                      onClick={() => { setActiveSlide(item.index); setCurrentTime(item.start) }}
                    >
                      {/* Card body */}
                      <div
                        className={`w-full h-full rounded-lg bg-gradient-to-br cursor-pointer relative overflow-hidden transition-all ${gradient} ${
                          isActive
                            ? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-[#0a0a0c] shadow-[0_0_16px_rgba(139,92,246,0.3)]'
                            : 'border border-white/10 hover:border-white/25'
                        }`}
                      >
                        {/* Slide number */}
                        <div className="absolute top-1.5 left-2 text-[10px] font-bold text-white/70 font-mono">
                          {String(item.index + 1).padStart(2, '0')}
                        </div>

                        {/* Duration badge */}
                        <div className="absolute bottom-1.5 right-2 text-[8px] font-mono text-white/40 bg-black/30 px-1 rounded">
                          {item.duration.toFixed(1)}s
                        </div>

                        {/* Slide name if card is wide enough */}
                        {cardW > 100 && (
                          <div className="absolute inset-x-2 bottom-5 text-[9px] font-semibold text-white/50 truncate">
                            {item.slide.name || 'Slide'}
                          </div>
                        )}

                        {/* Active indicator dot */}
                        {isActive && (
                          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                        )}
                      </div>

                      {/* Resize handle */}
                      <div
                        onMouseDown={e => handleSlideResizeMouseDown(e, item.slide.id, item.duration)}
                        className="absolute right-0 top-0 h-full w-2 cursor-ew-resize flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Drag to resize"
                      >
                        <div className="w-0.5 h-4 bg-violet-400/60 rounded-full" />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── Voiceover Track Row ── */}
              <div
                className="flex-shrink-0 border-b border-white/[0.06] relative"
                style={{ height: VO_TRACK_H }}
              >
                <div className="absolute inset-0 bg-[#0b0b0f]" />

                {slidesWithTiming.map((item) => {
                  const audio = item.slide.audio
                  if (!audio) return null
                  const isSelected = selectedAudioKey?.type === 'voiceover' && selectedAudioKey.slideId === item.slide.id
                  const activeWidth = ((audio.trimEnd - audio.trimStart) / audio.playbackRate) * PX_PER_SEC

                  return (
                    <div
                      key={`vo-${item.slide.id}`}
                      className="absolute top-2 group"
                      style={{
                        left: `${item.start * PX_PER_SEC + 2}px`,
                        width: `${Math.max(32, activeWidth - 4)}px`,
                        height: `${VO_TRACK_H - 16}px`,
                      }}
                    >
                      <div
                        onDoubleClick={() => setSelectedAudioKey({ type: 'voiceover', slideId: item.slide.id })}
                        className={`w-full h-full rounded-lg cursor-pointer relative overflow-hidden transition-all ${
                          isSelected
                            ? 'bg-violet-600/25 border-2 border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                            : 'bg-violet-900/20 border border-violet-700/30 hover:border-violet-600/50'
                        }`}
                      >
                        <WaveformDecoration color={isSelected ? 'rgba(167,139,250,0.45)' : 'rgba(139,92,246,0.25)'} />
                        <div className="absolute inset-x-2 top-1 flex items-center gap-1 pointer-events-none">
                          <Volume2 size={8} className="text-violet-400/70 shrink-0" />
                          <span className="text-[8px] font-medium text-violet-300/60 truncate">{audio.fileName}</span>
                        </div>

                        {/* Inline popover anchor */}
                        {isSelected && (
                          <AudioPopover
                            audioInfo={audio}
                            onUpdate={updateSelectedAudio}
                            onDelete={deleteSelectedAudio}
                            onClose={() => setSelectedAudioKey(null)}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Empty state label */}
                {slides.every(s => !s.audio) && (
                  <div className="absolute inset-0 flex items-center px-4 text-[9px] text-white/15 font-medium">
                    No voiceovers — add audio via the inspector
                  </div>
                )}
              </div>

              {/* ── Background Music Track Row ── */}
              <div
                className="flex-shrink-0 relative"
                style={{ height: BGM_TRACK_H }}
              >
                <div className="absolute inset-0 bg-[#0a0a0d]" />

                {playbackSettings.backgroundMusic ? (() => {
                  const bgm = playbackSettings.backgroundMusic
                  const isSelected = selectedAudioKey?.type === 'bgm'
                  const bgmW = totalDuration * PX_PER_SEC

                  return (
                    <div
                      className="absolute top-2 group"
                      style={{ left: '2px', width: `${Math.max(40, bgmW - 4)}px`, height: `${BGM_TRACK_H - 16}px` }}
                    >
                      <div
                        onDoubleClick={() => setSelectedAudioKey({ type: 'bgm' })}
                        className={`w-full h-full rounded-lg cursor-pointer relative overflow-hidden transition-all ${
                          isSelected
                            ? 'bg-sky-600/25 border-2 border-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.2)]'
                            : 'bg-sky-900/20 border border-sky-700/30 hover:border-sky-600/50'
                        }`}
                      >
                        <WaveformDecoration color={isSelected ? 'rgba(125,211,252,0.4)' : 'rgba(56,189,248,0.2)'} />
                        <div className="absolute inset-x-2 top-1 flex items-center gap-1 pointer-events-none">
                          <Music size={8} className="text-sky-400/70 shrink-0" />
                          <span className="text-[8px] font-medium text-sky-300/60 truncate">{bgm.fileName}</span>
                        </div>

                        {isSelected && (
                          <AudioPopover
                            audioInfo={bgm}
                            onUpdate={updateSelectedAudio}
                            onDelete={deleteSelectedAudio}
                            onClose={() => setSelectedAudioKey(null)}
                          />
                        )}
                      </div>
                    </div>
                  )
                })() : (
                  <div className="absolute inset-0 flex items-center px-4 text-[9px] text-white/15 font-medium">
                    No background music — add via settings
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
