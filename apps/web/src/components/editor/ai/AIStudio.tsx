import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Bot, BrainCircuit, Sparkles, ChevronDown, Mic } from 'lucide-react'
import { transcribeAudioAction } from '@/lib/actions/ai-studio'

interface Props {
  isGenerating: boolean
  hasPending:   boolean
  onGenerate:   (opts: { prompt: string; slideCount: number; model: string }) => void
  onRefine:     (instruction: string) => void
}

export function AIStudio({ isGenerating, hasPending, onGenerate, onRefine }: Props) {
  const [prompt, setPrompt] = useState('')
  const [slideCount, setSlideCount] = useState(8)
  const [model, setModel] = useState('gpt-4o')
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setShowModelMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSend = () => {
    if (!prompt.trim() || isGenerating) return
    
    if (hasPending) {
      onRefine(prompt)
    } else {
      onGenerate({ prompt, slideCount, model })
    }
    
    setPrompt('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPrompt(ev.target?.result as string ?? '')
      textareaRef.current?.focus()
    }
    reader.readAsText(file)
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
             setPrompt(prev => prev ? `${prev} ${text}` : text)
          }
        } catch (error) {
          console.error(error)
        }
        
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
    }
  }

  const models = [
    { id: 'gpt-4o', label: 'GPT-4o', icon: BrainCircuit, desc: 'Fast & Reliable' },
    { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', icon: Bot, desc: 'Superior Reasoning' },
  ]

  const ActiveModelIcon = models.find(m => m.id === model)?.icon || BrainCircuit

  return (
    <div className="p-4 space-y-4">
      <div className="relative bg-(--ms-bg-elevated) border border-(--ms-border) rounded-2xl transition focus-within:border-blue-500/60 shadow-xl group">
        <div className="absolute top-3 left-4 pointer-events-none opacity-20">
          <Sparkles size={16} className="text-blue-400" />
        </div>
        
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={hasPending ? "Refine this design..." : "What are we building today?"}
          className="w-full h-40 bg-transparent border-none p-4 pl-10 text-sm text-(--ms-text-primary) placeholder-(--ms-text-muted) resize-none focus:outline-none scrollbar-hide font-medium leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSend()
            }
          }}
        />

        <div className="flex items-center justify-between p-2 pt-0 gap-2 border-t border-(--ms-border)/30">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => fileRef.current?.click()}
              className="p-2 text-(--ms-text-muted) hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition cursor-pointer border-none bg-transparent"
              title="Attach context (README, specs)"
            >
              <Paperclip size={18} />
            </button>
            <input ref={fileRef} type="file" accept=".md,.txt" onChange={handleFileUpload} className="hidden" />

            <button 
              onClick={toggleRecording}
              className={`p-2 rounded-lg transition cursor-pointer border-none ${isRecording ? 'text-red-400 bg-red-500/10 animate-pulse' : 'text-(--ms-text-muted) hover:text-blue-400 hover:bg-blue-500/10 bg-transparent'}`}
              title="Record voice prompt"
            >
              <Mic size={18} />
            </button>

            <div className="w-px h-4 bg-(--ms-border)/50 mx-1" />

            <div className="relative" ref={modelMenuRef}>
              <button 
                onClick={() => setShowModelMenu(!showModelMenu)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition cursor-pointer text-[9px] font-black uppercase tracking-widest ${
                  showModelMenu ? 'bg-purple-600/10 border-purple-500/50 text-purple-400' : 'bg-transparent border-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
                }`}
              >
                <ActiveModelIcon size={12} />
                <span>{model === 'gpt-4o' ? 'GPT-4o' : 'Claude 3.5'}</span>
                <ChevronDown size={10} className={`transition-transform duration-200 ${showModelMenu ? 'rotate-180' : ''}`} />
              </button>

              {showModelMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl shadow-2xl z-50 overflow-hidden p-1">
                  {models.map((m) => {
                    const Icon = m.icon
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setModel(m.id)
                          setShowModelMenu(false)
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition cursor-pointer border-none ${
                          model === m.id ? 'bg-purple-600/10 text-purple-400' : 'bg-transparent text-(--ms-text-secondary) hover:bg-(--ms-border)/50'
                        }`}
                      >
                        <Icon size={18} />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{m.label}</span>
                          <span className="text-[10px] opacity-50">{m.desc}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!prompt.trim() || isGenerating}
            className={`p-2 rounded-xl transition cursor-pointer border-none shadow-lg ${
              isGenerating || !prompt.trim()
                ? 'bg-(--ms-border) text-(--ms-text-muted) cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95 hover:shadow-blue-500/25'
            }`}
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>

      {!hasPending && (
        <div className="px-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-(--ms-text-muted) uppercase tracking-[0.2em]">
              Slide Budget
            </span>
            <span className="text-xs font-bold text-blue-400">{slideCount}</span>
          </div>
          <input
            type="range" min={3} max={20} value={slideCount}
            onChange={(e) => setSlideCount(Number(e.target.value))}
            className="w-full h-1 bg-(--ms-border) rounded-full appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      )}

      <p className="text-[9px] text-center text-(--ms-text-muted) uppercase tracking-[0.2em] opacity-40">
        Designer Engine v3 • Powered by {model.toUpperCase()}
      </p>
    </div>
  )
}
