import { useState, useRef } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import type { SlideAudio } from '@motionslides/shared'

interface Props {
  onSave: (audio: SlideAudio) => void
  onClose: () => void
}

/** Upload widget for adding a background music track that plays across all slides. */
export function BgmUploader({ onSave, onClose }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const tempUrl = URL.createObjectURL(file)
      const duration = await new Promise<number>(resolve => {
        const a = new Audio(tempUrl)
        a.addEventListener('loadedmetadata', () => { URL.revokeObjectURL(tempUrl); resolve(a.duration) })
        a.addEventListener('error', () => { URL.revokeObjectURL(tempUrl); resolve(0) })
      })
      const formData = new FormData()
      formData.append('file', file, file.name)
      formData.append('duration', duration.toString())
      const res = await fetch('/api/upload/audio', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      onSave({
        id: Math.random().toString(36).substring(7),
        url: data.url,
        fileName: data.fileName,
        duration: data.duration || duration,
        volume: 0.7,
        loop: true,
        playbackRate: 1,
        trimStart: 0,
        trimEnd: data.duration || duration,
      })
    } catch {
      alert('Failed to upload audio.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
      {uploading ? (
        <span className="flex items-center gap-1.5 text-[11px] text-white/50">
          <Loader2 size={12} className="animate-spin" />Uploading…
        </span>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600/20 border border-sky-500/40 text-sky-300 text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-sky-600/30 transition-colors"
        >
          <Upload size={12} /> Choose music file
        </button>
      )}
      <button
        onClick={onClose}
        className="p-1 text-white/30 hover:text-white/70 border-none bg-transparent cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  )
}
