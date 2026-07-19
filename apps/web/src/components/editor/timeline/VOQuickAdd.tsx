import { useState, useRef, useEffect } from 'react'
import { Loader2, Mic, Upload, Volume2, Sparkles } from 'lucide-react'
import type { SlideAudio } from '@motionslides/shared'
import { generateVoiceoverAction } from '@/lib/actions/ai-studio'

interface Props {
  existingAudio: SlideAudio | null
  slideScript?: string
  onSave: (audio: SlideAudio) => void
  onClose: () => void
}

/**
 * Inline widget to record a voice-over from the microphone or upload an audio file
 * for the currently active slide.
 */
export function VOQuickAdd({ existingAudio, slideScript, onSave, onClose }: Props) {
  const [mode, setMode] = useState<'idle' | 'recording' | 'uploading' | 'ai-form' | 'generating'>('idle')
  const [aiText, setAiText] = useState(slideScript || '')
  const [voiceId, setVoiceId] = useState('rachel')
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      const mediaRecorder = mediaRecorderRef.current
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try {
          if (mediaRecorder.stream) {
            mediaRecorder.stream.getTracks().forEach(streamTrack => streamTrack.stop())
          }
          mediaRecorder.stop()
        } catch (error) {
          console.error('[VOQuickAdd Cleanup] Failed to stop recording on unmount:', error)
        }
      }
    }
  }, [])

  const uploadBlob = async (blob: Blob, name: string) => {
    setMode('uploading')
    try {
      const objectUrl = URL.createObjectURL(blob)
      const duration = await new Promise<number>(resolve => {
        const audio = new Audio(objectUrl)
        audio.addEventListener('loadedmetadata', () => {
          URL.revokeObjectURL(objectUrl)
          resolve(audio.duration)
        })
        audio.addEventListener('error', () => {
          URL.revokeObjectURL(objectUrl)
          resolve(0)
        })
      })
      
      const formData = new FormData()
      formData.append('file', blob, name)
      formData.append('duration', duration.toString())
      
      const response = await fetch('/api/upload/audio', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Upload failed')
      
      const uploadResult = await response.json()
      onSave({
        id: Math.random().toString(36).substring(7),
        url: uploadResult.url,
        fileName: uploadResult.fileName,
        duration: uploadResult.duration || duration,
        volume: 1,
        loop: false,
        playbackRate: 1,
        trimStart: 0,
        trimEnd: uploadResult.duration || duration,
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
      recordedChunksRef.current = []
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(streamTrack => streamTrack.stop())
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        await uploadBlob(audioBlob, 'voiceover.webm')
      }
      
      mediaRecorder.start()
      setMode('recording')
      setRecordingTime(0)
      recordingIntervalRef.current = setInterval(() => setRecordingTime(prevTime => prevTime + 1), 1000)
    } catch {
      alert('Could not access microphone.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    setMode('uploading')
  }

  const formatTime = (seconds: number) => {
    const minutesString = Math.floor(seconds / 60).toString().padStart(2, '0')
    const secondsString = (seconds % 60).toString().padStart(2, '0')
    return `${minutesString}:${secondsString}`
  }

  const handleGenerate = async () => {
    if (!aiText.trim()) return
    setMode('generating')
    try {
      const result = await generateVoiceoverAction({ data: { text: aiText, voiceId, settings: {} } })
      onSave({
        id: Math.random().toString(36).substring(7),
        url: result.audioUrl || '/placeholder-audio.mp3',
        fileName: `AI Voice (${voiceId})`,
        duration: 3.5,
        volume: 1,
        loop: false,
        playbackRate: 1,
        trimStart: 0,
        trimEnd: 3.5,
      })
      onClose()
    } catch (e) {
      alert('Generation failed')
      setMode('ai-form')
    }
  }

  if (mode === 'uploading') {
    return (
      <div className="flex items-center gap-2 text-[11px] text-white/50">
        <Loader2 size={12} className="animate-spin" /> Uploading…
      </div>
    )
  }

  if (mode === 'generating') {
    return (
      <div className="flex items-center gap-2 text-[11px] text-white/50">
        <Loader2 size={12} className="animate-spin" /> Generating AI Voice...
      </div>
    )
  }

  if (mode === 'recording') {
    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-red-400 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {formatTime(recordingTime)}
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

  if (mode === 'ai-form') {
    return (
      <div className="flex flex-col gap-3">
        <textarea
          value={aiText}
          onChange={e => setAiText(e.target.value)}
          placeholder="Script text for voiceover..."
          className="w-full h-24 bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white resize-none"
        />
        <div className="flex items-center justify-between">
          <select 
            value={voiceId} 
            onChange={e => setVoiceId(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-white/20"
          >
            <option value="rachel">Rachel</option>
            <option value="antoni">Antoni</option>
            <option value="bella">Bella</option>
          </select>
          <div className="flex gap-2">
            <button onClick={() => setMode('idle')} className="text-[11px] text-white/50 hover:text-white px-2 border-none bg-transparent cursor-pointer">Cancel</button>
            <button onClick={handleGenerate} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 border border-blue-500 text-white text-[11px] font-semibold rounded-lg cursor-pointer">
              Generate
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {existingAudio && (
        <span className="text-[10px] text-white/30 italic">Replace: {existingAudio.fileName}</span>
      )}
      <button
        onClick={() => setMode('ai-form')}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/40 text-blue-300 text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-blue-600/30 transition-colors"
      >
        <Sparkles size={12} /> Generate AI
      </button>
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
        onChange={async event => {
          const file = event.target.files?.[0]
          if (file) await uploadBlob(file, file.name)
        }}
      />
    </div>
  )
}
