import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Trash2, Upload, Loader2, Play, Pause } from 'lucide-react'
import type { SlideAudio } from '@motionslides/shared'

interface AudioRecorderProps {
  existingAudio?: SlideAudio | null
  onSave: (audio: SlideAudio | null) => void
}

export function AudioRecorder({ existingAudio, onSave }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioUrl = existingAudio?.url || null
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null)
  
  useEffect(() => {
    // Reset and pause preview when audio track changes or unmounts
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause()
        audioPreviewRef.current = null
      }
    }
  }, [audioUrl])

  useEffect(() => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause()
      audioPreviewRef.current = null
      setIsPlaying(false)
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        stream.getTracks().forEach(track => track.stop())
        
        await uploadAudioBlob(audioBlob, 'voiceover.webm')
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const getAudioDuration = (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio(url)
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration)
      })
      audio.addEventListener('error', () => {
        resolve(0)
      })
    })
  }

  const uploadAudioBlob = async (blob: Blob, defaultName: string) => {
    setIsUploading(true)
    try {
      const tempUrl = URL.createObjectURL(blob)
      const duration = await getAudioDuration(tempUrl)
      URL.revokeObjectURL(tempUrl)

      const formData = new FormData()
      formData.append('file', blob, defaultName)
      formData.append('duration', duration.toString())

      const res = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Upload failed')
      }

      const data = await res.json()
      
      const newAudio: SlideAudio = {
        id: Math.random().toString(36).substring(7),
        url: data.url,
        fileName: data.fileName,
        duration: data.duration || duration,
        volume: 1,
        loop: false,
        playbackRate: 1,
        trimStart: 0,
        trimEnd: data.duration || duration,
      }
      
      onSave(newAudio)
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Failed to upload audio asset.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await uploadAudioBlob(file, file.name)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to remove this audio?')) {
      onSave(null)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const togglePlayback = () => {
    if (!audioUrl) return
    
    if (isPlaying) {
      audioPreviewRef.current?.pause()
      setIsPlaying(false)
    } else {
      if (!audioPreviewRef.current) {
        const audio = new Audio(audioUrl)
        audio.addEventListener('ended', () => setIsPlaying(false))
        audioPreviewRef.current = audio
      }
      audioPreviewRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3 bg-(--ms-bg-base)/50 border border-(--ms-border) rounded-lg transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-(--ms-text-primary)">
          Voiceover / Slide Audio
        </span>
        {audioUrl && (
          <button
            onClick={handleDelete}
            className="p-1 text-red-500/80 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors border-none bg-transparent cursor-pointer"
            title="Remove Audio"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {isUploading ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <Loader2 className="animate-spin text-(--ms-accent)" size={24} />
          <span className="text-xs text-(--ms-text-secondary)">Uploading audio file...</span>
        </div>
      ) : isRecording ? (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-red-500">
              {formatTime(recordingTime)}
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-1 px-2.5 rounded-md transition cursor-pointer border-none"
          >
            <Square size={12} fill="white" /> Stop
          </button>
        </div>
      ) : audioUrl ? (
        <div className="flex items-center justify-between bg-(--ms-bg-elevated) border border-(--ms-border) px-3 py-2 rounded-md shadow-sm">
          <div className="flex flex-col min-w-0 flex-1 pr-2">
            <span className="text-xs font-medium text-(--ms-text-primary) truncate">
              {existingAudio?.fileName || 'Audio Track'}
            </span>
            <span className="text-[10px] text-(--ms-text-muted)">
              Duration: {existingAudio?.duration ? `${existingAudio.duration.toFixed(1)}s` : 'Unknown'}
            </span>
          </div>
          <button
            onClick={togglePlayback}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-(--ms-accent) hover:bg-(--ms-accent)/90 text-white transition cursor-pointer border-none shadow-sm"
          >
            {isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" className="ml-0.5" />}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={startRecording}
            className="flex items-center justify-center gap-1.5 bg-(--ms-bg-elevated) hover:bg-(--ms-border) border border-(--ms-border) text-(--ms-text-primary) text-xs font-medium py-2 rounded-md transition cursor-pointer shadow-sm"
          >
            <Mic size={14} className="text-red-500" /> Record Voice
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 bg-(--ms-bg-elevated) hover:bg-(--ms-border) border border-(--ms-border) text-(--ms-text-primary) text-xs font-medium py-2 rounded-md transition cursor-pointer shadow-sm"
          >
            <Upload size={14} className="text-(--ms-accent)" /> Upload File
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}
