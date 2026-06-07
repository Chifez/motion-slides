import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { GenerationPreview } from './GenerationPreview'
import { useAIGeneration } from '@/hooks/useAIGeneration'

import { AIChatHeader } from './ai/AIChatHeader'
import { AIGeneratingView } from './ai/AIGeneratingView'
import { AIStudio } from './ai/AIStudio'

import { Briefcase, Wrench, LayoutGrid, Cloud } from 'lucide-react'

const MAGIC_PILLS = [
  { id: 'executive', label: 'Executive', icon: Briefcase, instruction: 'Simplify this for an executive summary. Focus on high-level flow, use professional terminology, and remove technical details like ports or protocols.' },
  { id: 'technical', label: 'Engineer', icon: Wrench, instruction: 'Add deep technical details. Include port numbers, specific protocol labels, and break down systems into their component microservices.' },
  { id: 'blueprint', label: 'Blueprint', icon: LayoutGrid, instruction: 'Re-skin this as a technical blueprint. Use monospaced fonts, grid backgrounds, and a high-contrast structural look.' },
  { id: 'aws', label: 'AWS Reskin', icon: Cloud, instruction: 'Re-map all icons to the official AWS 2026 icon set. Ensure every service has its correct architectural icon.' },
]

export function AIChat() {
  const isChatOpen = useEditorStore(s => s.isChatOpen)
  const setChatOpen = useEditorStore(s => s.setChatOpen)
  const isGenerating = useEditorStore(s => s.isGenerating)
  const pendingSlides = useEditorStore(s => s.pendingSlides)
  const pendingTitle = useEditorStore(s => s.pendingTitle)
  const clearPending = useEditorStore(s => s.clearPending)
  const addSlidesToProject = useEditorStore(s => s.addSlidesToProject)
  const activeProjectId = useEditorStore(s => s.activeProjectId)

  const { 
    progress, 
    handleGenerate, 
    handleRefine,
  } = useAIGeneration()

  if (!isChatOpen) return null

  const handleImport = () => {
    if (pendingSlides && activeProjectId) {
      addSlidesToProject(activeProjectId, pendingSlides)
      setChatOpen(false)
      clearPending()
    }
  }

  const handleReject = () => clearPending()

  const onGenerate = (opts: { prompt: string; slideCount: number; model: string }) => {
    const isReadme = opts.prompt.includes('#') || opts.prompt.length > 500
    
    handleGenerate({
      mode: isReadme ? 'readme' : 'architecture',
      description: opts.prompt,
      markdown:    opts.prompt,
      slideCount:  opts.slideCount,
      style:       'technical',
      diagramStyle: 'aws',
      theme:       'dark',
      model:       opts.model
    })
  }

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-14 right-0 bottom-0 w-[400px] bg-(--ms-bg-base) border-l border-(--ms-border) z-60 shadow-2xl flex flex-col transition-colors"
    >
      <AIChatHeader onClose={() => setChatOpen(false)} />

      <div className="h-[40%] border-b border-(--ms-border) bg-black/10 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10"
            >
              <AIGeneratingView progress={progress} />
            </motion.div>
          ) : pendingSlides ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10"
            >
              <GenerationPreview
                slides={pendingSlides}
                title={pendingTitle}
                onAccept={handleImport}
                onReject={handleReject}
                onRefine={handleRefine}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center mb-4 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                <Sparkles className="text-blue-400" size={24} />
              </div>
              <h3 className="text-sm font-bold text-(--ms-text-primary) mb-2">AI Studio</h3>
              <p className="text-[11px] text-(--ms-text-muted) leading-relaxed max-w-[220px]">
                Enter a topic, describe a system, or attach a README to generate professional slides instantly.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {pendingSlides && !isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 border-b border-(--ms-border) bg-blue-600/5 flex flex-wrap gap-2"
          >
            {MAGIC_PILLS.map((pill) => {
              const Icon = pill.icon
              return (
                <button
                  key={pill.id}
                  onClick={() => handleRefine(pill.instruction)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-(--ms-bg-elevated) border border-(--ms-border) hover:border-blue-500/50 hover:text-blue-400 text-[10px] font-bold text-(--ms-text-secondary) transition-all cursor-pointer shadow-sm"
                >
                  <Icon size={12} />
                  {pill.label}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto">
        <AIStudio 
          isGenerating={isGenerating} 
          hasPending={!!pendingSlides}
          onGenerate={onGenerate} 
          onRefine={handleRefine}
        />
      </div>
    </motion.div>
  )
}
