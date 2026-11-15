import { useRef, useState, useEffect, type FormEvent, type ChangeEvent, type DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Square, Mic, ChevronsUpDown, Check, Paperclip, FileText, X, Loader2 } from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'
import { transcribeAudioAction } from '@/lib/actions/ai-studio'
import { buildDocumentPrompt, DocumentExtractionError, extractDocumentContent, type ExtractedDocument } from '@/lib/generation/doc-extractor'

interface ModelDef {
  id: string
  label: string
  provider: 'cloud' | 'local'
  desc: string
}

const MODELS: ModelDef[] = [
  { id: 'gpt-4o',            label: 'GPT-4o',            provider: 'cloud', desc: 'Fast and capable' },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'cloud', desc: 'Deep reasoning' },
  { id: 'llama3.2',          label: 'Llama 3.3 / 3.2',   provider: 'local', desc: 'Fast, open source' },
  { id: 'qwen2.5',           label: 'Qwen 2.5',          provider: 'local', desc: 'Code and diagrams' },
  { id: 'mistral',           label: 'Mistral 7B',        provider: 'local', desc: 'Open source' },
]

const MODEL_GROUPS: Array<{ title: string; provider: ModelDef['provider'] }> = [
  { title: 'Cloud', provider: 'cloud' },
  { title: 'Open source (Groq / Ollama)', provider: 'local' },
]

interface Props {
  input: string
  isLoading: boolean
  selectedModel: string
  onInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>, message: string) => void
  onStop: () => void
}

interface AttachedFileState {
  doc: ExtractedDocument
  fileSize: string
}

type VoiceInputState = 'idle' | 'requesting-permission' | 'recording' | 'transcribing'

export function AgentInput({ input, isLoading, selectedModel, onInputChange, onSubmit, onStop }: Props) {
  const setSelectedModel = useEditorStore((s) => s.setSelectedModel)
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [voiceInputState, setVoiceInputState] = useState<VoiceInputState>('idle')
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const isRecording = voiceInputState === 'recording'
  const isTranscribing = voiceInputState === 'transcribing'
  const [isDragging, setIsDragging] = useState(false)
  const [attachedFile, setAttachedFile] = useState<AttachedFileState | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const activeModel = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0]
  const activeSlideNumber = useEditorStore((s) => s.activeSlideIndex) + 1
  const canSubmit = Boolean(input.trim()) || Boolean(attachedFile)

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
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 44), 168)}px`
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
    setFileError(null)
    try {
      const doc = await extractDocumentContent(file)
      setAttachedFile({
        doc,
        fileSize: formatFileSize(file.size),
      })
    } catch (err) {
      console.error('[Agent] Document extraction error:', err)
      setAttachedFile(null)
      setFileError(err instanceof DocumentExtractionError ? err.message : 'Could not read that file. Please try a different document.')
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
      setVoiceInputState('transcribing')
      return
    }

    if (voiceInputState !== 'idle') return
    setVoiceInputState('requesting-permission')

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
          setVoiceInputState('idle')
          stream.getTracks().forEach((track) => track.stop())
        }
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setRecordingSeconds(0)
      setVoiceInputState('recording')

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('[Agent] Microphone error:', err)
      setVoiceInputState('idle')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      // Typing ahead while the agent works is fine; submitting is not.
      if (isLoading) return
      const form = textareaRef.current?.closest('form')
      form?.requestSubmit()
    }
  }

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (isLoading) {
      e.preventDefault()
      return
    }
    let message = input.trim()
    if (attachedFile) {
      message = buildDocumentPrompt(attachedFile.doc, message)
      setAttachedFile(null)
      setFileError(null)
    }
    onSubmit(e, message)
  }

  return (
    <div className="shrink-0 px-3 pt-1 pb-2.5">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.mdown,.txt,.json,.yaml,.yml,.pdf,.docx,.ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.sql,.sh,.css,.html"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <form onSubmit={handleFormSubmit}>
        {/*
          Composer surface. Border is a hairline at rest and brightens on hover; the accent
          appears only as a focus ring (the one place the user's attention should be).
          No drop shadow: this is docked chrome, not a floating card.
        */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-xl border bg-(--ms-bg-elevated) transition-[border-color,box-shadow] duration-150 ${
            isDragging
              ? 'border-(--ms-accent)'
              : 'border-(--ms-border-strong) focus-within:border-(--ms-accent)/60 focus-within:ring-3 focus-within:ring-(--ms-accent)/15'
          }`}
        >
          {/* Recording */}
          <AnimatePresence initial={false}>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className="flex h-8 items-center justify-between border-b border-(--ms-border) px-3 text-xs select-none">
                  <span className="flex items-center gap-2 text-(--ms-text-secondary)">
                    <span className="size-1.5 animate-pulse rounded-full bg-rose-500" />
                    Recording
                    <span className="tabular-nums text-(--ms-text-muted)">{formatTimer(recordingSeconds)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className="ms-focus-ring cursor-pointer rounded border-none bg-transparent px-1 text-xs font-medium text-(--ms-text-primary) hover:underline"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcribing */}
          <AnimatePresence initial={false}>
            {isTranscribing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className="flex h-8 items-center gap-2 border-b border-(--ms-border) px-3 text-xs text-(--ms-text-secondary) select-none">
                  <Loader2 size={12} className="animate-spin text-(--ms-text-muted)" />
                  Transcribing
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drop target */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed border-(--ms-accent) bg-(--ms-bg-elevated)/90 backdrop-blur-sm"
              >
                <p className="text-[13px] leading-5 font-medium text-(--ms-text-primary)">Drop to attach</p>
                <p className="text-[11px] leading-4 text-(--ms-text-muted)">Markdown, PDF, DOCX, YAML, JSON, code</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attachment */}
          <AnimatePresence initial={false}>
            {attachedFile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 px-2.5 pt-2.5">
                  <div className="flex min-w-0 items-center gap-1.5 rounded-md border border-(--ms-border) bg-(--ms-bg-surface) py-1 pr-2 pl-1.5 text-xs leading-4">
                    <FileText size={12} className="shrink-0 text-(--ms-text-muted)" />
                    <span className="truncate text-(--ms-text-primary)">{attachedFile.doc.fileName}</span>
                    <span className="shrink-0 tabular-nums text-(--ms-text-muted)">{attachedFile.fileSize}</span>
                    {attachedFile.doc.extraction.truncated && <span className="shrink-0 text-amber-500">Excerpt</span>}
                    {attachedFile.doc.extraction.warnings.length > 0 && (
                      <span className="shrink-0 text-amber-500" title={attachedFile.doc.extraction.warnings.join(' ')}>
                        Warning
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    aria-label="Remove attachment"
                    className="ms-focus-ring flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-(--ms-text-muted) transition-colors duration-150 hover:bg-(--ms-bg-surface) hover:text-(--ms-text-primary)"
                  >
                    <X size={12} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {fileError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <p role="alert" className="px-3 pt-2.5 text-xs leading-4 text-rose-400">
                  {fileError}
                </p>
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
                  ? 'Listening…'
                  : attachedFile
                    ? 'Add instructions, or send to synthesize a deck'
                    : 'Ask Copilot to edit this deck…'
            }
            rows={1}
            aria-label="Message Copilot"
            className="custom-scrollbar block min-h-11 w-full resize-none border-none bg-transparent px-3 pt-2.5 pb-1 text-[13px] leading-5 tracking-[-0.006em] text-(--ms-text-primary) outline-none placeholder:text-(--ms-text-muted) disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isTranscribing}
          />

          <div className="flex items-center justify-between px-1.5 pt-0.5 pb-1.5">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach a document"
                title="Attach a document"
                className="ms-focus-ring flex size-7 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-(--ms-text-muted) transition-[transform,background-color,color] duration-150 hover:bg-(--ms-bg-surface) hover:text-(--ms-text-primary) active:scale-[0.95]"
              >
                <Paperclip size={14} />
              </button>

              <button
                type="button"
                onClick={toggleRecording}
                disabled={voiceInputState === 'requesting-permission' || isTranscribing}
                aria-label={isRecording ? 'Stop recording' : 'Dictate'}
                title={isRecording ? 'Stop recording' : 'Dictate'}
                className={`ms-focus-ring flex size-7 cursor-pointer items-center justify-center rounded-md border-none transition-[transform,background-color,color] duration-150 active:scale-[0.95] disabled:cursor-wait disabled:opacity-60 ${
                  isRecording
                    ? 'bg-rose-500/15 text-rose-400'
                    : 'bg-transparent text-(--ms-text-muted) hover:bg-(--ms-bg-surface) hover:text-(--ms-text-primary)'
                }`}
              >
                <Mic size={14} />
              </button>

              <div className="relative ml-1" ref={modelMenuRef} onKeyDown={(e) => e.key === 'Escape' && setShowModelMenu(false)}>
                <button
                  type="button"
                  onClick={() => setShowModelMenu((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={showModelMenu}
                  className={`ms-focus-ring flex h-7 cursor-pointer items-center gap-1 rounded-md border-none px-2 text-xs transition-colors duration-150 ${
                    showModelMenu
                      ? 'bg-(--ms-bg-surface) text-(--ms-text-primary)'
                      : 'bg-transparent text-(--ms-text-muted) hover:bg-(--ms-bg-surface) hover:text-(--ms-text-primary)'
                  }`}
                >
                  <span>{activeModel.label}</span>
                  <ChevronsUpDown size={11} />
                </button>

                {showModelMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
                    <div
                      role="listbox"
                      className="custom-scrollbar absolute bottom-full left-0 z-50 mb-1.5 max-h-80 w-60 origin-bottom-left animate-[ms-pop-in_140ms_var(--ms-ease-out)] overflow-y-auto rounded-lg border border-(--ms-border-strong) bg-(--ms-bg-elevated) p-1 shadow-2xl"
                    >
                      {MODEL_GROUPS.map((group, groupIndex) => (
                        <div key={group.provider} className={groupIndex > 0 ? 'mt-1 border-t border-(--ms-border) pt-1' : ''}>
                          <p className="px-2 pt-1.5 pb-1 text-[11px] leading-4 font-medium text-(--ms-text-muted)">{group.title}</p>
                          {MODELS.filter((m) => m.provider === group.provider).map((m) => {
                            const isSelected = selectedModel === m.id
                            return (
                              <button
                                key={m.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setSelectedModel(m.id)
                                  setShowModelMenu(false)
                                }}
                                className="ms-focus-ring flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border-none bg-transparent px-2 py-1.5 text-left transition-colors duration-150 hover:bg-(--ms-bg-surface)"
                              >
                                <span className="flex min-w-0 flex-col">
                                  <span className="text-xs leading-4 text-(--ms-text-primary)">{m.label}</span>
                                  <span className="text-[11px] leading-4 text-(--ms-text-muted)">{m.desc}</span>
                                </span>
                                {isSelected && <Check size={12} className="shrink-0 text-(--ms-text-primary)" />}
                              </button>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="Stop generating"
                title="Stop generating"
                className="ms-focus-ring flex size-7 cursor-pointer items-center justify-center rounded-lg border-none bg-(--ms-text-primary) text-(--ms-bg-base) transition-transform duration-150 active:scale-[0.95]"
              >
                <Square size={10} fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canSubmit}
                aria-label="Send message"
                title="Send (Enter)"
                className={`ms-focus-ring flex size-7 items-center justify-center rounded-lg border-none transition-[transform,background-color,color,opacity] duration-150 ${
                  canSubmit
                    ? 'cursor-pointer bg-(--ms-accent) text-white hover:brightness-110 active:scale-[0.95]'
                    : 'cursor-not-allowed bg-(--ms-bg-surface) text-(--ms-text-muted)'
                }`}
              >
                <ArrowUp size={14} strokeWidth={2.25} />
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="flex items-center justify-between px-1 pt-1.5 text-[11px] leading-4 text-(--ms-text-muted) select-none">
        <span>Editing slide {activeSlideNumber}</span>
        <span className="hidden sm:inline">
          <kbd className="font-sans">↵</kbd> send · <kbd className="font-sans">⇧↵</kbd> new line
        </span>
      </div>
    </div>
  )
}
