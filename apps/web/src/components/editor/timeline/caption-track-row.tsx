import { useState, useRef, useEffect } from 'react'
import { X, Type } from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'
import { CAPTION_TRACK_H } from './constants'
import type { SlideWithTiming } from './types'

interface Props {
  currentTime: number
  totalDuration: number
  pxPerSec: number
  slidesWithTiming: SlideWithTiming[]
  snapEnabled: boolean
  captionsVisible: boolean
  onSnapGuideChange: (time: number | null) => void
}

/**
 * Subtitle & caption track supporting click-to-add (when empty), double-click-to-add,
 * inline editing, magnetic boundary snapping with live visual guide, and edge trimming.
 */
export function CaptionTrackRow({
  currentTime,
  pxPerSec,
  slidesWithTiming,
  snapEnabled,
  captionsVisible,
  onSnapGuideChange,
}: Props) {
  const project = useEditorStore(state => state.activeProject())
  const activeProjectId = useEditorStore(state => state.activeProjectId)
  const updateProject = useEditorStore(state => state.updateProject)

  const snapPoints = Array.from(
    new Set([
      ...slidesWithTiming.flatMap(s => [s.start, s.end]),
      currentTime,
    ]),
  )

  const captions = project?.captions ?? []
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId || !activeProjectId || !project) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'Backspace' || e.key === 'Delete') {
        const nextCaptions = captions.filter(c => c.id !== selectedId)
        let updatedSlides = undefined
        if (selectedId.startsWith('slide-script-')) {
          const slideId = selectedId.replace('slide-script-', '')
          updatedSlides = project.slides.map(s =>
            s.id === slideId ? { ...s, script: '' } : s,
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

  const createCaptionAtPointer = (clientX: number) => {
    if (!activeProjectId || !project || !rowRef.current) return
    const rect = rowRef.current.getBoundingClientRect()
    const clickX = clientX - rect.left
    const start = Math.max(0, clickX / pxPerSec)

    const newCaption = {
      id: Math.random().toString(36).substring(2, 9),
      text: 'Double-click to edit subtitle...',
      start,
      end: start + 2.5,
    }
    updateProject(activeProjectId, {
      captions: [...captions, newCaption],
      synced: false,
    })
    setSelectedId(newCaption.id)
  }

  return (
    <div
      ref={rowRef}
      onClick={() => {
        if (selectedId) setSelectedId(null)
      }}
      onDoubleClick={e => createCaptionAtPointer(e.clientX)}
      className="flex-shrink-0 border-b relative select-none cursor-pointer"
      style={{
        height: CAPTION_TRACK_H,
        borderColor: 'var(--ms-tl-border)',
        backgroundColor: 'var(--ms-tl-track-alt)',
      }}
    >
      {captions.map(caption => (
        <CaptionClip
          key={caption.id}
          caption={caption}
          allCaptions={captions}
          pxPerSec={pxPerSec}
          snapEnabled={snapEnabled}
          captionsVisible={captionsVisible}
          selected={selectedId === caption.id}
          onSelect={() => setSelectedId(caption.id)}
          onDeselect={() => setSelectedId(null)}
          activeProjectId={activeProjectId}
          updateProject={updateProject}
          snapPoints={snapPoints}
          onSnapGuideChange={onSnapGuideChange}
        />
      ))}

      {captions.length === 0 && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            createCaptionAtPointer(e.clientX)
          }}
          className="absolute inset-0 w-full h-full flex items-center px-4 text-[11px] font-medium border-none bg-transparent text-left cursor-pointer hover:bg-black/[0.025] dark:hover:bg-white/[0.025] transition-colors duration-150"
          style={{ color: 'var(--ms-tl-text-dim)' }}
        >
          Click anywhere to add a caption clip
        </button>
      )}
    </div>
  )
}

interface ClipProps {
  caption: { id: string; text: string; start: number; end: number }
  allCaptions: Array<{ id: string; text: string; start: number; end: number }>
  pxPerSec: number
  snapEnabled: boolean
  captionsVisible: boolean
  selected: boolean
  onSelect: () => void
  onDeselect: () => void
  activeProjectId: string | null
  updateProject: (id: string, updates: Record<string, unknown>) => void
  snapPoints: number[]
  onSnapGuideChange: (time: number | null) => void
}

function CaptionClip({
  caption,
  allCaptions,
  pxPerSec,
  snapEnabled,
  captionsVisible,
  selected,
  onSelect,
  onDeselect,
  activeProjectId,
  updateProject,
  snapPoints,
  onSnapGuideChange,
}: ClipProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(caption.text)

  const left = caption.start * pxPerSec
  const width = Math.max(40, (caption.end - caption.start) * pxPerSec)

  const saveText = () => {
    setIsEditing(false)
    if (!activeProjectId) return
    const textVal = editText.trim() || 'Subtitle...'
    const nextCaptions = allCaptions.map(c =>
      c.id === caption.id ? { ...c, text: textVal } : c,
    )

    let updatedSlides = undefined
    if (caption.id.startsWith('slide-script-')) {
      const slideId = caption.id.replace('slide-script-', '')
      const projectState = useEditorStore.getState().activeProject()
      if (projectState) {
        updatedSlides = projectState.slides.map(s =>
          s.id === slideId ? { ...s, script: textVal } : s,
        )
      }
    }

    updateProject(activeProjectId, {
      captions: nextCaptions,
      ...(updatedSlides ? { slides: updatedSlides } : {}),
      synced: false,
    })
  }

  const resolveSnap = (val: number, allowSnap: boolean): number => {
    if (!allowSnap) {
      onSnapGuideChange(null)
      return val
    }
    const threshold = 6 / Math.max(1, pxPerSec)
    let bestPt: number | null = null
    let bestDist = threshold
    for (const pt of snapPoints) {
      const dist = Math.abs(val - pt)
      if (dist < bestDist) {
        bestDist = dist
        bestPt = pt
      }
    }
    onSnapGuideChange(bestPt)
    return bestPt ?? val
  }

  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
    const startX = e.clientX
    const originalStart = caption.start
    const duration = caption.end - caption.start

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaSec = (moveEvent.clientX - startX) / pxPerSec
      const rawStart = Math.max(0, originalStart + deltaSec)
      const newStart = resolveSnap(rawStart, snapEnabled && !moveEvent.altKey)
      const newEnd = newStart + duration

      const nextCaptions = allCaptions.map(c =>
        c.id === caption.id ? { ...c, start: newStart, end: newEnd } : c,
      )
      if (activeProjectId) updateProject(activeProjectId, { captions: nextCaptions, synced: false })
    }

    const onMouseUp = () => {
      onSnapGuideChange(null)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const handleResizeLeftStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    const startX = e.clientX
    const originalStart = caption.start

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaSec = (moveEvent.clientX - startX) / pxPerSec
      const rawStart = Math.max(0, Math.min(caption.end - 0.5, originalStart + deltaSec))
      const newStart = Math.min(
        caption.end - 0.5,
        resolveSnap(rawStart, snapEnabled && !moveEvent.altKey),
      )

      const nextCaptions = allCaptions.map(c =>
        c.id === caption.id ? { ...c, start: newStart } : c,
      )
      if (activeProjectId) updateProject(activeProjectId, { captions: nextCaptions, synced: false })
    }

    const onMouseUp = () => {
      onSnapGuideChange(null)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const handleResizeRightStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    const startX = e.clientX
    const originalEnd = caption.end

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaSec = (moveEvent.clientX - startX) / pxPerSec
      const rawEnd = Math.max(caption.start + 0.5, originalEnd + deltaSec)
      const newEnd = Math.max(
        caption.start + 0.5,
        resolveSnap(rawEnd, snapEnabled && !moveEvent.altKey),
      )

      const nextCaptions = allCaptions.map(c =>
        c.id === caption.id ? { ...c, end: newEnd } : c,
      )
      if (activeProjectId) updateProject(activeProjectId, { captions: nextCaptions, synced: false })
    }

    const onMouseUp = () => {
      onSnapGuideChange(null)
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
          s.id === slideId ? { ...s, script: '' } : s,
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
      onClick={e => e.stopPropagation()}
      onDoubleClick={e => {
        e.stopPropagation()
        setEditText(caption.text)
        setIsEditing(true)
      }}
      className={`absolute top-2 h-7 flex items-center group/clip rounded-md border overflow-hidden transition-[border-color,box-shadow,opacity] duration-150 select-none ${
        selected
          ? 'border-(--ms-accent) ring-1 ring-(--ms-accent)/50 z-20'
          : 'border-(--ms-tl-border-strong) hover:border-(--ms-text-muted) z-10'
      } ${captionsVisible ? '' : 'opacity-40'}`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        backgroundColor: 'var(--ms-bg-elevated)',
      }}
    >
      {/* Semantic left amber edge */}
      <span
        className="absolute left-0 top-0 bottom-0 w-0.5 pointer-events-none"
        style={{ backgroundColor: 'var(--ms-tl-caption-accent)' }}
      />

      {/* Left resize handle */}
      <div
        onMouseDown={handleResizeLeftStart}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-(--ms-accent)/30 transition-colors"
      />

      {isEditing ? (
        <input
          autoFocus
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onBlur={saveText}
          onKeyDown={e => {
            if (e.key === 'Enter') saveText()
            if (e.key === 'Escape') setIsEditing(false)
          }}
          className="w-full mx-1.5 bg-(--ms-bg-surface) border border-(--ms-accent) rounded px-1.5 py-0.5 text-[11px] text-(--ms-text-primary) focus:outline-none z-30 pointer-events-auto"
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        />
      ) : (
        <div className="flex items-center gap-1.5 w-full min-w-0 pl-2.5 pr-5 pointer-events-none">
          <Type size={10} className="shrink-0" style={{ color: 'var(--ms-tl-caption-accent)' }} />
          <span className="text-[11px] text-(--ms-text-primary) font-medium truncate leading-none">
            {caption.text}
          </span>
        </div>
      )}

      {!isEditing && (
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete caption"
          className="absolute right-1 w-4 h-4 rounded flex items-center justify-center hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) transition-opacity cursor-pointer border-none bg-transparent opacity-0 group-hover/clip:opacity-100 shrink-0"
        >
          <X size={10} />
        </button>
      )}

      {/* Right resize handle */}
      <div
        onMouseDown={handleResizeRightStart}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-(--ms-accent)/30 transition-colors"
      />
    </div>
  )
}
