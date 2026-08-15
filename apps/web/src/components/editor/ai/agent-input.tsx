import { useRef, useState, useEffect, type FormEvent, type ChangeEvent, type DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Square, Mic, ChevronDown, BrainCircuit, Bot, Cpu, Paperclip, FileText, X, UploadCloud, Loader2 } from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'
import { transcribeAudioAction } from '@/lib/actions/ai-studio'
import { extractDocumentContent, type ExtractedDocument } from '@/lib/generation/doc-extractor'

interface ModelDef {
  id: string
  label: string
  provider: 'openai' | 'anthropic' | 'ollama'
  desc: string
  icon: React.ElementType
}

const MODELS: ModelDef[] = [
  { id: 'gpt-4o',             label: 'GPT-4o',             provider: 'openai',    desc: 'Fast & Smart',       icon: BrainCircuit },
  { id: 'claude-3-5-sonnet',  label: 'Claude 3.5 Sonnet',  provider: 'anthropic', desc: 'Deep Reasoning',     icon: Bot },
  { id: 'llama3.2',           label: 'Llama 3.2',          provider: 'ollama',    desc: '100% Local',         icon: Cpu },
  { id: 'mistral',            label: 'Mistral 7B',          provider: 'ollama',    desc: '100% Local',         icon: Cpu },
  { id: 'qwen2.5',            label: 'Qwen 2.5',           provider: 'ollama',    desc: '100% Local',         icon: Cpu },
]

const PROVIDER_COLORS: Record<string, string> = {
  openai:    'text-blue-400',
  anthropic: 'text-orange-400',
  ollama:    'text-emerald-400',
}

interface Props {
  input: string
  isLoading: boolean
  selectedModel: string
  onInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  onStop: () => void
}

interface AttachedFileState {
  doc: ExtractedDocument
  fileSize: string
}

export function AgentInput({ input, isLoading, selectedModel, onInputChange, onSubmit, onStop }: Props) {
  const setSelectedModel = useEditorStore((s) => s.setSelectedModel)
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [attachedFile, setAttachedFile] = useState<AttachedFileState | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const activeModel = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0]
  const ActiveIcon = activeModel.icon

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [])

  // Auto-resize textarea smoothly with content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 68), 160)}px`
    }
  }, [input])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatTimer = (secs: number): string => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins}:${String(rem).padStart(2, '0')}`
  }

  const handleFileProcess = async (file: File) => {
    try {
      const doc = await extractDocumentContent(file)
      setAttachedFile({
        doc,
        fileSize: formatFileSize(file.size),
      })
    } catch (err) {
      console.error('[Agent] Document extraction error:', err)
    }
  }

  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFileProcess(file)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      await handleFileProcess(file)
    }
  }

  const toggleRecording = async () => {
    if (isRecording) {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      setIsTranscribing(true)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', new File([audioBlob], 'audio.webm', { type: 'audio/webm' }))
        try {
          const { text } = await transcribeAudioAction({ data: formData })
          if (text) {
            const fakeEvent = { target: { value: input ? `${input} ${text}` : text } } as ChangeEvent<HTMLTextAreaElement>
            onInputChange(fakeEvent)
          }
        } catch (err) {
          console.error('[Agent] Transcription error:', err)
        } finally {
          setIsTranscribing(false)
          stream.getTracks().forEach((track) => track.stop())
        }
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setRecordingSeconds(0)
      setIsRecording(true)

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('[Agent] Microphone error:', err)
      setIsRecording(false)
      setIsTranscribing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = textareaRef.current?.closest('form')
      form?.requestSubmit()
    }
  }

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (attachedFile) {
      const docHeader = `Attached document:\n\`\`\`${attachedFile.doc.fileType}\n${attachedFile.doc.summaryBriefing}\n\`\`\`\n\n`
      const combinedText = input.trim()
        ? `${input.trim()}\n\n${docHeader}`
        : `Please synthesize a comprehensive presentation deck based on this document:\n\n${docHeader}`
      
      const fakeEvent = { target: { value: combinedText } } as ChangeEvent<HTMLTextAreaElement>
      onInputChange(fakeEvent)
      setAttachedFile(null)
    }
    onSubmit(e)
  }

  return (
    <div className="shrink-0 p-3 pt-0 bg-transparent">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,.json,.yaml,.yml,.pdf,.docx,.ts,.tsx,.py,.go,.rs,.sql"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <form onSubmit={handleFormSubmit}>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative bg-(--ms-bg-elevated) border rounded-2xl transition-all duration-150 shadow-lg overflow-hidden ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-(--ms-border) hover:border-(--ms-border-strong) focus-within:border-blue-500/50'
          }`}
        >
          {/* Live Recording Active Banner */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-3 py-1.5 flex items-center justify-between bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-semibold text-[11px]">Recording Voice</span>
                  <span className="font-mono text-[11px] bg-red-500/20 px-1.5 py-0.5 rounded font-bold">
                    {formatTimer(recordingSeconds)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className="text-[10.5px] font-medium text-red-400 hover:text-red-300 underline cursor-pointer bg-transparent border-none p-0"
                >
                  Done Recording
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcribing Audio State Banner */}
          <AnimatePresence>
            {isTranscribing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-3 py-1.5 flex items-center gap-2 bg-blue-500/10 border-b border-blue-500/20 text-blue-400 text-xs select-none"
              >
                <Loader2 size={12} className="animate-spin text-blue-400 shrink-0" />
                <span className="font-medium text-[11px]">Transcribing voice audio with Whisper…</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drag & drop overlay */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-blue-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-1 text-blue-300 pointer-events-none"
              >
                <UploadCloud size={22} className="animate-bounce text-blue-400" />
                <p className="text-xs font-semibold">Drop file to synthesize slides</p>
                <p className="text-[10px] text-blue-300/70">Markdown, PDF, OpenAPI YAML, JSON, Code</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attached File Chip */}
          <AnimatePresence>
            {attachedFile && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                className="px-3 pt-2.5 pb-1 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 max-w-[85%] truncate">
                  <FileText size={12} className="text-blue-400 shrink-0" />
                  <span className="font-medium truncate">{attachedFile.doc.fileName}</span>
                  <span className="text-[10px] text-blue-400/60 shrink-0">({attachedFile.fileSize})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="p-1 rounded-md text-(--ms-text-muted) hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer border-none bg-transparent"
                  title="Remove attachment"
                >
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isTranscribing
                ? 'Transcribing your voice…'
                : isRecording
                ? 'Listening to audio input…'
                : attachedFile
                ? `Synthesize "${attachedFile.doc.title}" or specify layout details…`
                : 'Ask copilot to create slides, choreograph flows, or drop a spec doc…'
            }
            rows={3}
            className="w-full bg-transparent border-none px-3.5 pt-3 pb-2 text-xs text-(--ms-text-primary) placeholder:text-(--ms-text-muted) resize-none focus:outline-none custom-scrollbar font-medium leading-relaxed min-h-[68px]"
            disabled={isLoading || isTranscribing}
          />

          <div className="flex items-center justify-between px-2.5 pb-2">
            {/* Left: file upload + mic + model selector */}
            <div className="flex items-center gap-1">
              {/* Paperclip / File Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-bg-surface) bg-transparent transition-all duration-150 active:scale-[0.95] cursor-pointer border-none"
                title="Attach Document (.md, .pdf, .yaml, .json, code)"
              >
                <Paperclip size={14} />
              </button>

              {/* Voice Button */}
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isTranscribing}
                className={`p-1.5 rounded-lg transition-all duration-150 active:scale-[0.95] cursor-pointer border-none flex items-center gap-1 ${
                  isRecording
                    ? 'text-red-400 bg-red-500/15 border border-red-500/30'
                    : isTranscribing
                    ? 'text-blue-400 bg-blue-500/15 cursor-wait'
                    : 'text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-bg-surface) bg-transparent'
                }`}
                title={isRecording ? 'Stop recording (Click to finish)' : isTranscribing ? 'Transcribing...' : 'Voice input'}
              >
                {isTranscribing ? (
                  <Loader2 size={14} className="animate-spin text-blue-400" />
                ) : (
                  <>
                    <Mic size={14} className={isRecording ? 'text-red-400' : ''} />
                    {isRecording && (
                      <span className="text-[10px] font-mono font-semibold text-red-400 pr-0.5">
                        {formatTimer(recordingSeconds)}
                      </span>
                    )}
                  </>
                )}
              </button>

              <div className="w-px h-3.5 bg-(--ms-border) mx-0.5" />

              {/* Model picker */}
              <div className="relative" ref={modelMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowModelMenu((v) => !v)}
                  className={`flex items-center gap-1 px-1.5 py-1 rounded-md transition-all duration-150 active:scale-[0.97] cursor-pointer text-[10px] font-medium ${
                    showModelMenu
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary) border border-transparent hover:border-(--ms-border)'
                  }`}
                >
                  <ActiveIcon size={11} className={PROVIDER_COLORS[activeModel.provider]} />
                  <span>{activeModel.label}</span>
                  <ChevronDown size={9} className={`transition-transform duration-150 ${showModelMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showModelMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      className="absolute bottom-full left-0 mb-1.5 w-56 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl shadow-2xl z-50 overflow-hidden p-1"
                    >
                      <p className="text-[8px] text-(--ms-text-muted) font-bold uppercase tracking-wider px-2.5 pt-1.5 pb-1">Cloud Models</p>
                      {MODELS.filter((m) => m.provider !== 'ollama').map((m) => {
                        const Icon = m.icon
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setSelectedModel(m.id); setShowModelMenu(false) }}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 active:scale-[0.98] cursor-pointer border-none ${
                              selectedModel === m.id ? 'bg-blue-600/15 text-blue-400' : 'bg-transparent text-(--ms-text-secondary) hover:bg-(--ms-bg-surface) hover:text-(--ms-text-primary)'
                            }`}
                          >
                            <Icon size={13} className={PROVIDER_COLORS[m.provider]} />
                            <div>
                              <p className="text-xs font-medium leading-none">{m.label}</p>
                              <p className="text-[9px] text-(--ms-text-muted) mt-0.5">{m.desc}</p>
                            </div>
                          </button>
                        )
                      })}

                      <p className="text-[8px] text-(--ms-text-muted) font-bold uppercase tracking-wider px-2.5 pt-2 pb-1">Local (Ollama)</p>
                      {MODELS.filter((m) => m.provider === 'ollama').map((m) => {
                        const Icon = m.icon
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setSelectedModel(m.id); setShowModelMenu(false) }}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 active:scale-[0.98] cursor-pointer border-none ${
                              selectedModel === m.id ? 'bg-emerald-600/15 text-emerald-400' : 'bg-transparent text-(--ms-text-secondary) hover:bg-(--ms-bg-surface) hover:text-(--ms-text-primary)'
                            }`}
                          >
                            <Icon size={13} className={PROVIDER_COLORS[m.provider]} />
                            <div>
                              <p className="text-xs font-medium leading-none">{m.label}</p>
                              <p className="text-[9px] text-(--ms-text-muted) mt-0.5">{m.desc}</p>
                            </div>
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right: Submit / Stop */}
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="w-7 h-7 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition-all duration-150 active:scale-[0.95] cursor-pointer"
                title="Stop response"
              >
                <Square size={11} fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && !attachedFile}
                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer border-none shadow-md ${
                  !input.trim() && !attachedFile
                    ? 'bg-(--ms-border) text-(--ms-text-muted) cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.95] shadow-blue-600/20'
                }`}
                title="Send message (Enter)"
              >
                <ArrowUp size={13} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
