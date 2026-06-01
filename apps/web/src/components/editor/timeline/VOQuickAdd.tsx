import { useState, useRef } from 'react'
import { Loader2, Mic, Upload, Volume2 } from 'lucide-react'
import type { SlideAudio } from '@motionslides/shared'

interface Props {
  existingAudio: SlideAudio | null
  onSave: (audio: SlideAudio) => void
  onClose: () => void
}

/**
 * Inline widget to record a voice-over from the microphone or upload an audio file
 * for the currently active slide.
 */
export function VOQuickAdd({ existingAudio, onSave, onClose }: Props) {
  const [mode, setMode] = useState<'idle' | 'recording' | 'uploading'>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadBlob = async (blob: Blob, name: string) => {
    setMode('uploading')
    try {
      const tempUrl = URL.createObjectURL(blob)
      const duration = await new Promise<number>(resolve => {
        const a = new Audio(tempUrl)
        a.addEventListener('loadedmetadata', () => { URL.revokeObjectURL(tempUrl); resolve(a.duration) })
        a.addEventListener('error', () => { URL.revokeObjectURL(tempUrl); resolve(0) })
      })
      const fd = new FormData()
      fd.append('file', blob, name)
      fd.append('duration', duration.toString())
      const res = await fetch('/api/upload/audio', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      onSave({
        id: Math.random().toString(36).substring(7),
        url: data.url,
        fileName: data.fileName,
        duration: data.duration || duration,
        volume: 1,
        loop: false,
        playbackRate: 1,
        trimStart: 0,
        trimEnd: data.duration || duration,
      })
    } catch {
      alert('Upload failed')
    } finally {
      setMode('idle')
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        await uploadBlob(new Blob(chunksRef.current, { type: 'audio/webm' }), 'voiceover.webm')
      }
      mr.start()
      setMode('recording')
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000)
    } catch {
      alert('Could not access microphone.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setMode('uploading')
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  if (mode === 'uploading') {
    return (
      <div className="flex items-center gap-2 text-[11px] text-white/50">
        <Loader2 size={12} className="animate-spin" /> Uploading…
      </div>
    )
  }

  if (mode === 'recording') {
    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-red-400 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {fmt(recordingTime)}
        </span>
        <button
          onClick={stopRecording}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 border border-red-500/40 text-red-300 text-[11px] font-semibold rounded-lg cursor-pointer"
        >
          <Volume2 size={12} /> Stop recording
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {existingAudio && (
        <span className="text-[10px] text-white/30 italic">Replace: {existingAudio.fileName}</span>
      )}
      <button
        onClick={startRecording}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 border border-violet-500/40 text-violet-300 text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-violet-600/30 transition-colors"
      >
        <Mic size={12} /> Record voice
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/60 text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
      >
        <Upload size={12} /> Upload file
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={async e => {
          const f = e.target.files?.[0]
          if (f) await uploadBlob(f, f.name)
        }}
      />
    </div>
  )
}
