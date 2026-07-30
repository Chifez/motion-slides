import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, Settings } from 'lucide-react'
import type { Project } from '@motionslides/shared'
import { useEmbedCode } from '@/hooks/useEmbedCode'
import { ThemeSelector } from './ThemeSelector'
import { EmbedToggle } from './EmbedToggle'
import { CodeOutputPanel } from './CodeOutputPanel'
import { EmbedContainer } from './EmbedContainer'

interface Props {
  isOpen: boolean
  onClose: () => void
  project: Project
}

export function EmbedCodeModal({ isOpen, onClose, project }: Props) {
  const [embedTheme, setEmbedTheme] = useState<'dark' | 'light'>('dark')
  const [autoplay, setAutoplay] = useState(true)
  const [loop, setLoop] = useState(true)
  const [controls, setControls] = useState(true)

  const {
    activeTab,
    setActiveTab,
    copied,
    handleCopy,
    iframeCode,
    markdownCode
  } = useEmbedCode({
    project,
    embedTheme,
    autoplay,
    loop,
    controls
  })

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-(--ms-bg-elevated) border border-(--ms-border) rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-(--ms-border)">
            <div>
              <h3 className="text-base font-bold text-(--ms-text-primary)">Embed Presentation</h3>
              <p className="text-[11px] text-(--ms-text-muted) mt-0.5">Configure and copy code blocks to share your slide deck.</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-white/5 transition cursor-pointer border-none bg-transparent"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Left Config Panel */}
              <div className="md:col-span-2 space-y-5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-(--ms-text-muted)">
                  <Settings size={12} />
                  <span>Configurations</span>
                </div>

                {/* Theme Selector */}
                <ThemeSelector theme={embedTheme} onChange={setEmbedTheme} />

                {/* Toggles */}
                <div className="space-y-3 bg-(--ms-bg-base)/65 p-4 rounded-xl border border-(--ms-border)/80">
                  <EmbedToggle
                    label="Autoplay slides"
                    description="Automatically transition slides"
                    checked={autoplay}
                    onChange={setAutoplay}
                  />
                  <EmbedToggle
                    label="Loop slideshow"
                    description="Restart after the final slide"
                    checked={loop}
                    onChange={setLoop}
                  />
                  <EmbedToggle
                    label="Show player controls"
                    description="Display bottoms chevrons & Play/Pause"
                    checked={controls}
                    onChange={setControls}
                  />
                </div>
              </div>

              {/* Right Live Preview Panel */}
              <div className="md:col-span-3 space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-(--ms-text-muted)">
                  <Eye size={12} />
                  <span>Live Preview</span>
                </div>
                <div className={`aspect-video w-full rounded-xl overflow-hidden shadow-lg border relative flex items-center justify-center ${
                  embedTheme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-black border-zinc-900'
                }`}>
                  <EmbedContainer
                    project={project}
                    isPreview={true}
                    previewSettings={{
                      theme: embedTheme,
                      autoplay,
                      loop,
                      controls
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Code Output Panel */}
            <CodeOutputPanel
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              copied={copied}
              handleCopy={handleCopy}
              iframeCode={iframeCode}
              markdownCode={markdownCode}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
