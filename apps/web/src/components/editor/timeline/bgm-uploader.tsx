import { useState, useRef } from 'react'
import { Loader2, Upload } from 'lucide-react'
import type { SlideAudio } from '@motionslides/shared'
import { uploadTimelineAudioFile } from './upload-audio'

interface Props {
  onSave: (audio: SlideAudio) => void
  onClose: () => void
}

/**
 * Drag-and-drop and click-to-browse upload widget for project-wide background music.
 */
export function BgmUploader({ onSave, onClose }: Props) {
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    setError(null)
    setUploading(true)
    try {
      const audio = await uploadTimelineAudioFile(file, { volume: 0.7, loop: true })
      onSave(audio)
      onClose()
    } catch {
      setError('Failed to upload audio file. Please try MP3, WAV, or M4A.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await processFile(file)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.type.startsWith('audio/')) {
      setError('Please drop an audio file (MP3, WAV, M4A, OGG).')
      return
    }
    await processFile(file)
  }

  return (
    <div className="flex flex-col gap-2.5">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`w-full rounded-xl border border-dashed px-4 py-6 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-[border-color,background-color,transform] duration-150 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${
          isDragOver
            ? 'border-(--ms-accent) bg-(--ms-accent)/10'
            : 'border-(--ms-tl-border-strong) bg-(--ms-bg-surface) hover:border-(--ms-accent)/60'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 size={18} className="animate-spin text-(--ms-accent)" />
            <span className="text-[12px] font-medium text-(--ms-text-primary)">
              Uploading music track…
            </span>
          </>
        ) : (
          <>
            <div
              className="w-8 h-8 rounded-lg border flex items-center justify-center"
              style={{
                backgroundColor: 'var(--ms-bg-elevated)',
                borderColor: 'var(--ms-tl-border-strong)',
              }}
            >
              <Upload size={14} className="text-(--ms-text-secondary)" />
            </div>
            <div>
              <p className="text-[12px] font-medium text-(--ms-text-primary) m-0">
                Drop an audio file or click to browse
              </p>
              <p className="text-[10px] text-(--ms-text-muted) mt-0.5 m-0">
                MP3, WAV, M4A, or OGG · loops cleanly behind slides
              </p>
            </div>
          </>
        )}
      </button>

      {error && (
        <p
          role="alert"
          className="text-[11px] text-red-600 dark:text-red-300 bg-red-500/10 border border-red-500/25 rounded-md px-2.5 py-1.5 m-0"
        >
          {error}
        </p>
      )}
    </div>
  )
}
