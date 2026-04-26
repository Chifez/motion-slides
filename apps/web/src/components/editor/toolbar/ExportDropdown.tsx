import { useState, useRef, useCallback } from 'react'
import { Download, Film, FileText, Share2 } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useClickOutside } from '@/hooks/useClickOutside'
import { startExport, type ExportProgressEvent } from '@/lib/exportClient'
import { downloadBlob } from '@/lib/exportEngine'
import { SOCIAL_PRESETS, type SocialPreset } from '@/lib/socialExport'
import { ExportProgressToast } from './ExportProgressToast'
import { useIsMobile } from '@/hooks/useMediaQuery'

const btnBase = "inline-flex items-center gap-1.5 text-xs font-medium px-2 md:px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-white/8 bg-[#1c1c1c] text-neutral-400 hover:text-neutral-100 hover:bg-[#242424]"

/** Inline SVG platform logos */
function PlatformIcon({ id }: { id: string }) {
  const size = 16
  switch (id) {
    case 'tiktok':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 0010.7 4.58V13.4a8.27 8.27 0 005.74 2.31V12.3a4.85 4.85 0 01-3.77-1.85V6.69h3.77z" fill="#fff"/>
        </svg>
      )
    case 'instagram-reels':
    case 'instagram-post':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig-grad)" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="12" r="5" stroke="url(#ig-grad)" strokeWidth="2" fill="none"/>
          <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig-grad)"/>
          <defs>
            <linearGradient id="ig-grad" x1="2" y1="22" x2="22" y2="2">
              <stop stopColor="#F58529"/><stop offset="0.5" stopColor="#DD2A7B"/><stop offset="1" stopColor="#8134AF"/>
            </linearGradient>
          </defs>
        </svg>
      )
    case 'twitter':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    case 'youtube':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000"/>
          <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#fff"/>
        </svg>
      )
    case 'linkedin':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    default:
      return <Share2 size={14} />
  }
}

export function ExportDropdown() {
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState<ExportProgressEvent | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  const handleExportJSON = useCallback(() => {
    const proj = useEditorStore.getState().activeProject()
    if (!proj) return
    const blob = new Blob([JSON.stringify(proj, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `${proj.name.replace(/\s+/g, '_')}.motionslides.json`)
    setOpen(false)
  }, [])

  const handleExportFormat = useCallback(async (format: 'mp4' | 'webm' | 'gif' | 'pdf') => {
    setOpen(false)
    await startExport(format, (p) => setProgress(p))
    setTimeout(() => setProgress(null), 5000)
  }, [])

  const handleSocialExport = useCallback(async (preset: SocialPreset) => {
    // Apply the platform's aspect ratio and resolution before exporting
    useEditorStore.getState().updatePlaybackSettings({
      aspectRatio: preset.aspectRatio,
      exportResolution: { ...preset.resolution },
    })

    setOpen(false)

    // Small delay to let the canvas adapt to the new aspect ratio
    await new Promise((r) => setTimeout(r, 500))

    await startExport('mp4', (p) => setProgress(p))
    setTimeout(() => setProgress(null), 5000)
  }, [])

  return (
    <>
      <div className="relative" ref={ref}>
        <button className={btnBase} onClick={() => setOpen(!open)} title="Export">
          <Download size={13} /> {!useIsMobile() && "Export"}
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1.5 bg-[#1a1a1a] border border-white/8 rounded-lg shadow-2xl z-999 p-3 w-64">
            {/* Standard exports */}
            <div className="space-y-1 mb-3">
              <button
                onClick={() => handleExportFormat('mp4')}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] text-neutral-200 hover:bg-white/6 transition-colors cursor-pointer border-none bg-transparent text-left"
              >
                <Film size={14} className="text-blue-400" />
                <div>
                  <div className="font-medium">Video (MP4)</div>
                  <div className="text-[10px] text-neutral-600">Standard compatibility</div>
                </div>
              </button>
              <button
                onClick={() => handleExportFormat('gif')}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] text-neutral-200 hover:bg-white/6 transition-colors cursor-pointer border-none bg-transparent text-left"
              >
                <Film size={14} className="text-purple-400" />
                <div>
                  <div className="font-medium">Animated GIF</div>
                  <div className="text-[10px] text-neutral-600">Looping image</div>
                </div>
              </button>
              <button
                onClick={() => handleExportFormat('pdf')}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] text-neutral-200 hover:bg-white/6 transition-colors cursor-pointer border-none bg-transparent text-left"
              >
                <FileText size={14} className="text-red-400" />
                <div>
                  <div className="font-medium">PDF Document</div>
                  <div className="text-[10px] text-neutral-600">Static slide deck</div>
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

            {/* Social export section */}
            <div className="border-t border-white/6 pt-2.5">
              <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider block mb-2">Export for Social</span>
              <div className="grid grid-cols-3 gap-1.5">
                {SOCIAL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSocialExport(preset)}
                    className="flex flex-col items-center gap-1 px-1.5 py-2 rounded-md hover:bg-white/6 transition-colors cursor-pointer border-none bg-transparent group"
                    title={`${preset.resolution.width}×${preset.resolution.height}${preset.maxDurationHint ? ` • max ${preset.maxDurationHint}` : ''}`}
                  >
                    <PlatformIcon id={preset.id} />
                    <span className="text-[9px] text-neutral-500 group-hover:text-neutral-200 transition-colors leading-tight text-center">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <ExportProgressToast progress={progress} />
    </>
  )
}
