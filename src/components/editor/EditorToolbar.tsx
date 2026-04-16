import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Play, Download, Type, Code2, Shapes, Settings, X, Film, FileText } from 'lucide-react'
import { useEditorStore, EXPORT_RESOLUTIONS } from '../../store/editorStore'
import { exportAsVideo, downloadBlob, type ExportProgress } from '../../lib/exportEngine'
import type { Project } from '../../types'
import { nanoid } from '../../lib/nanoid'

interface Props { project: Project }

export function EditorToolbar({ project }: Props) {
  const {
    updateProjectName, addElement,
    startPresentation, playbackSettings, updatePlaybackSettings,
  } = useEditorStore()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false)
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function addText() {
    addElement({
      id: nanoid(), type: 'text',
      position: { x: 100, y: 100 }, size: { width: 300, height: 60 },
      rotation: 0, opacity: 1, zIndex: 10,
      content: { value: 'Text', fontSize: 28, fontWeight: 'bold', color: '#ffffff', align: 'left' },
    })
  }
  function addCode() {
    addElement({
      id: nanoid(), type: 'code',
      position: { x: 100, y: 200 }, size: { width: 420, height: 160 },
      rotation: 0, opacity: 1, zIndex: 10,
      content: { value: '// write code here\n', language: 'javascript' },
    })
  }
  function addShape() {
    addElement({
      id: nanoid(), type: 'shape',
      position: { x: 200, y: 200 }, size: { width: 120, height: 120 },
      rotation: 0, opacity: 1, zIndex: 10,
      content: { shapeType: 'rectangle', fill: '#1e3a5f', stroke: '#3b82f6', label: 'Service' },
    })
  }

  // ── Export as JSON ──────────────────────────
  const handleExportJSON = useCallback(() => {
    const proj = useEditorStore.getState().activeProject()
    if (!proj) return
    const blob = new Blob([JSON.stringify(proj, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `${proj.name.replace(/\s+/g, '_')}.motionslides.json`)
    setExportOpen(false)
  }, [])

  // ── Export as Video ─────────────────────────
  const handleExportVideo = useCallback(async () => {
    setExportOpen(false)
    setExportProgress({ stage: 'preparing', currentSlide: 0, totalSlides: 0, message: 'Starting…' })

    const blob = await exportAsVideo((p) => setExportProgress(p))

    if (blob) {
      const proj = useEditorStore.getState().activeProject()
      const name = proj?.name.replace(/\s+/g, '_') ?? 'presentation'
      downloadBlob(blob, `${name}.webm`)
    }

    setTimeout(() => setExportProgress(null), 3000)
  }, [])

  // ── Play ────────────────────────────────────
  const handlePlay = useCallback(() => {
    startPresentation()
  }, [startPresentation])

  const btnBase = "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-white/8 bg-[#1c1c1c] text-neutral-400 hover:text-neutral-100 hover:bg-[#242424]"
  const dropdownCls = "absolute right-0 top-full mt-1.5 bg-[#1a1a1a] border border-white/8 rounded-lg shadow-2xl z-999 p-3"
  const labelCls = "text-[10px] text-neutral-600 uppercase tracking-wider block mb-1"
  const selectCls = "w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2 py-1 text-[11px] text-neutral-100 focus:outline-none"

  return (
    <header className="h-14 shrink-0 flex items-center gap-2 px-3 bg-[#161616] border-b border-white/8 z-50">
      <Link to="/dashboard" className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-100 hover:bg-white/6 transition-colors">
        <ArrowLeft size={16} />
      </Link>
      <div className="w-px h-5 bg-white/8 mx-1" />
      <Link to="/" className="flex items-center no-underline">
        <img src="/logo.png" alt="MotionSlides" className="h-6 w-auto" />
      </Link>
      <input
        value={project.name}
        onChange={(e) => updateProjectName(project.id, e.target.value)}
        onBlur={(e) => { if (!e.target.value.trim()) updateProjectName(project.id, 'Untitled Deck') }}
        spellCheck={false}
        className="bg-transparent border border-transparent hover:border-white/8 focus:border-blue-500 focus:bg-[#1c1c1c] rounded-md px-2 py-1 text-[13px] text-neutral-100 font-medium min-w-[130px] max-w-[220px] focus:outline-none transition-all"
      />
      <div className="w-px h-5 bg-white/8 mx-1" />

      <button className={btnBase} onClick={addText}><Type size={13} /> Text</button>
      <button className={btnBase} onClick={addCode}><Code2 size={13} /> Code</button>
      <button className={btnBase} onClick={addShape}><Shapes size={13} /> Shape</button>

      <div className="flex-1" />

      {/* ── Settings ─────────────────────── */}
      <div className="relative" ref={settingsRef}>
        <button className={btnBase} onClick={() => setSettingsOpen(!settingsOpen)}>
          <Settings size={13} />
        </button>
        {settingsOpen && (
          <div className={`${dropdownCls} w-72`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Settings</span>
              <button onClick={() => setSettingsOpen(false)} className="p-0.5 rounded text-neutral-600 hover:text-neutral-100 bg-transparent border-none cursor-pointer">
                <X size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {/* Autoplay */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={playbackSettings.autoplay}
                  onChange={(e) => updatePlaybackSettings({ autoplay: e.target.checked })}
                  className="accent-blue-500"
                />
                <span className="text-[11px] text-neutral-200">Autoplay slides</span>
              </label>

              {playbackSettings.autoplay && (
                <>
                  <div>
                    <span className={labelCls}>Slide Duration</span>
                    <select
                      value={playbackSettings.autoplayDelay}
                      onChange={(e) => updatePlaybackSettings({ autoplayDelay: +e.target.value })}
                      className={selectCls}
                    >
                      <option value={2000}>2 seconds</option>
                      <option value={3000}>3 seconds</option>
                      <option value={5000}>5 seconds</option>
                      <option value={8000}>8 seconds</option>
                      <option value={10000}>10 seconds</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={playbackSettings.loop}
                      onChange={(e) => updatePlaybackSettings({ loop: e.target.checked })}
                      className="accent-blue-500"
                    />
                    <span className="text-[11px] text-neutral-200">Loop presentation</span>
                  </label>
                </>
              )}

              <div className="border-t border-white/6 pt-3">
                <span className={labelCls}>Transition Duration</span>
                <select
                  value={playbackSettings.transitionDuration}
                  onChange={(e) => updatePlaybackSettings({ transitionDuration: +e.target.value })}
                  className={selectCls}
                >
                  <option value={300}>Fast (300ms)</option>
                  <option value={500}>Default (500ms)</option>
                  <option value={800}>Slow (800ms)</option>
                  <option value={1200}>Cinematic (1.2s)</option>
                </select>
              </div>

              <div>
                <span className={labelCls}>Transition Easing</span>
                <select
                  value={playbackSettings.transitionEase}
                  onChange={(e) => updatePlaybackSettings({ transitionEase: e.target.value as 'spring' | 'ease-out' | 'linear' })}
                  className={selectCls}
                >
                  <option value="spring">Spring</option>
                  <option value="ease-out">Ease Out</option>
                  <option value="linear">Linear</option>
                </select>
              </div>

              <div className="border-t border-white/6 pt-3">
                <span className={labelCls}>Export Resolution</span>
                <select
                  value={playbackSettings.exportResolution.label}
                  onChange={(e) => {
                    const res = EXPORT_RESOLUTIONS.find((r) => r.label === e.target.value)
                    if (res) updatePlaybackSettings({ exportResolution: { ...res } })
                  }}
                  className={selectCls}
                >
                  {EXPORT_RESOLUTIONS.map((r) => (
                    <option key={r.label} value={r.label}>{r.label} ({r.width}×{r.height})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Export ───────────────────────── */}
      <div className="relative" ref={exportRef}>
        <button className={btnBase} onClick={() => setExportOpen(!exportOpen)}>
          <Download size={13} /> Export
        </button>
        {exportOpen && (
          <div className={`${dropdownCls} w-56`}>
            <div className="space-y-1">
              <button
                onClick={handleExportVideo}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] text-neutral-200 hover:bg-white/6 transition-colors cursor-pointer border-none bg-transparent text-left"
              >
                <Film size={14} className="text-blue-400" />
                <div>
                  <div className="font-medium">Video (WebM)</div>
                  <div className="text-[10px] text-neutral-600">Animated presentation</div>
                </div>
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] text-neutral-200 hover:bg-white/6 transition-colors cursor-pointer border-none bg-transparent text-left"
              >
                <FileText size={14} className="text-emerald-400" />
                <div>
                  <div className="font-medium">Project (JSON)</div>
                  <div className="text-[10px] text-neutral-600">Backup / import</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Play ─────────────────────────── */}
      <button
        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer border-none"
        onClick={handlePlay}
      >
        <Play size={13} fill="currentColor" /> Play
      </button>

      {/* ── Export Progress Toast ─────────── */}
      {exportProgress && (
        <div className="fixed bottom-6 right-6 bg-[#1a1a1a] border border-white/8 rounded-lg p-4 shadow-2xl z-999 min-w-[260px]">
          <div className="text-[11px] font-semibold text-neutral-300 mb-1.5">
            {exportProgress.stage === 'done' ? '✓ Export Complete' : 'Exporting…'}
          </div>
          <div className="text-[10px] text-neutral-500 mb-2">{exportProgress.message}</div>
          {exportProgress.stage === 'recording' && (
            <div className="w-full bg-white/6 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(exportProgress.currentSlide / exportProgress.totalSlides) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}
    </header>
  )
}
