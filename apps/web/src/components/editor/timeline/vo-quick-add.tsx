import { useState, useRef, useEffect } from 'react'
import { AudioLines, Loader2, Lock, Mic, Upload, Volume2 } from 'lucide-react'
import type { SlideAudio } from '@motionslides/shared'
import { generateVoiceoverAction, listVoiceoverOptionsAction } from '@/lib/actions/ai-studio'
import {
  CLOUDFLARE_VOICES,
  type VoiceOption,
  type VoiceoverProvider,
} from '@/lib/voiceover-catalog'
import { uploadTimelineAudioFile } from './upload-audio'

interface Props {
  existingAudio: SlideAudio | null
  slideScript?: string
  onSave: (audio: SlideAudio) => void
  onClose: () => void
}

/**
 * Theme-safe widget to generate an AI voiceover, record from the microphone,
 * or upload an audio file for the currently active slide.
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
  const selectedVoice = activeVoices.find(v => v.id === voiceId) ?? activeVoices[0] ?? null
  const isElevenLabsLocked = provider === 'elevenlabs' && !hasElevenLabsKey
  const canGenerate = Boolean(aiText.trim()) && !isElevenLabsLocked && Boolean(selectedVoice)

  useEffect(() => {
    if (mode !== 'ai-form') return
    let ignore = false
    setLoadingCatalog(true)

    listVoiceoverOptionsAction()
      .then(res => {
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
        } catch (err) {
          console.error('[VOQuickAdd Cleanup] Failed to stop recording on unmount:', err)
        }
      }
    }
  }, [])

  const uploadAudioFile = async (file: File) => {
    setError(null)
    setMode('uploading')
    try {
      const uploaded = await uploadTimelineAudioFile(file, { volume: 1, loop: false })
      onSave(uploaded)
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
        const audioFile = new File([audioBlob], 'voiceover.webm', { type: 'audio/webm' })
        await uploadAudioFile(audioFile)
      }

      mediaRecorder.start()
      setMode('recording')
      setRecordingTime(0)
      recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000)
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

  const formatRecTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const readAudioDuration = (url: string, fallback: number) =>
    new Promise<number>(resolve => {
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
      const result = (await generateVoiceoverAction({
        data: { provider, text: aiText, voiceId: selectedVoice.id },
      })) as {
        audioUrl: string
        durationEstimate: number
      }
      const duration = await readAudioDuration(result.audioUrl, result.durationEstimate)
      onSave({
        id: Math.random().toString(36).substring(2, 9),
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
      <div className="flex items-center gap-2 py-2 text-[11px] text-(--ms-text-secondary)">
        <Loader2 size={13} className="animate-spin text-(--ms-accent)" /> Uploading audio…
      </div>
    )
  }

  if (mode === 'generating') {
    return (
      <div className="flex items-center gap-2 py-2 text-[11px] text-(--ms-text-secondary)">
        <Loader2 size={13} className="animate-spin text-(--ms-accent)" /> Generating voiceover…
      </div>
    )
  }

  if (mode === 'recording') {
    return (
      <div className="flex items-center justify-between gap-3 py-1">
        <span className="flex items-center gap-2 text-red-500 dark:text-red-400 text-[12px] font-mono tabular-nums font-medium">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {formatRecTime(recordingTime)}
        </span>
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/12 border border-red-500/40 text-red-600 dark:text-red-300 text-[11px] font-semibold rounded-lg cursor-pointer transition-transform duration-150 active:scale-[0.97]"
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
          className="inline-flex self-start items-center gap-1 rounded-lg border p-0.5"
          style={{
            backgroundColor: 'var(--ms-bg-surface)',
            borderColor: 'var(--ms-tl-border-strong)',
          }}
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
                ? 'bg-(--ms-bg-elevated) text-(--ms-text-primary) shadow-xs'
                : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
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
                ? 'bg-(--ms-bg-elevated) text-(--ms-text-primary) shadow-xs'
                : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
            }`}
          >
            {!hasElevenLabsKey && <Lock size={10} className="text-(--ms-text-muted)" />}
            ElevenLabs
          </button>
        </div>

        <textarea
          value={aiText}
          onChange={e => setAiText(e.target.value)}
          placeholder="Script text for voiceover..."
          className="w-full h-24 rounded-lg border px-2.5 py-2 text-xs text-(--ms-text-primary) bg-(--ms-bg-surface) border-(--ms-tl-border-strong) placeholder:text-(--ms-text-muted) focus:outline-none focus:border-(--ms-accent) resize-none"
        />

        {loadingCatalog && provider === 'elevenlabs' ? (
          <div className="flex items-center gap-2 text-[11px] text-(--ms-text-muted)">
            <Loader2 size={12} className="animate-spin" /> Loading ElevenLabs voices…
          </div>
        ) : isElevenLabsLocked ? (
          <p className="text-[11px] text-(--ms-text-secondary) bg-(--ms-bg-surface) border border-(--ms-tl-border-strong) rounded-lg px-2.5 py-2 m-0">
            Add your ElevenLabs API key in Settings → API Keys to unlock ElevenLabs voices and custom voice clones.
          </p>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <select
              value={selectedVoice?.id ?? ''}
              onChange={e => setVoiceId(e.target.value)}
              className="flex-1 min-w-0 bg-(--ms-bg-surface) border border-(--ms-tl-border-strong) rounded-lg px-2 py-1.5 text-xs text-(--ms-text-primary) focus:outline-none focus:border-(--ms-accent)"
            >
              {activeVoices.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.description}
                  {v.category && v.category !== 'premade' ? ` (${v.category})` : ''}
                </option>
              ))}
            </select>
            <div className="flex gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => { setError(null); setMode('idle') }}
                className="text-[11px] text-(--ms-text-muted) hover:text-(--ms-text-primary) px-2 border-none bg-transparent cursor-pointer transition-transform duration-150 active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canGenerate}
                onClick={handleGenerate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-(--ms-accent) border border-(--ms-accent) text-white text-[11px] font-semibold rounded-lg cursor-pointer transition-[transform,opacity] duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
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
              className="text-[11px] text-(--ms-text-muted) hover:text-(--ms-text-primary) px-2 border-none bg-transparent cursor-pointer transition-transform duration-150 active:scale-[0.97]"
            >
              Cancel
            </button>
          </div>
        )}

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

  return (
    <div className="flex flex-col gap-2.5">
      {existingAudio && (
        <span className="text-[10px] text-(--ms-text-muted) truncate">
          Current: {existingAudio.fileName} (selecting a source will replace it)
        </span>
      )}

      <div
        className="grid grid-cols-3 gap-1 p-1 rounded-xl border"
        style={{
          backgroundColor: 'var(--ms-bg-surface)',
          borderColor: 'var(--ms-tl-border-strong)',
        }}
      >
        <button
          type="button"
          onClick={() => { setError(null); setMode('ai-form') }}
          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-medium text-(--ms-text-primary) bg-transparent hover:bg-(--ms-bg-elevated) border-none cursor-pointer transition-[background-color,transform] duration-150 active:scale-[0.97]"
        >
          <AudioLines size={13} style={{ color: 'var(--ms-tl-vo-accent)' }} />
          <span>AI Voice</span>
        </button>

        <button
          type="button"
          onClick={startRecording}
          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-medium text-(--ms-text-primary) bg-transparent hover:bg-(--ms-bg-elevated) border-none cursor-pointer transition-[background-color,transform] duration-150 active:scale-[0.97]"
        >
          <Mic size={13} className="text-(--ms-text-secondary)" />
          <span>Record</span>
        </button>

        <button
          type="button"
          onClick={() => { setError(null); fileInputRef.current?.click() }}
          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-medium text-(--ms-text-primary) bg-transparent hover:bg-(--ms-bg-elevated) border-none cursor-pointer transition-[background-color,transform] duration-150 active:scale-[0.97]"
        >
          <Upload size={13} className="text-(--ms-text-secondary)" />
          <span>Upload</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={async event => {
          const file = event.target.files?.[0]
          if (file) await uploadAudioFile(file)
        }}
      />

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
