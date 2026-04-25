import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, MessageSquare, BookOpen, Layers, Loader2 } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { AIReadmeInput } from './AIReadmeInput'
import { AIArchInput } from './AIArchInput'
import { GenerationPreview } from './GenerationPreview'
import { generateSlides } from '@/lib/generateClient'


type Tab = 'mode-select' | 'readme' | 'architecture' | 'chat'

export function AIChat() {
  const {
    isChatOpen, setChatOpen, isGenerating, setGenerating,
    pendingSlides, pendingTitle, setPendingSlides, clearPending,
    addSlidesToProject, activeProjectId, recalculateLines
  } = useEditorStore()

  const [activeTab, setActiveTab] = useState<Tab>('mode-select')
  const [progress, setProgress] = useState<{ percent: number; message: string }>({ percent: 0, message: '' })
  const [requiresRecalc, setRequiresRecalc] = useState(false)

  if (!isChatOpen) return null

  const handleGenerate = async (opts: any) => {
    setGenerating(true)
    setProgress({ percent: 0, message: 'Starting…' })

    const result = await generateSlides(opts, (ev) => {
      setProgress({ percent: ev.percent, message: ev.message })
      if (ev.stage === 'done' && ev.slides) {
        setPendingSlides(ev.slides as any, ev.title)
        if (ev.requiresLineRecalc) setRequiresRecalc(true)
      }
    })

    setGenerating(false)
  }

  const handleImport = () => {
    if (pendingSlides && activeProjectId) {
      addSlidesToProject(activeProjectId, pendingSlides)
      if (requiresRecalc) {
        // Wait for slides to be added to state before recalculating
        setTimeout(() => recalculateLines(), 50)
      }
      setChatOpen(false)
      clearPending()
      setRequiresRecalc(false)
      setActiveTab('mode-select')
    }
  }

  const handleReject = () => {
    clearPending()
  }

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-14 right-0 bottom-0 w-[380px] bg-[#161616] border-l border-white/8 z-60 shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400">
            <Sparkles size={16} />
          </div>
          <span className="text-sm font-semibold text-neutral-100">AI Designer</span>
        </div>
        <button
          onClick={() => setChatOpen(false)}
          className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-100 hover:bg-white/6 transition-colors border-none bg-transparent cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isGenerating ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="relative">
              <Loader2 className="animate-spin text-blue-500" size={48} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={16} className="text-purple-400 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Generating Slides</h3>
              <p className="text-xs text-neutral-400 max-w-[200px] leading-relaxed">
                {progress.message}
              </p>
            </div>
            <div className="w-full max-w-[240px] h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        ) : pendingSlides ? (
          <GenerationPreview
            slides={pendingSlides}
            title={pendingTitle}
            onAccept={handleImport}
            onReject={handleReject}
          />
        ) : (
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'mode-select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <header>
                    <h2 className="text-xl font-bold text-white mb-2">Magic Move Slides</h2>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Transform your documentation or ideas into stunning presentations using AI.
                    </p>
                  </header>

                  <div className="grid gap-3 pt-2">
                    <ModeCard
                      icon={<BookOpen size={20} />}
                      title="From README"
                      description="Paste or upload a Markdown file to generate project slides."
                      onClick={() => setActiveTab('readme')}
                      color="blue"
                    />
                    <ModeCard
                      icon={<Layers size={20} />}
                      title="Architecture Walkthrough"
                      description="Describe your system and generate a multi-slide diagram."
                      onClick={() => setActiveTab('architecture')}
                      color="purple"
                    />
                    <ModeCard
                      icon={<MessageSquare size={20} />}
                      title="Free Prompt (Coming soon)"
                      description="Describe what you want to see and the AI will build it."
                      onClick={() => { }}
                      color="neutral"
                      disabled
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'readme' && (
                <motion.div
                  key="readme"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <AIReadmeInput
                    onGenerate={(opts) => handleGenerate({ mode: 'readme', ...opts })}
                    onBack={() => setActiveTab('mode-select')}
                  />
                </motion.div>
              )}

              {activeTab === 'architecture' && (
                <motion.div
                  key="arch"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <AIArchInput
                    onGenerate={(opts) => handleGenerate({ mode: 'architecture', ...opts })}
                    onBack={() => setActiveTab('mode-select')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer / Tip */}
      <div className="p-4 bg-white/2 border-t border-white/5">
        <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="p-1 bg-blue-500/20 rounded">
            <Sparkles size={12} className="text-blue-400" />
          </div>
          <p className="text-[10px] leading-relaxed text-blue-300/80">
            <strong>Pro Tip:</strong> AI-generated diagrams use Magic Move automatically. Ensure component names match across descriptions for best results.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function ModeCard({ icon, title, description, onClick, color, disabled }: any) {
  const colors: any = {
    blue: 'hover:border-blue-500/40 hover:bg-blue-500/5 text-blue-400',
    purple: 'hover:border-purple-500/40 hover:bg-purple-500/5 text-purple-400',
    neutral: 'opacity-50 cursor-not-allowed',
  }

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border border-white/8 bg-white/4 transition-all group border-none cursor-pointer ${colors[color] || ''}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-black/20 group-hover:bg-black/40 transition-colors">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
      </div>
      <p className="text-[11px] text-neutral-500 group-hover:text-neutral-400 leading-relaxed">
        {description}
      </p>
    </button>
  )
}
