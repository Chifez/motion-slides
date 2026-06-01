import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Play, Pause, Volume2, ChevronDown, ChevronUp,
  Trash2, X, Mic, Music, Layers, SkipBack, SkipForward, Plus, Upload, Loader2,
} from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useShallow } from 'zustand/react/shallow'
import { MotionStage } from './MotionStage'
import { getCanvasDimensions } from '@motionslides/shared'
import { usePermissions } from '@/context/PermissionContext'
import type { SlideAudio } from '@motionslides/shared'
import { useIsMobile } from '@/hooks/useMediaQuery'

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

// ─── Audio Inspector (right-side panel, shown when a clip is selected) ─────────
interface AudioInspectorProps {
  audioInfo: any
  label: string
  accentColor: string
  onUpdate: (updates: Partial<any>) => void
  onDelete: () => void
  onClose: () => void
}

function AudioInspector({ audioInfo, label, accentColor, onUpdate, onDelete, onClose }: AudioInspectorProps) {
  const activeDuration = (audioInfo.trimEnd - audioInfo.trimStart) / audioInfo.playbackRate
  return (
    <div className="w-52 shrink-0 bg-[#0f0f13] border-l border-white/[0.08] flex flex-col overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: accentColor }}>{label}</span>
        <button onClick={onClose} className="p-1 hover:bg-white/8 rounded text-white/30 hover:text-white border-none bg-transparent cursor-pointer"><X size={12} /></button>
      </div>

      <div className="flex flex-col gap-4 px-3 py-3">
        {/* Delete — at the top for quick access */}
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-500/8 hover:bg-red-500/18 border border-red-900/40 hover:border-red-700/60 text-red-400/80 hover:text-red-300 text-[10px] font-semibold rounded-lg cursor-pointer transition-all"
        >
          <Trash2 size={10} /> Remove clip
        </button>

        {/* Volume */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-white/40 font-medium">Volume</span>
            <span className="font-mono text-white/70">{Math.round(audioInfo.volume * 100)}%</span>
          </div>
          <input
            type="range" min="0" max="1" step="0.01"
            value={audioInfo.volume}
            onChange={e => onUpdate({ volume: parseFloat(e.target.value) })}
            className="w-full h-1 rounded-full cursor-pointer"
            style={{ accentColor }}
          />
          <div className="flex justify-between text-[8px] text-white/20">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>

        {/* Speed */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-white/40 font-medium">Speed</span>
          <div className="grid grid-cols-3 gap-1">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
              <button
                key={rate}
                onClick={() => onUpdate({ playbackRate: rate })}
                className={`py-1 text-[9px] font-mono rounded cursor-pointer border transition-colors ${
                  audioInfo.playbackRate === rate
                    ? 'text-white border-transparent'
                    : 'bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/70'
                }`}
                style={audioInfo.playbackRate === rate ? { backgroundColor: accentColor + '33', borderColor: accentColor } : {}}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Trim info */}
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5 space-y-1.5 text-[10px]">
          <div className="flex justify-between text-white/40">
            <span>Trim start</span><span className="font-mono text-white/60">{audioInfo.trimStart.toFixed(2)}s</span>
          </div>
          <div className="flex justify-between text-white/40">
            <span>Trim end</span><span className="font-mono text-white/60">{audioInfo.trimEnd.toFixed(2)}s</span>
          </div>
          <div className="pt-1 border-t border-white/[0.06] flex justify-between font-semibold">
            <span className="text-white/50">Active</span>
            <span className="font-mono" style={{ color: accentColor }}>{activeDuration.toFixed(2)}s</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Inline V.O. quick-add (record or upload for a specific slide) ───────────────────────
function VOQuickAdd({
  existingAudio, onSave, onClose,
}: { existingAudio: any; onSave: (audio: any) => void; onClose: () => void }) {
  const [mode, setMode] = useState<'idle' | 'recording' | 'uploading'>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadBlob = async (blob: Blob, name: string) => {
    setMode('uploading')
    try {
      const tempUrl = URL.createObjectURL(blob)
      const duration = await new Promise<number>(resolve => {
        const a = new Audio(tempUrl)
        a.addEventListener('loadedmetadata', () => { URL.revokeObjectURL(tempUrl); resolve(a.duration) })
        a.addEventListener('error', () => { URL.revokeObjectURL(tempUrl); resolve(0) })
      })
      const fd = new FormData()
      fd.append('file', blob, name)
      fd.append('duration', duration.toString())
      const res = await fetch('/api/upload/audio', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      onSave({ id: Math.random().toString(36).substring(7), url: data.url, fileName: data.fileName, duration: data.duration || duration, volume: 1, loop: false, playbackRate: 1, trimStart: 0, trimEnd: data.duration || duration })
    } catch { alert('Upload failed') }
    finally { setMode('idle') }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        await uploadBlob(new Blob(chunksRef.current, { type: 'audio/webm' }), 'voiceover.webm')
      }
      mr.start()
      setMode('recording')
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000)
    } catch { alert('Could not access microphone.') }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setMode('uploading')
  }

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  if (mode === 'uploading') return (
    <div className="flex items-center gap-2 text-[11px] text-white/50">
      <Loader2 size={12} className="animate-spin" /> Uploading…
    </div>
  )

  if (mode === 'recording') return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-red-400 text-[11px] font-mono">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        {fmt(recordingTime)}
      </span>
      <button onClick={stopRecording} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 border border-red-500/40 text-red-300 text-[11px] font-semibold rounded-lg cursor-pointer"><Volume2 size={12} /> Stop recording</button>
    </div>
  )

  return (
    <div className="flex items-center gap-3">
      {existingAudio && <span className="text-[10px] text-white/30 italic">Replace: {existingAudio.fileName}</span>}
      <button onClick={startRecording} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 border border-violet-500/40 text-violet-300 text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-violet-600/30 transition-colors">
        <Mic size={12} /> Record voice
      </button>
      <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/60 text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
        <Upload size={12} /> Upload file
      </button>
      <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) await uploadBlob(f, f.name) }} />
    </div>
  )
}

// ─── Inline BGM uploader ──────────────────────────────────────────────────────
function BgmUploader({ onSave, onClose }: { onSave: (audio: SlideAudio) => void; onClose: () => void }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const tempUrl = URL.createObjectURL(file)
      const duration = await new Promise<number>(resolve => {
        const a = new Audio(tempUrl)
        a.addEventListener('loadedmetadata', () => { URL.revokeObjectURL(tempUrl); resolve(a.duration) })
        a.addEventListener('error', () => { URL.revokeObjectURL(tempUrl); resolve(0) })
      })
      const formData = new FormData()
      formData.append('file', file, file.name)
      formData.append('duration', duration.toString())
      const res = await fetch('/api/upload/audio', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      onSave({
        id: Math.random().toString(36).substring(7),
        url: data.url, fileName: data.fileName,
        duration: data.duration || duration,
        volume: 0.7, loop: true, playbackRate: 1,
        trimStart: 0, trimEnd: data.duration || duration,
      })
    } catch { alert('Failed to upload audio.') }
    finally { setUploading(false) }
  }

  return (
    <div className="flex items-center gap-3">
      <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
      {uploading
        ? <span className="flex items-center gap-1.5 text-[11px] text-white/50"><Loader2 size={12} className="animate-spin" />Uploading…</span>
        : <button onClick={() => inputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600/20 border border-sky-500/40 text-sky-300 text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-sky-600/30 transition-colors">
            <Upload size={12} /> Choose music file
          </button>
      }
      <button onClick={onClose} className="p-1 text-white/30 hover:text-white/70 border-none bg-transparent cursor-pointer"><X size={14} /></button>
    </div>
  )
}

// ─── Main TimelinePanel ────────────────────────────────────────────────────────
export function TimelinePanel() {
  usePermissions()
  const isMobile = useIsMobile()

  const timelineTracksVisible = useEditorStore(s => s.timelineTracksVisible ?? true)
  const setTimelineTracksVisible = useEditorStore(s => s.setTimelineTracksVisible)
  const activeSlideIndex = useEditorStore(s => s.activeSlideIndex)
  const setActiveSlide = useEditorStore(s => s.setActiveSlide)
  const playbackSettings = useEditorStore(s => s.playbackSettings)
  const activeProjectId = useEditorStore(s => s.activeProjectId)
  const updateProject = useEditorStore(s => s.updateProject)

  const project = useEditorStore(useShallow(s => s.projects.find(p => p.id === s.activeProjectId) ?? null))
  const slides = project?.slides ?? []
  const transitions = project?.transitions ?? []

  const { activeTransition } = useEditorStore(useShallow(s => s.getPlaybackTransitions()))

  // ── Playback State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [selectedAudioKey, setSelectedAudioKey] = useState<{ type: 'voiceover'; slideId: string } | { type: 'bgm' } | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  // audioDrawer: which track's add-panel is open
  const [audioDrawer, setAudioDrawer] = useState<'vo' | 'bgm' | null>(null)

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

  // ── Fix #3: derive live slide index synchronously from currentTime (no effect delay)
  const liveSlideIndex = useMemo(
    () => isPlaying ? getSlideIndexAtTime(currentTime) : activeSlideIndex,
    [isPlaying, currentTime, getSlideIndexAtTime, activeSlideIndex]
  )
  const liveSlide = slides[liveSlideIndex] ?? null
  const livePrevSlide = liveSlideIndex > 0 ? (slides[liveSlideIndex - 1] ?? null) : null

  // ── Audio: save voiceover to the active slide in the timeline
  const saveVoiceover = useCallback((audio: SlideAudio | null) => {
    const targetId = slides[liveSlideIndex]?.id
    if (!targetId || !activeProjectId) return
    updateProject(activeProjectId, {
      slides: slides.map(s => s.id === targetId ? { ...s, audio } : s),
      synced: false,
    })
    setAudioDrawer(null)
  }, [slides, liveSlideIndex, activeProjectId, updateProject])

  const saveBgm = useCallback((audio: SlideAudio) => {
    if (!activeProjectId) return
    updateProject(activeProjectId, {
      playbackSettings: { ...playbackSettings, backgroundMusic: audio },
      synced: false,
    })
    setAudioDrawer(null)
  }, [activeProjectId, playbackSettings, updateProject])

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
            // Fix 2: scroll timeline back to start on loop
            if (timelineBodyRef.current) timelineBodyRef.current.scrollLeft = 0
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

  // ── Fix #1: keep playhead centered in the scroll viewport during playback
  useEffect(() => {
    if (!isPlaying || !timelineBodyRef.current) return
    const playheadX = currentTime * PX_PER_SEC
    const container = timelineBodyRef.current
    const halfW = container.clientWidth / 2
    // Only scroll once the playhead drifts past center; never scroll backward
    if (playheadX > container.scrollLeft + halfW) {
      container.scrollLeft = playheadX - halfW
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

  // Exactly fits the content — no overflow padding so ruler stops cleanly
  const timelineWidth = Math.max(900, Math.ceil(totalDuration) * PX_PER_SEC + PX_PER_SEC)

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
        {!isMobile && (
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
        )}
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
          {liveSlide ? (
            <ScaledStage
              slide={liveSlide}
              previousSlide={livePrevSlide}
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
            {liveSlideIndex + 1} / {slides.length}
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
                  idx === liveSlideIndex
                    ? 'w-5 h-1.5 bg-violet-500'
                    : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Mobile Loop + Hide/Show track toggle */}
        {isMobile && (
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
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
        )}
      </div>

      {/* ══ Timeline Tracks ══════════════════════════════════════════════════ */}
      {timelineTracksVisible && (
        <div
          className="shrink-0 border-t border-white/[0.06] bg-[#0a0a0c] overflow-hidden relative"
          style={{ height: `${RULER_H + SLIDE_TRACK_H + VO_TRACK_H + BGM_TRACK_H + 1}px` }}
        >
          {/* Centered max-width wrapper — Fix #1 */}
          <div className="flex h-full max-w-6xl mx-auto w-full">

          {/* ── Left label column ── */}
          <div className="w-[88px] shrink-0 bg-[#0d0d10] border-r border-white/[0.06] flex flex-col z-10 relative">
            {/* Ruler label row — holds audio-drawer trigger info */}
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

            {/* V.O. label + add button */}
            <div
              className="border-b border-white/[0.06] flex flex-col items-center justify-center gap-1 relative group/vo"
              style={{ height: VO_TRACK_H }}
            >
              <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Mic size={12} className="text-violet-400" />
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase text-white/30">V.O.</span>
              {/* Add voiceover button */}
              <button
                onClick={() => setAudioDrawer(audioDrawer === 'vo' ? null : 'vo')}
                title={`Add voiceover to slide ${liveSlideIndex + 1}`}
                className={`absolute top-1 right-1 w-4 h-4 rounded flex items-center justify-center border cursor-pointer transition-all ${
                  audioDrawer === 'vo'
                    ? 'bg-violet-500 border-violet-400 text-white'
                    : 'bg-transparent border-white/15 text-white/30 hover:text-violet-300 hover:border-violet-500 opacity-0 group-hover/vo:opacity-100'
                }`}
              >
                <Plus size={9} />
              </button>
            </div>

            {/* Music label + add button */}
            <div
              className="flex flex-col items-center justify-center gap-1 relative group/bgm"
              style={{ height: BGM_TRACK_H }}
            >
              <div className="w-7 h-7 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center">
                <Music size={12} className="text-sky-400" />
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase text-white/30">Music</span>
              {/* Add BGM button */}
              <button
                onClick={() => setAudioDrawer(audioDrawer === 'bgm' ? null : 'bgm')}
                title="Add background music"
                className={`absolute top-1 right-1 w-4 h-4 rounded flex items-center justify-center border cursor-pointer transition-all ${
                  audioDrawer === 'bgm'
                    ? 'bg-sky-500 border-sky-400 text-white'
                    : 'bg-transparent border-white/15 text-white/30 hover:text-sky-300 hover:border-sky-500 opacity-0 group-hover/bgm:opacity-100'
                }`}
              >
                <Plus size={9} />
            </button>
            </div>
          </div>

          {/* ── Scrollable timeline body ── */}
          {/* ══ Issue 5: Add-audio modal (centered card above the tracks) ══ */}
          {audioDrawer && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setAudioDrawer(null)}>
              <div
                className="w-80 rounded-2xl border border-white/10 bg-[#13131c] shadow-2xl p-5 flex flex-col gap-4"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {audioDrawer === 'vo'
                      ? <><div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center"><Mic size={13} className="text-violet-400" /></div><div><p className="text-[12px] font-bold text-white">Add Voiceover</p><p className="text-[10px] text-white/35">Slide {liveSlideIndex + 1}</p></div></>
                      : <><div className="w-7 h-7 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center"><Music size={13} className="text-sky-400" /></div><div><p className="text-[12px] font-bold text-white">Background Music</p><p className="text-[10px] text-white/35">Plays across all slides</p></div></>}
                  </div>
                  <button onClick={() => setAudioDrawer(null)} className="p-1.5 text-white/30 hover:text-white hover:bg-white/8 rounded-lg border-none bg-transparent cursor-pointer"><X size={14} /></button>
                </div>

                <div className="h-px bg-white/[0.06]" />

                {audioDrawer === 'vo' && (
                  <VOQuickAdd existingAudio={slides[liveSlideIndex]?.audio ?? null} onSave={saveVoiceover} onClose={() => setAudioDrawer(null)} />
                )}
                {audioDrawer === 'bgm' && (
                  <BgmUploader onSave={saveBgm} onClose={() => setAudioDrawer(null)} />
                )}
              </div>
            </div>
          )}

          {/* ── Audio Inspector right panel (opens on double-click) ── */}
          {inspectorOpen && selectedAudioInfo && (
            <AudioInspector
              audioInfo={selectedAudioInfo}
              label={selectedAudioKey?.type === 'bgm' ? 'Background Music' : `Voiceover – Slide ${slides.findIndex(s => s.id === (selectedAudioKey as any)?.slideId) + 1}`}
              accentColor={selectedAudioKey?.type === 'bgm' ? '#38bdf8' : '#a78bfa'}
              onUpdate={updateSelectedAudio}
              onDelete={() => { deleteSelectedAudio(); setInspectorOpen(false) }}
              onClose={() => setInspectorOpen(false)}
            />
          )}

          <div className="flex-1 overflow-hidden relative border-l border-white/[0.10]">

            <div
              ref={timelineBodyRef}
              className="w-full h-full overflow-x-auto overflow-y-hidden"
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
                {/* Issue 2: ruler capped exactly at content end */}
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
                {/* Half-second ticks */}
                {Array.from({ length: Math.ceil(totalDuration * 2) }).map((_, idx) => {
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
                  const isActive = liveSlideIndex === item.index
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
                      {/* Single click = select (trim handle visible); double click = open inspector */}
                    <div
                        onClick={() => {
                          const alreadySelected = selectedAudioKey?.type === 'voiceover' && selectedAudioKey.slideId === item.slide.id
                          if (alreadySelected) { setSelectedAudioKey(null); setInspectorOpen(false) }
                          else { setSelectedAudioKey({ type: 'voiceover', slideId: item.slide.id }); setInspectorOpen(false) }
                        }}
                        onDoubleClick={() => { setSelectedAudioKey({ type: 'voiceover', slideId: item.slide.id }); setInspectorOpen(true) }}
                        className={`w-full h-full rounded-lg cursor-pointer relative overflow-hidden transition-all ${
                          isSelected
                            ? 'bg-violet-600/25 border-2 border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                            : 'bg-violet-900/20 border border-violet-700/30 hover:border-violet-600/50'
                        }`}
                      >
                        <WaveformDecoration color={isSelected ? 'rgba(167,139,250,0.45)' : 'rgba(139,92,246,0.25)'} />
                        <div className="absolute inset-x-2 top-0.5 flex items-center gap-1 pointer-events-none">
                          <Volume2 size={8} className="text-violet-400/70 shrink-0" />
                          <span className="text-[8px] font-medium text-violet-300/60 truncate">{audio.fileName}</span>
                        </div>
                        {isSelected && <div className="absolute inset-x-2 bottom-0.5 text-[7px] font-mono text-violet-400/50 pointer-events-none">dbl-click for settings</div>}
                      </div>

                      {/* Trim-end drag handle — visible on hover AND when selected */}
                      <div
                        className={`absolute right-0 top-0 h-full w-2 cursor-ew-resize z-20 flex items-center justify-center transition-opacity ${
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        onMouseDown={e => {
                          e.stopPropagation()
                          const startX = e.clientX
                          const startTrimEnd = audio.trimEnd
                          const onMove = (mv: MouseEvent) => {
                            const delta = (mv.clientX - startX) / PX_PER_SEC
                            const newTrimEnd = Math.min(audio.duration, Math.max(audio.trimStart + 0.5, startTrimEnd + delta))
                            updateProject(activeProjectId!, {
                              slides: slides.map(s => s.id === item.slide.id ? { ...s, audio: { ...audio, trimEnd: newTrimEnd } } : s),
                              synced: false,
                            })
                          }
                          const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                          window.addEventListener('mousemove', onMove)
                          window.addEventListener('mouseup', onUp)
                        }}
                      >
                        <div className="w-0.5 h-4 bg-violet-400/50 rounded-full" />
                      </div>
                    </div>
                  )
                })}

                {/* Empty state label */}
                {slides.every(s => !s.audio) && (
                  <div className="absolute inset-0 flex items-center px-4 text-[9px] text-white/15 font-medium">
                    No voiceovers — hover V.O. label and click +
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
                        onClick={() => {
                          const alreadySelected = selectedAudioKey?.type === 'bgm'
                          if (alreadySelected) { setSelectedAudioKey(null); setInspectorOpen(false) }
                          else { setSelectedAudioKey({ type: 'bgm' }); setInspectorOpen(false) }
                        }}
                        onDoubleClick={() => { setSelectedAudioKey({ type: 'bgm' }); setInspectorOpen(true) }}
                        className={`w-full h-full rounded-lg cursor-pointer relative overflow-hidden transition-all ${
                          isSelected
                            ? 'bg-sky-600/25 border-2 border-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.2)]'
                            : 'bg-sky-900/20 border border-sky-700/30 hover:border-sky-600/50'
                        }`}
                      >
                        <WaveformDecoration color={isSelected ? 'rgba(125,211,252,0.4)' : 'rgba(56,189,248,0.2)'} />
                        <div className="absolute inset-x-2 top-0.5 flex items-center gap-1 pointer-events-none">
                          <Music size={8} className="text-sky-400/70 shrink-0" />
                          <span className="text-[8px] font-medium text-sky-300/60 truncate">{bgm.fileName}</span>
                        </div>
                        {isSelected && <div className="absolute inset-x-2 bottom-0.5 text-[7px] font-mono text-sky-400/50 pointer-events-none">Click inspector →</div>}
                      </div>
                    </div>
                  )
                })() : (
                  <div className="absolute inset-0 flex items-center px-4 text-[9px] text-white/15 font-medium">
                    No background music — hover Music label and click +
                  </div>
                )}
              </div>

            </div>{/* end inner scroll content */}
            </div>{/* end timelineBodyRef scroller */}
            </div>{/* end flex-1 overlay wrapper */}

          </div>{/* end max-w-6xl centered wrapper */}
        </div>
      )}
    </div>
  )
}
