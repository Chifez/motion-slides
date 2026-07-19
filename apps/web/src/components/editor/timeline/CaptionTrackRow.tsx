import { useState, useRef, useEffect, useMemo } from 'react'
import { X, Type } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { PX_PER_SEC, CAPTION_TRACK_H } from './constants'
import type { SlideWithTiming } from './types'

interface Props {
  currentTime: number
  totalDuration: number
}

export function CaptionTrackRow({ currentTime, totalDuration }: Props) {
  const project = useEditorStore(state => state.activeProject())
  const activeProjectId = useEditorStore(state => state.activeProjectId)
  const updateProject = useEditorStore(state => state.updateProject)
  
  // Re-fetch slides timing from the editorStore to get the snaps
  const playbackSettings = useEditorStore(state => state.playbackSettings)
  const slides = project?.slides ?? []
  const transitions = project?.transitions ?? []

  // Compute slide and voiceover timing boundaries for magnetic snapping
  const slidesWithTiming = useMemo(() => {
    let current = 0
    return slides.map((s, idx) => {
      const hasTransition = idx > 0
      const transitionDuration = hasTransition ? (playbackSettings.transitionDuration ?? 500) : 0
      const transitionObj = transitions.find(t => t.fromSlideId === s.id && t.trigger === 'auto')
      const configuredSlideDuration = transitionObj ? (transitionObj.autoDelay ?? 3000) : (playbackSettings.autoplayDelay ?? 3000)
      const activeAudioDurationMs = s.audio ? ((s.audio.trimEnd - s.audio.trimStart) / s.audio.playbackRate) * 1000 : 0
      const durationMs = Math.max(configuredSlideDuration, activeAudioDurationMs)
      const durationSec = durationMs / 1000
      const start = current
      const end = current + durationSec
      current = end
      return { start, end }
    })
  }, [slides, transitions, playbackSettings])

  const snapPoints = useMemo(() => {
    const points: number[] = []
    slidesWithTiming.forEach(s => {
      points.push(s.start)
      points.push(s.end)
    })
    return Array.from(new Set(points))
  }, [slidesWithTiming])

  const captions = project?.captions ?? []
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const rowRef = useRef<HTMLDivElement>(null)

  // Track key down to delete selected caption
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId || !activeProjectId || !project) return
      // Ignore if focus is in an input or textarea
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
      
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const nextCaptions = captions.filter(c => c.id !== selectedId)
        
        let updatedSlides = undefined
        if (selectedId.startsWith('slide-script-')) {
          const slideId = selectedId.replace('slide-script-', '')
          updatedSlides = project.slides.map(s =>
            s.id === slideId ? { ...s, script: '' } : s
          )
        }

        updateProject(activeProjectId, {
          captions: nextCaptions,
          ...(updatedSlides ? { slides: updatedSlides } : {}),
          synced: false,
        })
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, captions, activeProjectId, project, updateProject])

  const handleRowDoubleClick = (e: React.MouseEvent) => {
    if (!activeProjectId || !project || !rowRef.current) return
    const rect = rowRef.current.getBoundingClientRect()
    const scrollLeft = rowRef.current.parentElement?.scrollLeft ?? 0
    const clickX = e.clientX - rect.left + scrollLeft
    const start = Math.max(0, clickX / PX_PER_SEC)
    
    // Add default caption clip
    const newCaption = {
      id: Math.random().toString(36).substring(2, 9),
      text: 'Double-click to edit subtitle...',
      start,
      end: start + 2.5, // default 2.5s duration
    }
    const nextCaptions = [...captions, newCaption]
    updateProject(activeProjectId, { captions: nextCaptions, synced: false })
    setSelectedId(newCaption.id)
  }

  return (
    <div
      ref={rowRef}
      onDoubleClick={handleRowDoubleClick}
      className="flex-shrink-0 border-b relative select-none cursor-pointer"
      style={{ height: CAPTION_TRACK_H, borderColor: 'var(--ms-tl-border)' }}
    >
      {/* Background tracks overlay grids */}
      <div className="absolute inset-0 bg-neutral-900/10" />

      {/* Render Caption Clips */}
      {captions.map(caption => (
        <CaptionClip
          key={caption.id}
          caption={caption}
          allCaptions={captions}
          selected={selectedId === caption.id}
          onSelect={() => setSelectedId(caption.id)}
          onDeselect={() => setSelectedId(null)}
          activeProjectId={activeProjectId}
          updateProject={updateProject}
          snapPoints={snapPoints}
        />
      ))}

      {captions.length === 0 && (
        <div className="absolute inset-0 flex items-center px-4 text-[9px] font-medium pointer-events-none" style={{ color: 'var(--ms-tl-text-dim)' }}>
          No Captions — double-click track row or click + on Captions sidebar to add
        </div>
      )}
    </div>
  )
}

interface ClipProps {
  caption: { id: string; text: string; start: number; end: number }
  allCaptions: Array<{ id: string; text: string; start: number; end: number }>
  selected: boolean
  onSelect: () => void
  onDeselect: () => void
  activeProjectId: string | null
  updateProject: (id: string, updates: any) => void
  snapPoints: number[]
}

function CaptionClip({
  caption,
  allCaptions,
  selected,
  onSelect,
  onDeselect,
  activeProjectId,
  updateProject,
  snapPoints,
}: ClipProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(caption.text)
  const inputRef = useRef<HTMLInputElement>(null)

  const left = caption.start * PX_PER_SEC
  const width = Math.max(40, (caption.end - caption.start) * PX_PER_SEC)

  useEffect(() => {
    if (isEditing) {
      setEditText(caption.text)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isEditing, caption.text])

  const saveText = () => {
    setIsEditing(false)
    if (!activeProjectId) return
    const textVal = editText.trim() || 'Subtitle...'
    const nextCaptions = allCaptions.map(c => 
      c.id === caption.id ? { ...c, text: textVal } : c
    )

    let updatedSlides = undefined
    if (caption.id.startsWith('slide-script-')) {
      const slideId = caption.id.replace('slide-script-', '')
      const projectState = useEditorStore.getState().activeProject()
      if (projectState) {
        updatedSlides = projectState.slides.map(s =>
          s.id === slideId ? { ...s, script: textVal } : s
        )
      }
    }

    updateProject(activeProjectId, {
      captions: nextCaptions,
      ...(updatedSlides ? { slides: updatedSlides } : {}),
      synced: false,
    })
  }

  // Snaps coordinates to nearest slide transitions if closer than 100ms (0.1s)
  const applySnap = (val: number): number => {
    const threshold = 0.1
    for (const pt of snapPoints) {
      if (Math.abs(val - pt) < threshold) {
        return pt
      }
    }
    return val
  }

  // Drag position handler
  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
    const startX = e.clientX
    const originalStart = caption.start
    const duration = caption.end - caption.start

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaSec = deltaX / PX_PER_SEC
      let newStart = Math.max(0, originalStart + deltaSec)
      newStart = applySnap(newStart)
      let newEnd = newStart + duration

      const nextCaptions = allCaptions.map(c =>
        c.id === caption.id ? { ...c, start: newStart, end: newEnd } : c
      )
      if (activeProjectId) updateProject(activeProjectId, { captions: nextCaptions, synced: false })
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Resize Left Handler
  const handleResizeLeftStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    const startX = e.clientX
    const originalStart = caption.start

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaSec = deltaX / PX_PER_SEC
      let newStart = Math.max(0, Math.min(caption.end - 0.5, originalStart + deltaSec))
      newStart = applySnap(newStart)

      const nextCaptions = allCaptions.map(c =>
        c.id === caption.id ? { ...c, start: newStart } : c
      )
      if (activeProjectId) updateProject(activeProjectId, { captions: nextCaptions, synced: false })
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Resize Right Handler
  const handleResizeRightStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    const startX = e.clientX
    const originalEnd = caption.end

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaSec = deltaX / PX_PER_SEC
      let newEnd = Math.max(caption.start + 0.5, originalEnd + deltaSec)
      newEnd = applySnap(newEnd)

      const nextCaptions = allCaptions.map(c =>
        c.id === caption.id ? { ...c, end: newEnd } : c
      )
      if (activeProjectId) updateProject(activeProjectId, { captions: nextCaptions, synced: false })
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!activeProjectId) return
    const nextCaptions = allCaptions.filter(c => c.id !== caption.id)

    let updatedSlides = undefined
    if (caption.id.startsWith('slide-script-')) {
      const slideId = caption.id.replace('slide-script-', '')
      const projectState = useEditorStore.getState().activeProject()
      if (projectState) {
        updatedSlides = projectState.slides.map(s =>
          s.id === slideId ? { ...s, script: '' } : s
        )
      }
    }

    updateProject(activeProjectId, {
      captions: nextCaptions,
      ...(updatedSlides ? { slides: updatedSlides } : {}),
      synced: false,
    })
    onDeselect()
  }

  return (
    <div
      onMouseDown={handleDragStart}
      onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
      className={`absolute top-2.5 h-7 flex items-center group/clip rounded-lg border px-2.5 transition select-none ${
        selected
          ? 'bg-pink-600/25 border-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.3)] z-20'
          : 'bg-pink-900/10 border-pink-700/30 hover:border-pink-600/60 z-10'
      }`}
      style={{ left: `${left}px`, width: `${width}px` }}
    >
      {/* Left resize handle */}
      <div
        onMouseDown={handleResizeLeftStart}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-pink-500/30 active:bg-pink-500/50 rounded-l-lg transition"
      />

      {isEditing ? (
        <input
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={saveText}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveText()
            if (e.key === 'Escape') setIsEditing(false)
          }}
          className="w-full bg-neutral-950/95 border border-pink-500 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none z-30 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="flex items-center gap-1.5 w-full min-w-0 pr-4 pointer-events-none">
          <Type size={10} className="text-pink-400/80 shrink-0" />
          <span className="text-[10px] text-pink-100 font-semibold truncate leading-none">
            {caption.text}
          </span>
        </div>
      )}

      {/* Delete quick close button */}
      {!isEditing && (
        <button
          onClick={handleDelete}
          className="absolute right-1 p-0.5 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-colors cursor-pointer border-none bg-transparent opacity-0 group-hover/clip:opacity-100 shrink-0"
        >
          <X size={10} />
        </button>
      )}

      {/* Right resize handle */}
      <div
        onMouseDown={handleResizeRightStart}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-pink-500/30 active:bg-pink-500/50 rounded-r-lg transition"
      />
    </div>
  )
}
