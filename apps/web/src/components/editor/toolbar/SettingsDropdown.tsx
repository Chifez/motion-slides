import { useRef, useState } from 'react'
import { Settings, X, Sun, Moon } from 'lucide-react'
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

const btnBase = "inline-flex items-center gap-1.5 text-xs font-medium px-2 md:px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-[var(--ms-border)] bg-[var(--ms-bg-elevated)] text-[var(--ms-text-secondary)] hover:text-[var(--ms-text-primary)] hover:bg-[var(--ms-border)]"
const labelCls = "text-[10px] text-[var(--ms-text-muted)] uppercase tracking-wider block mb-1"
const selectCls = "w-full bg-[var(--ms-bg-base)] border border-[var(--ms-border)] rounded-md px-2 py-1 text-[11px] text-[var(--ms-text-primary)] focus:outline-none"

export function SettingsDropdown() {
  const { playbackSettings, updatePlaybackSettings, theme, toggleTheme } = useEditorStore()
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
        <div className="absolute right-0 top-full mt-1.5 bg-[var(--ms-bg-elevated)] border border-[var(--ms-border)] rounded-lg shadow-2xl z-999 p-3 w-72 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[var(--ms-text-secondary)] uppercase tracking-wider">Settings</span>
            <button onClick={() => setOpen(false)} className="p-0.5 rounded text-[var(--ms-text-muted)] hover:text-[var(--ms-text-primary)] bg-transparent border-none cursor-pointer">
              <X size={12} />
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--ms-border)]">
              <span className="text-[11px] text-[var(--ms-text-secondary)]">Appearance</span>
              <button
                onClick={() => toggleTheme()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--ms-bg-base)] border border-[var(--ms-border)] text-[var(--ms-text-primary)] text-xs font-medium hover:bg-[var(--ms-border)] transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>

            {/* Autoplay */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={playbackSettings.autoplay}
                onChange={(e) => updatePlaybackSettings({ autoplay: e.target.checked })}
                className="accent-blue-500"
              />
              <span className="text-[11px] text-[var(--ms-text-primary)]">Autoplay slides</span>
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
                  <span className="text-[11px] text-[var(--ms-text-primary)]">Loop presentation</span>
                </label>
              </>
            )}

            <div className="border-t border-[var(--ms-border)] pt-3">
              <span className={labelCls}>Transition Duration</span>
              <select value={playbackSettings.transitionDuration} onChange={(e) => updatePlaybackSettings({ transitionDuration: +e.target.value })} className={selectCls}>
                {TRANSITION_DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Bezier Curve Editor */}
            <div className="border-t border-[var(--ms-border)] pt-3">
              <span className={labelCls}>Transition Easing</span>
              <BezierEditor
                value={playbackSettings.transitionEase}
                onChange={(ease) => updatePlaybackSettings({ transitionEase: ease })}
              />
            </div>

            {/* Aspect Ratio */}
            <div className="border-t border-[var(--ms-border)] pt-3">
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
