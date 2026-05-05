import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { AIReadmeInput } from './AIReadmeInput'
import { AIArchInput } from './AIArchInput'
import { GenerationPreview } from './GenerationPreview'
import { useAIGeneration } from '@/hooks/useAIGeneration'

import { AIChatHeader } from './ai/AIChatHeader'
import { AIGeneratingView } from './ai/AIGeneratingView'
import { AIModeSelect } from './ai/AIModeSelect'

type Tab = 'mode-select' | 'readme' | 'architecture' | 'chat'

export function AIChat() {
  const isChatOpen = useEditorStore(s => s.isChatOpen)
  const setChatOpen = useEditorStore(s => s.setChatOpen)
  const isGenerating = useEditorStore(s => s.isGenerating)
  const pendingSlides = useEditorStore(s => s.pendingSlides)
  const pendingTitle = useEditorStore(s => s.pendingTitle)
  const clearPending = useEditorStore(s => s.clearPending)
  const addSlidesToProject = useEditorStore(s => s.addSlidesToProject)
  const activeProjectId = useEditorStore(s => s.activeProjectId)

  const [activeTab, setActiveTab] = useState<Tab>('mode-select')
  
  const { 
    progress, 
    requiresRecalc, 
    handleGenerate, 
    handleRefine,
    setRequiresRecalc 
  } = useAIGeneration()

  if (!isChatOpen) return null

  const handleImport = () => {
    if (pendingSlides && activeProjectId) {
      addSlidesToProject(activeProjectId, pendingSlides)
      if (requiresRecalc) {
        useEditorStore.getState().recalculateLines()
      }
      setChatOpen(false)
      clearPending()
      setRequiresRecalc(false)
      setActiveTab('mode-select')
    }
  }

  const handleReject = () => clearPending()

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-14 right-0 bottom-0 w-[380px] bg-(--ms-bg-base) border-l border-(--ms-border) z-60 shadow-2xl flex flex-col transition-colors"
    >
      <AIChatHeader onClose={() => setChatOpen(false)} />

      <div className="flex-1 overflow-y-auto">
        {isGenerating ? (
          <AIGeneratingView progress={progress} />
        ) : pendingSlides ? (
          <GenerationPreview
            slides={pendingSlides}
            title={pendingTitle}
            onAccept={handleImport}
            onReject={handleReject}
            onRefine={handleRefine}
          />
        ) : (
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'mode-select' && (
                <AIModeSelect onSelectTab={(tab) => setActiveTab(tab)} />
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

      <div className="p-4 bg-(--ms-bg-elevated) border-t border-(--ms-border)">
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
