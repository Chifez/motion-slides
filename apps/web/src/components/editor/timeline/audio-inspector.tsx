import { X, Trash2, Volume2, VolumeX, RotateCcw } from 'lucide-react'
import type { SlideAudio } from '@motionslides/shared'

interface Props {
  audioInfo: SlideAudio
  label: string
  accentColor: string
  isBgm?: boolean
  duckBackgroundMusic?: boolean
  onToggleDuck?: (duck: boolean) => void
  onUpdate: (updates: Partial<SlideAudio>) => void
  onDelete: () => void
  onClose: () => void
}

/**
 * Right-docked theme-safe inspector panel for adjusting volume, speed,
 * trim bounds, BGM loop/ducking options, and clip removal.
 */
export function AudioInspector({
  audioInfo,
  label,
  accentColor,
  isBgm = false,
  duckBackgroundMusic = true,
  onToggleDuck,
  onUpdate,
  onDelete,
  onClose,
}: Props) {
  const activeDuration = Math.max(
    0,
    (audioInfo.trimEnd - audioInfo.trimStart) / audioInfo.playbackRate,
  )
  const isTrimmed = audioInfo.trimStart > 0.01 || audioInfo.trimEnd < audioInfo.duration - 0.01
  const minWindow = Math.min(0.4, audioInfo.duration)

  const handleTrimStartInput = (raw: number) => {
    if (!Number.isFinite(raw)) return
    const nextStart = Math.max(0, Math.min(audioInfo.trimEnd - minWindow, raw))
    onUpdate({ trimStart: Number(nextStart.toFixed(2)) })
  }

  const handleTrimEndInput = (raw: number) => {
    if (!Number.isFinite(raw)) return
    const nextEnd = Math.min(audioInfo.duration, Math.max(audioInfo.trimStart + minWindow, raw))
    onUpdate({ trimEnd: Number(nextEnd.toFixed(2)) })
  }

  return (
    <div
      className="w-60 shrink-0 border-l flex flex-col overflow-y-auto"
      style={{
        backgroundColor: 'var(--ms-bg-surface)',
        borderColor: 'var(--ms-tl-border-strong)',
        scrollbarWidth: 'thin',
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-2 px-3 py-2.5 border-b shrink-0"
        style={{ borderColor: 'var(--ms-tl-border)' }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            <span className="text-[11px] font-semibold text-(--ms-text-primary) truncate">
              {label}
            </span>
          </div>
          <p className="text-[10px] text-(--ms-text-muted) truncate mt-0.5 m-0">
            {audioInfo.fileName}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close clip inspector"
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-(--ms-text-muted) hover:text-(--ms-text-primary) border-none bg-transparent cursor-pointer shrink-0 transition-[background-color,color,transform] duration-150 active:scale-[0.94]"
        >
          <X size={13} />
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 p-3 flex-1">
        {/* Volume */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-(--ms-text-secondary) font-medium">Volume</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onUpdate({ volume: audioInfo.volume > 0 ? 0 : 1 })}
                title={audioInfo.volume > 0 ? 'Set volume to 0%' : 'Restore volume to 100%'}
                aria-label="Toggle clip mute"
                className="w-5 h-5 rounded flex items-center justify-center border-none bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-black/[0.05] dark:hover:bg-white/[0.06] cursor-pointer"
              >
                {audioInfo.volume === 0 ? <VolumeX size={11} /> : <Volume2 size={11} />}
              </button>
              <span className="font-mono tabular-nums text-[11px] text-(--ms-text-primary) w-9 text-right">
                {Math.round(audioInfo.volume * 100)}%
              </span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={audioInfo.volume}
            onChange={e => onUpdate({ volume: parseFloat(e.target.value) })}
            aria-label="Clip volume"
            className="w-full h-1 rounded-full cursor-pointer"
            style={{ accentColor }}
          />
        </div>

        {/* Speed */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-(--ms-text-secondary) font-medium block">Speed</span>
          <div className="grid grid-cols-3 gap-1">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => {
              const active = audioInfo.playbackRate === rate
              return (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onUpdate({ playbackRate: rate })}
                  className={`py-1 text-[10px] font-mono tabular-nums rounded-md cursor-pointer border transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] ${
                    active
                      ? 'text-(--ms-accent) border-(--ms-accent) bg-(--ms-accent)/12 font-semibold'
                      : 'bg-(--ms-bg-elevated) border-(--ms-tl-border) text-(--ms-text-muted) hover:text-(--ms-text-primary)'
                  }`}
                >
                  {rate}x
                </button>
              )
            })}
          </div>
        </div>

        {/* BGM Options */}
        {isBgm && (
          <div
            className="rounded-lg border p-2.5 space-y-2"
            style={{
              backgroundColor: 'var(--ms-bg-elevated)',
              borderColor: 'var(--ms-tl-border)',
            }}
          >
            <label className="flex items-center justify-between gap-2 text-[11px] text-(--ms-text-secondary) cursor-pointer">
              <span>Loop across slides</span>
              <input
                type="checkbox"
                checked={audioInfo.loop}
                onChange={e => onUpdate({ loop: e.target.checked })}
                className="cursor-pointer accent-(--ms-accent)"
              />
            </label>
            {onToggleDuck && (
              <label className="flex items-center justify-between gap-2 text-[11px] text-(--ms-text-secondary) cursor-pointer">
                <span>Duck under voiceover</span>
                <input
                  type="checkbox"
                  checked={duckBackgroundMusic !== false}
                  onChange={e => onToggleDuck(e.target.checked)}
                  className="cursor-pointer accent-(--ms-accent)"
                />
              </label>
            )}
          </div>
        )}

        {/* Trim */}
        <div
          className="rounded-lg border p-2.5 space-y-2 text-[11px]"
          style={{
            backgroundColor: 'var(--ms-bg-elevated)',
            borderColor: 'var(--ms-tl-border)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-(--ms-text-secondary) font-medium">Trim</span>
            {isTrimmed && (
              <button
                type="button"
                onClick={() => onUpdate({ trimStart: 0, trimEnd: audioInfo.duration })}
                className="inline-flex items-center gap-1 text-[10px] text-(--ms-accent) hover:underline border-none bg-transparent cursor-pointer p-0"
              >
                <RotateCcw size={9} /> Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] text-(--ms-text-muted)">Start (s)</span>
              <input
                type="number"
                min={0}
                max={Math.max(0, audioInfo.trimEnd - minWindow)}
                step={0.1}
                value={Number(audioInfo.trimStart.toFixed(2))}
                onChange={e => handleTrimStartInput(parseFloat(e.target.value))}
                className="w-full rounded border px-1.5 py-1 text-[11px] font-mono tabular-nums text-(--ms-text-primary) bg-(--ms-bg-surface) border-(--ms-tl-border-strong) focus:outline-none focus:border-(--ms-accent)"
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] text-(--ms-text-muted)">End (s)</span>
              <input
                type="number"
                min={Math.min(audioInfo.duration, audioInfo.trimStart + minWindow)}
                max={audioInfo.duration}
                step={0.1}
                value={Number(audioInfo.trimEnd.toFixed(2))}
                onChange={e => handleTrimEndInput(parseFloat(e.target.value))}
                className="w-full rounded border px-1.5 py-1 text-[11px] font-mono tabular-nums text-(--ms-text-primary) bg-(--ms-bg-surface) border-(--ms-tl-border-strong) focus:outline-none focus:border-(--ms-accent)"
              />
            </label>
          </div>

          <div
            className="pt-1.5 border-t flex justify-between font-medium text-[11px]"
            style={{ borderColor: 'var(--ms-tl-border)' }}
          >
            <span className="text-(--ms-text-muted)">Active length</span>
            <span className="font-mono tabular-nums text-(--ms-text-primary)">
              {activeDuration.toFixed(2)}s
            </span>
          </div>
        </div>

        {/* Footer: Destructive action safely separated */}
        <div className="mt-auto pt-3 border-t" style={{ borderColor: 'var(--ms-tl-border)' }}>
          <button
            type="button"
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-500/30 bg-red-500/[0.06] hover:bg-red-500/[0.14] text-red-600 dark:text-red-400 text-[11px] font-medium cursor-pointer transition-[background-color,border-color,transform] duration-150 active:scale-[0.97]"
          >
            <Trash2 size={11} /> Remove clip
          </button>
        </div>
      </div>
    </div>
  )
}
