import { useRef, useState } from 'react'
import { Settings, X } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useClickOutside } from '@/hooks/useClickOutside'
import {
  EXPORT_RESOLUTIONS,
  ASPECT_RATIO_OPTIONS,
  AUTOPLAY_DELAY_OPTIONS,
  TRANSITION_DURATION_OPTIONS,
} from '@/constants/export'
import type { AspectRatioKey } from '@motionslides/shared'
import { BezierEditor } from './BezierEditor'

const btnBase = "inline-flex items-center gap-1.5 text-xs font-medium px-2 md:px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-white/8 bg-[#1c1c1c] text-neutral-400 hover:text-neutral-100 hover:bg-[#242424]"
const labelCls = "text-[10px] text-neutral-600 uppercase tracking-wider block mb-1"
const selectCls = "w-full bg-[#1c1c1c] border border-white/8 rounded-md px-2 py-1 text-[11px] text-neutral-100 focus:outline-none"

export function SettingsDropdown() {
  const { playbackSettings, updatePlaybackSettings } = useEditorStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  const activeRatio = playbackSettings.aspectRatio
  const resolutionsForRatio = EXPORT_RESOLUTIONS[activeRatio]

  const handleRatioChange = (newRatio: AspectRatioKey) => {
    const newResolutions = EXPORT_RESOLUTIONS[newRatio]
    updatePlaybackSettings({
      aspectRatio: newRatio,
      exportResolution: { ...newResolutions[0] },
    })
  }

  return (
    <div className="relative" ref={ref}>
      <button className={btnBase} onClick={() => setOpen(!open)}>
        <Settings size={13} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-[#1a1a1a] border border-white/8 rounded-lg shadow-2xl z-999 p-3 w-72 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Settings</span>
            <button onClick={() => setOpen(false)} className="p-0.5 rounded text-neutral-600 hover:text-neutral-100 bg-transparent border-none cursor-pointer">
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
                  <select value={playbackSettings.autoplayDelay} onChange={(e) => updatePlaybackSettings({ autoplayDelay: +e.target.value })} className={selectCls}>
                    {AUTOPLAY_DELAY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={playbackSettings.loop} onChange={(e) => updatePlaybackSettings({ loop: e.target.checked })} className="accent-blue-500" />
                  <span className="text-[11px] text-neutral-200">Loop presentation</span>
                </label>
              </>
            )}

            <div className="border-t border-white/6 pt-3">
              <span className={labelCls}>Transition Duration</span>
              <select value={playbackSettings.transitionDuration} onChange={(e) => updatePlaybackSettings({ transitionDuration: +e.target.value })} className={selectCls}>
                {TRANSITION_DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Bezier Curve Editor */}
            <div className="border-t border-white/6 pt-3">
              <span className={labelCls}>Transition Easing</span>
              <BezierEditor
                value={playbackSettings.transitionEase}
                onChange={(ease) => updatePlaybackSettings({ transitionEase: ease })}
              />
            </div>

            {/* Aspect Ratio */}
            <div className="border-t border-white/6 pt-3">
              <span className={labelCls}>Aspect Ratio</span>
              <select
                value={activeRatio}
                onChange={(e) => handleRatioChange(e.target.value as AspectRatioKey)}
                className={selectCls}
              >
                {ASPECT_RATIO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Export Resolution */}
            <div>
              <span className={labelCls}>Export Resolution</span>
              <select
                value={playbackSettings.exportResolution.label}
                onChange={(e) => {
                  const res = resolutionsForRatio.find((r) => r.label === e.target.value)
                  if (res) updatePlaybackSettings({ exportResolution: { ...res } })
                }}
                className={selectCls}
              >
                {resolutionsForRatio.map((r) => <option key={r.label} value={r.label}>{r.label} ({r.width}×{r.height})</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
