import { useRef, useState, type FormEvent, type ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Square, Mic, ChevronDown, BrainCircuit, Bot, Cpu } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { transcribeAudioAction } from '@/lib/actions/ai-studio'

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

export function AgentInput({ input, isLoading, selectedModel, onInputChange, onSubmit, onStop }: Props) {
  const setSelectedModel = useEditorStore((s) => s.setSelectedModel)
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const activeModel = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0]
  const ActiveIcon = activeModel.icon

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

  return (
    <div className="shrink-0 border-t border-(--ms-border) p-3 space-y-2 bg-(--ms-bg-base)">
      <form onSubmit={onSubmit}>
        <div className="relative bg-(--ms-bg-elevated) border border-(--ms-border) rounded-2xl focus-within:border-purple-500/50 transition-colors shadow-lg">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to create slides, add animations, set transitions…"
            rows={3}
            className="w-full bg-transparent border-none p-3.5 text-sm text-(--ms-text-primary) placeholder-(--ms-text-muted) resize-none focus:outline-none scrollbar-hide font-medium leading-relaxed"
            disabled={isLoading}
          />

          <div className="flex items-center justify-between p-2 pt-0 border-t border-(--ms-border)/30">
            {/* Left: model selector + mic */}
            <div className="flex items-center gap-1">
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
                disabled={!input.trim()}
                className={`p-2 rounded-xl transition cursor-pointer border-none shadow-lg ${
                  !input.trim()
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
