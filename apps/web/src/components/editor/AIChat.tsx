import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { GenerationPreview } from './GenerationPreview'
import { useAIGeneration } from '@/hooks/useAIGeneration'

import { AIChatHeader } from './ai/AIChatHeader'
import { AIGeneratingView } from './ai/AIGeneratingView'
import { AIStudio } from './ai/AIStudio'
import { Panel } from '@/components/ui/core/Panel'

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

  const chatMessages = useEditorStore(s => s.chatMessages)

  const { 
    progress, 
    handleGenerate, 
    handleRefine,
  } = useAIGeneration()

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
    <Panel.Root 
      open={isChatOpen} 
      onOpenChange={(open) => { if (open !== isChatOpen) setChatOpen(false) }} 
      side="right"
    >
      <Panel.Portal>
        <Panel.Content width="w-[400px]" containerClassName="top-14 flex flex-col h-[calc(100vh-3.5rem)]">
          <AIChatHeader onClose={() => setChatOpen(false)} />

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center pt-12 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center mb-4 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                  <Sparkles className="text-blue-400" size={24} />
                </div>
                <h3 className="text-sm font-bold text-(--ms-text-primary) mb-2">AI Studio</h3>
                <p className="text-[11px] text-(--ms-text-muted) leading-relaxed max-w-[220px]">
                  Enter a topic, describe a system, or attach a README to generate professional slides instantly.
                </p>
              </motion.div>
            ) : (
              chatMessages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[95%] rounded-xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-(--ms-bg-elevated) text-(--ms-text-primary) border border-(--ms-border)'}`}>
                    {msg.content && <div className={msg.slides || msg.progress ? "mb-4" : ""}>{msg.content}</div>}
                    
                    {msg.progress && (
                      <div className="w-full min-h-[100px] relative rounded-lg overflow-hidden border border-(--ms-border)">
                        <AIGeneratingView progress={msg.progress} />
                      </div>
                    )}
                    
                    {msg.slides && (
                      <div className="w-full min-h-[220px] relative rounded-lg overflow-hidden border border-(--ms-border) bg-black/20">
                        <GenerationPreview
                          slides={msg.slides}
                          title={pendingTitle}
                          onAccept={handleImport}
                          onReject={handleReject}
                          onRefine={handleRefine}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="shrink-0">
            <AnimatePresence>
              {pendingSlides && !isGenerating && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 border-t border-(--ms-border) bg-blue-600/5 flex flex-wrap gap-2"
                >
                  {MAGIC_PILLS.map((pill) => {
                    const Icon = pill.icon
                    return (
                      <button
                        key={pill.id}
                        onClick={() => handleRefine(pill.instruction)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-(--ms-bg-elevated) border border-(--ms-border) hover:border-blue-500/50 hover:text-blue-400 text-[10px] font-bold text-(--ms-text-secondary) transition cursor-pointer shadow-sm"
                      >
                        <Icon size={12} />
                        {pill.label}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <AIStudio 
              isGenerating={isGenerating} 
              hasPending={!!pendingSlides}
              onGenerate={onGenerate} 
              onRefine={handleRefine}
            />
          </div>
        </Panel.Content>
      </Panel.Portal>
    </Panel.Root>
  )
}
