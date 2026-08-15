import { useRef, useState, type FormEvent, type ChangeEvent, type DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Square, Mic, ChevronDown, BrainCircuit, Bot, Cpu, Paperclip, FileText, X, UploadCloud } from 'lucide-react'
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
  const [isDragging, setIsDragging] = useState(false)
  const [attachedFile, setAttachedFile] = useState<AttachedFileState | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const activeModel = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0]
  const ActiveIcon = activeModel.icon

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
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
        }
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      console.error('[Agent] Microphone error:', err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      const form = textareaRef.current?.closest('form')
      form?.requestSubmit()
    }
  }

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (attachedFile) {
      // Prepend document context to the input
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
    <div className="shrink-0 border-t border-(--ms-border) p-3 space-y-2 bg-(--ms-bg-base)">
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
          className={`relative bg-(--ms-bg-elevated) border rounded-2xl transition-colors shadow-lg ${
            isDragging
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-(--ms-border) focus-within:border-purple-500/50'
          }`}
        >
          {/* Drag & drop overlay */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 rounded-2xl bg-purple-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 text-purple-300 pointer-events-none"
              >
                <UploadCloud size={24} className="animate-bounce text-purple-400" />
                <p className="text-xs font-semibold">Drop document or code file to synthesize slides</p>
                <p className="text-[10px] opacity-70">Markdown, PDF, OpenAPI YAML, JSON, Code</p>
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
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 max-w-[85%] truncate">
                  <FileText size={13} className="text-purple-400 shrink-0" />
                  <span className="font-semibold truncate">{attachedFile.doc.fileName}</span>
                  <span className="text-[10px] text-purple-400/60 shrink-0">({attachedFile.fileSize})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="p-1 rounded-md text-(--ms-text-muted) hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer border-none bg-transparent"
                  title="Remove attachment"
                >
                  <X size={13} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            placeholder={attachedFile ? `Ask me to synthesize "${attachedFile.doc.title}" or specify layout details…` : "Ask me to create slides, add animations, set transitions, or drop a document…"}
            rows={3}
            className="w-full bg-transparent border-none p-3.5 text-sm text-(--ms-text-primary) placeholder-(--ms-text-muted) resize-none focus:outline-none scrollbar-hide font-medium leading-relaxed"
            disabled={isLoading}
          />

          <div className="flex items-center justify-between p-2 pt-0 border-t border-(--ms-border)/30">
            {/* Left: file upload + mic + model selector */}
            <div className="flex items-center gap-1">
              {/* Paperclip / File Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg text-(--ms-text-muted) hover:text-purple-400 hover:bg-purple-500/10 bg-transparent transition cursor-pointer border-none"
                title="Attach Document (.md, .pdf, .yaml, .json, code)"
              >
                <Paperclip size={15} />
              </button>

              {/* Voice */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 rounded-lg transition cursor-pointer border-none ${
                  isRecording
                    ? 'text-red-400 bg-red-500/10 animate-pulse'
                    : 'text-(--ms-text-muted) hover:text-purple-400 hover:bg-purple-500/10 bg-transparent'
                }`}
                title="Voice input"
              >
                <Mic size={15} />
              </button>

              <div className="w-px h-4 bg-(--ms-border)/50 mx-0.5" />

              {/* Model picker */}
              <div className="relative" ref={modelMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowModelMenu((v) => !v)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition cursor-pointer text-[9px] font-black uppercase tracking-widest ${
                    showModelMenu
                      ? 'bg-purple-600/10 border-purple-500/50 text-purple-400'
                      : 'bg-transparent border-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
                  }`}
                >
                  <ActiveIcon size={11} className={PROVIDER_COLORS[activeModel.provider]} />
                  <span>{activeModel.label}</span>
                  <ChevronDown size={9} className={`transition-transform duration-200 ${showModelMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showModelMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      className="absolute bottom-full left-0 mb-2 w-60 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl shadow-2xl z-50 overflow-hidden p-1"
                    >
                      {/* Cloud models */}
                      <p className="text-[8px] text-(--ms-text-muted) font-black uppercase tracking-widest px-3 pt-2 pb-1">Cloud Models</p>
                      {MODELS.filter((m) => m.provider !== 'ollama').map((m) => {
                        const Icon = m.icon
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setSelectedModel(m.id); setShowModelMenu(false) }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition cursor-pointer border-none ${
                              selectedModel === m.id ? 'bg-purple-600/10 text-purple-400' : 'bg-transparent text-(--ms-text-secondary) hover:bg-(--ms-border)/50'
                            }`}
                          >
                            <Icon size={16} className={PROVIDER_COLORS[m.provider]} />
                            <div>
                              <p className="text-xs font-bold leading-none">{m.label}</p>
                              <p className="text-[10px] opacity-50 mt-0.5">{m.desc}</p>
                            </div>
                          </button>
                        )
                      })}

                      {/* Local models */}
                      <p className="text-[8px] text-(--ms-text-muted) font-black uppercase tracking-widest px-3 pt-3 pb-1">Local (Ollama)</p>
                      {MODELS.filter((m) => m.provider === 'ollama').map((m) => {
                        const Icon = m.icon
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setSelectedModel(m.id); setShowModelMenu(false) }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition cursor-pointer border-none ${
                              selectedModel === m.id ? 'bg-emerald-600/10 text-emerald-400' : 'bg-transparent text-(--ms-text-secondary) hover:bg-(--ms-border)/50'
                            }`}
                          >
                            <Icon size={16} className={PROVIDER_COLORS[m.provider]} />
                            <div>
                              <p className="text-xs font-bold leading-none">{m.label}</p>
                              <p className="text-[10px] opacity-50 mt-0.5">{m.desc}</p>
                            </div>
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right: Send / Stop */}
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="p-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition cursor-pointer"
                title="Stop generation"
              >
                <Square size={16} fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && !attachedFile}
                className={`p-2 rounded-xl transition cursor-pointer border-none shadow-lg ${
                  !input.trim() && !attachedFile
                    ? 'bg-(--ms-border) text-(--ms-text-muted) cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95 shadow-purple-900/30'
                }`}
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </div>

        <p className="text-[9px] text-center text-(--ms-text-muted) opacity-40 uppercase tracking-[0.15em]">
          MotionSlide Agent · {activeModel.provider === 'ollama' ? '🟢 Local' : '☁ Cloud'} · {activeModel.label}
        </p>
      </form>
    </div>
  )
}
