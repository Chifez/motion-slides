import { useState, useRef, useEffect } from 'react'
import { Loader2, Lock, Mic, Upload, Volume2, Sparkles } from 'lucide-react'
import type { SlideAudio } from '@motionslides/shared'
import { generateVoiceoverAction, listVoiceoverOptionsAction } from '@/lib/actions/ai-studio'
import {
  CLOUDFLARE_VOICES,
  type VoiceOption,
  type VoiceoverProvider,
} from '@/lib/voiceover-catalog'

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
  const [provider, setProvider] = useState<VoiceoverProvider>('cloudflare')
  const [voiceId, setVoiceId] = useState<string>(CLOUDFLARE_VOICES[0].id)
  const [hasElevenLabsKey, setHasElevenLabsKey] = useState(false)
  const [elevenLabsVoices, setElevenLabsVoices] = useState<VoiceOption[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeVoices = provider === 'cloudflare' ? CLOUDFLARE_VOICES : elevenLabsVoices
  const selectedVoice = activeVoices.find((v) => v.id === voiceId) ?? activeVoices[0] ?? null
  const isElevenLabsLocked = provider === 'elevenlabs' && !hasElevenLabsKey
  const canGenerate = Boolean(aiText.trim()) && !isElevenLabsLocked && Boolean(selectedVoice)

  useEffect(() => {
    if (mode !== 'ai-form') return
    let ignore = false
    setLoadingCatalog(true)

    listVoiceoverOptionsAction()
      .then((res) => {
        if (ignore) return
        setHasElevenLabsKey(res.hasElevenLabsKey)
        setElevenLabsVoices(res.elevenLabsVoices)
      })
      .catch(() => {
        // Default Cloudflare voices remain available even if session/catalog check fails
      })
      .finally(() => {
        if (!ignore) setLoadingCatalog(false)
      })

    return () => {
      ignore = true
    }
  }, [mode])

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
    setError(null)
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
      setError('Audio upload failed. Please try again.')
    } finally {
      setMode('idle')
    }
  }

  const startRecording = async () => {
    setError(null)
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
      setError('Could not access microphone. Check browser permissions.')
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

  const readAudioDuration = (url: string, fallback: number) => new Promise<number>((resolve) => {
    const audio = new Audio(url)
    const finish = (duration: number) => {
      audio.removeAttribute('src')
      audio.load()
      resolve(Number.isFinite(duration) && duration > 0 ? duration : fallback)
    }
    audio.addEventListener('loadedmetadata', () => finish(audio.duration), { once: true })
    audio.addEventListener('error', () => finish(fallback), { once: true })
  })

  const handleGenerate = async () => {
    if (!canGenerate || !selectedVoice) return
    setError(null)
    setMode('generating')
    try {
      const result = await generateVoiceoverAction({
        data: { provider, text: aiText, voiceId: selectedVoice.id },
      }) as {
        audioUrl: string
        durationEstimate: number
      }
      const duration = await readAudioDuration(result.audioUrl, result.durationEstimate)
      onSave({
        id: Math.random().toString(36).substring(7),
        url: result.audioUrl,
        fileName:
          provider === 'elevenlabs'
            ? `ElevenLabs (${selectedVoice.name})`
            : `AI Voice (${selectedVoice.name})`,
        duration,
        volume: 1,
        loop: false,
        playbackRate: 1,
        trimStart: 0,
        trimEnd: duration,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.')
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
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 border border-red-500/40 text-red-300 text-[11px] font-semibold rounded-lg cursor-pointer transition-transform duration-150 active:scale-[0.97]"
        >
          <Volume2 size={12} /> Stop recording
        </button>
      </div>
    )
  }

  if (mode === 'ai-form') {
    return (
      <div className="flex flex-col gap-3">
        <div
          role="tablist"
          aria-label="Voiceover provider"
          className="inline-flex self-start items-center gap-1 rounded-lg border border-white/10 bg-black/30 p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={provider === 'cloudflare'}
            onClick={() => {
              setProvider('cloudflare')
              setVoiceId(CLOUDFLARE_VOICES[0].id)
              setError(null)
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border-none cursor-pointer transition-[transform,background-color,color] duration-150 active:scale-[0.97] ${
              provider === 'cloudflare'
                ? 'bg-white/10 text-white'
                : 'bg-transparent text-white/50 hover:text-white/80'
            }`}
          >
            Cloudflare AI
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={provider === 'elevenlabs'}
            onClick={() => {
              setProvider('elevenlabs')
              setVoiceId(elevenLabsVoices[0]?.id ?? '')
              setError(null)
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border-none cursor-pointer transition-[transform,background-color,color] duration-150 active:scale-[0.97] ${
              provider === 'elevenlabs'
                ? 'bg-white/10 text-white'
                : 'bg-transparent text-white/50 hover:text-white/80'
            }`}
          >
            {!hasElevenLabsKey && <Lock size={10} className="text-white/50" />}
            ElevenLabs
          </button>
        </div>

        <textarea
          value={aiText}
          onChange={e => setAiText(e.target.value)}
          placeholder="Script text for voiceover..."
          className="w-full h-24 bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white resize-none"
        />

        {loadingCatalog && provider === 'elevenlabs' ? (
          <div className="flex items-center gap-2 text-[11px] text-white/50">
            <Loader2 size={12} className="animate-spin" /> Loading ElevenLabs voices…
          </div>
        ) : isElevenLabsLocked ? (
          <p className="text-[11px] text-white/60 bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 m-0">
            Add your ElevenLabs API key in Settings → API Keys to unlock ElevenLabs voices and custom voice clones.
          </p>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <select
              value={selectedVoice?.id ?? ''}
              onChange={e => setVoiceId(e.target.value)}
              className="flex-1 min-w-0 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/20"
            >
              {activeVoices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.description}
                  {v.category && v.category !== 'premade' ? ` (${v.category})` : ''}
                </option>
              ))}
            </select>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => { setError(null); setMode('idle') }}
                className="text-[11px] text-white/50 hover:text-white px-2 border-none bg-transparent cursor-pointer transition-transform duration-150 active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canGenerate}
                onClick={handleGenerate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 border border-blue-500 text-white text-[11px] font-semibold rounded-lg cursor-pointer transition-[transform,opacity] duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Generate
              </button>
            </div>
          </div>
        )}

        {isElevenLabsLocked && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => { setError(null); setMode('idle') }}
              className="text-[11px] text-white/50 hover:text-white px-2 border-none bg-transparent cursor-pointer transition-transform duration-150 active:scale-[0.97]"
            >
              Cancel
            </button>
          </div>
        )}

        {error && <p role="alert" className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-md px-2 py-1.5">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        {existingAudio && (
          <span className="text-[10px] text-white/30 italic">Replace: {existingAudio.fileName}</span>
        )}
        <button
          onClick={() => { setError(null); setMode('ai-form') }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/40 text-blue-300 text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-blue-600/30 transition-[transform,background-color] duration-150 active:scale-[0.97]"
        >
          <Sparkles size={12} /> Generate AI
        </button>
        <button
          onClick={startRecording}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 border border-violet-500/40 text-violet-300 text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-violet-600/30 transition-[transform,background-color] duration-150 active:scale-[0.97]"
        >
          <Mic size={12} /> Record voice
        </button>
        <button
          onClick={() => { setError(null); fileInputRef.current?.click() }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/60 text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-white/10 transition-[transform,background-color] duration-150 active:scale-[0.97]"
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
      {error && <p role="alert" className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-md px-2 py-1.5">{error}</p>}
    </div>
  )
}
