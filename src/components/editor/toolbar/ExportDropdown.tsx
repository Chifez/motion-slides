import { useState, useRef, useCallback } from 'react'
import { Download, Film, FileText } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useClickOutside } from '@/hooks/useClickOutside'
import { exportAsVideo, downloadBlob, type ExportProgress } from '@/lib/exportEngine'
import { ExportProgressToast } from './ExportProgressToast'

const btnBase = "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-white/8 bg-[#1c1c1c] text-neutral-400 hover:text-neutral-100 hover:bg-[#242424]"

export function ExportDropdown() {
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  const handleExportJSON = useCallback(() => {
    const proj = useEditorStore.getState().activeProject()
    if (!proj) return
    const blob = new Blob([JSON.stringify(proj, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `${proj.name.replace(/\s+/g, '_')}.motionslides.json`)
    setOpen(false)
  }, [])

  const handleExportVideo = useCallback(async () => {
    setOpen(false)
    setProgress({ stage: 'preparing', currentSlide: 0, totalSlides: 0, message: 'Starting…' })
    const blob = await exportAsVideo((p) => setProgress(p))
    if (blob) {
      const proj = useEditorStore.getState().activeProject()
      const name = proj?.name.replace(/\s+/g, '_') ?? 'presentation'
      downloadBlob(blob, `${name}.webm`)
    }
    setTimeout(() => setProgress(null), 3000)
  }, [])

  return (
    <>
      <div className="relative" ref={ref}>
        <button className={btnBase} onClick={() => setOpen(!open)}>
          <Download size={13} /> Export
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1.5 bg-[#1a1a1a] border border-white/8 rounded-lg shadow-2xl z-999 p-3 w-56">
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
      <ExportProgressToast progress={progress} />
    </>
  )
}
