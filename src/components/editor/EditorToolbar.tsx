import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Play, Download, Type, Code2, Shapes, Settings, X, Maximize } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { Project } from '../../types'
import { nanoid } from '../../lib/nanoid'

interface Props { project: Project }

export function EditorToolbar({ project }: Props) {
  const { updateProjectName, addElement, activeSlide, activeSlideIndex, setActiveSlide, activeProject } = useEditorStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const [presenting, setPresenting] = useState(false)

  // Close settings on outside click
  useEffect(() => {
    if (!settingsOpen) return
    function onClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [settingsOpen])

  function addText() {
    addElement({
      id: nanoid(),
      type: 'text',
      position: { x: 100, y: 100 },
      size: { width: 300, height: 60 },
      rotation: 0, opacity: 1, zIndex: 10,
      content: { value: 'Text', fontSize: 28, fontWeight: 'bold', color: '#ffffff', align: 'left' },
    })
  }

  function addCode() {
    addElement({
      id: nanoid(),
      type: 'code',
      position: { x: 100, y: 200 },
      size: { width: 420, height: 160 },
      rotation: 0, opacity: 1, zIndex: 10,
      content: { value: '// write code here\n', language: 'javascript' },
    })
  }

  function addShape() {
    addElement({
      id: nanoid(),
      type: 'shape',
      position: { x: 200, y: 200 },
      size: { width: 120, height: 120 },
      rotation: 0, opacity: 1, zIndex: 10,
      content: { shapeType: 'rectangle', fill: '#1e3a5f', stroke: '#3b82f6', label: 'Service' },
    })
  }

  // ── Export as JSON ──────────────────────────
  const handleExport = useCallback(() => {
    const proj = activeProject()
    if (!proj) return
    const blob = new Blob([JSON.stringify(proj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${proj.name.replace(/\s+/g, '_')}.motionslides.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [activeProject])

  // ── Presentation mode ─────────────────────
  const handlePlay = useCallback(() => {
    setPresenting(true)
    document.documentElement.requestFullscreen?.()
  }, [])

  // Exit presentation
  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) setPresenting(false)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  // Arrow key navigation in presentation mode
  useEffect(() => {
    if (!presenting) return
    function onKey(e: KeyboardEvent) {
      const proj = activeProject()
      if (!proj) return
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        const idx = useEditorStore.getState().activeSlideIndex
        if (idx < proj.slides.length - 1) setActiveSlide(idx + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const idx = useEditorStore.getState().activeSlideIndex
        if (idx > 0) setActiveSlide(idx - 1)
      } else if (e.key === 'Escape') {
        document.exitFullscreen?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presenting, activeProject, setActiveSlide])

  const btnBase = "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-white/8 bg-[#1c1c1c] text-neutral-400 hover:text-neutral-100 hover:bg-[#242424]"

  return (
    <header className="h-14 shrink-0 flex items-center gap-2 px-3 bg-[#161616] border-b border-white/8 z-50">
      {/* Back */}
      <Link to="/dashboard" className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-100 hover:bg-white/6 transition-colors">
        <ArrowLeft size={16} />
      </Link>

      <div className="w-px h-5 bg-white/8 mx-1" />

      {/* Logo */}
      <Link to="/" className="flex items-center no-underline">
        <img src="/logo.png" alt="MotionSlides" className="h-6 w-auto" />
      </Link>

      {/* Editable title */}
      <input
        value={project.name}
        onChange={(e) => updateProjectName(project.id, e.target.value)}
        onBlur={(e) => { if (!e.target.value.trim()) updateProjectName(project.id, 'Untitled Deck') }}
        spellCheck={false}
        className="bg-transparent border border-transparent hover:border-white/8 focus:border-blue-500 focus:bg-[#1c1c1c] rounded-md px-2 py-1 text-[13px] text-neutral-100 font-medium min-w-[130px] max-w-[220px] focus:outline-none transition-all"
      />

      <div className="w-px h-5 bg-white/8 mx-1" />

      {/* Add element buttons */}
      <button className={btnBase} onClick={addText}><Type size={13} /> Text</button>
      <button className={btnBase} onClick={addCode}><Code2 size={13} /> Code</button>
      <button className={btnBase} onClick={addShape}><Shapes size={13} /> Shape</button>

      <div className="flex-1" />

      {/* Settings dropdown */}
      <div className="relative" ref={settingsRef}>
        <button
          className={btnBase}
          onClick={() => setSettingsOpen(!settingsOpen)}
        >
          <Settings size={13} />
        </button>
        {settingsOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#1a1a1a] border border-white/8 rounded-lg shadow-2xl z-[999] p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Settings</span>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-0.5 rounded text-neutral-600 hover:text-neutral-100 bg-transparent border-none cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Slide Background</span>
                <input
                  type="color"
                  defaultValue="#0a0a0a"
                  className="w-full h-7 rounded cursor-pointer border-none bg-transparent"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Transition Duration</span>
                <select className="w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2 py-1 text-[11px] text-neutral-100 focus:outline-none">
                  <option value="300">Fast (300ms)</option>
                  <option value="500" selected>Default (500ms)</option>
                  <option value="800">Slow (800ms)</option>
                  <option value="1200">Cinematic (1.2s)</option>
                </select>
              </div>
              <div>
                <span className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Transition Easing</span>
                <select className="w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2 py-1 text-[11px] text-neutral-100 focus:outline-none">
                  <option value="spring">Spring</option>
                  <option value="ease-out" selected>Ease Out</option>
                  <option value="linear">Linear</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export */}
      <button className={btnBase} onClick={handleExport}>
        <Download size={13} /> Export
      </button>

      {/* Play / Presentation */}
      <button
        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer border-none"
        onClick={handlePlay}
      >
        <Play size={13} fill="currentColor" /> Play
      </button>
    </header>
  )
}
