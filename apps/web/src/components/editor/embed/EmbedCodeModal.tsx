import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Code, Image as ImageIcon, Eye, Settings } from 'lucide-react'
import type { Project } from '@motionslides/shared'

interface Props {
  isOpen: boolean
  onClose: () => void
  project: Project
}

type TabType = 'iframe' | 'markdown'

export function EmbedCodeModal({ isOpen, onClose, project }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('iframe')
  const [embedTheme, setEmbedTheme] = useState<'dark' | 'light'>('dark')
  const [autoplay, setAutoplay] = useState(true)
  const [loop, setLoop] = useState(true)
  const [controls, setControls] = useState(true)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const embedUrl = `${origin}/embed/${project.id}?theme=${embedTheme}&autoplay=${autoplay}&loop=${loop}&controls=${controls}`
  const gifUrl = `${origin}/api/preview/${project.id}.gif`

  const iframeCode = `<iframe src="${embedUrl}" width="800" height="450" style="border: 1px solid ${
    embedTheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'
  }; border-radius: 12px; background: ${embedTheme === 'light' ? '#f4f4f5' : '#000000'};" allowfullscreen></iframe>`

  const markdownCode = `[![MotionSlides](${gifUrl})](${embedUrl})`

  const handleCopy = async () => {
    const textToCopy = activeTab === 'iframe' ? iframeCode : markdownCode
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard', err)
    }
  }

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
              className="p-1 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-white/5 transition-all cursor-pointer border-none bg-transparent"
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
                <div className="space-y-2">
                  <label className="text-xs text-(--ms-text-secondary) font-medium">Player Theme</label>
                  <div className="grid grid-cols-2 gap-2 bg-(--ms-bg-base) p-1 rounded-lg border border-(--ms-border)">
                    <button
                      onClick={() => setEmbedTheme('dark')}
                      className={`py-1.5 text-xs font-semibold rounded-md border-none cursor-pointer transition-all ${
                        embedTheme === 'dark'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-secondary)'
                      }`}
                    >
                      Dark Theme
                    </button>
                    <button
                      onClick={() => setEmbedTheme('light')}
                      className={`py-1.5 text-xs font-semibold rounded-md border-none cursor-pointer transition-all ${
                        embedTheme === 'light'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-secondary)'
                      }`}
                    >
                      Light Theme
                    </button>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3 bg-(--ms-bg-base)/65 p-4 rounded-xl border border-(--ms-border)/80">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-(--ms-text-primary) font-semibold">Autoplay slides</span>
                      <span className="text-[9px] text-(--ms-text-muted)">Automatically transition slides</span>
                    </div>
                    <button
                      onClick={() => setAutoplay(!autoplay)}
                      className={`relative w-8 h-4.5 rounded-full transition-colors border-none cursor-pointer ${
                        autoplay ? 'bg-blue-600' : 'bg-neutral-800'
                      }`}
                    >
                      <motion.div
                        animate={{ x: autoplay ? 16 : 2 }}
                        initial={false}
                        className="absolute top-0.5 left-0 w-3.5 h-3.5 bg-white rounded-full"
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-(--ms-text-primary) font-semibold">Loop slideshow</span>
                      <span className="text-[9px] text-(--ms-text-muted)">Restart after the final slide</span>
                    </div>
                    <button
                      onClick={() => setLoop(!loop)}
                      className={`relative w-8 h-4.5 rounded-full transition-colors border-none cursor-pointer ${
                        loop ? 'bg-blue-600' : 'bg-neutral-800'
                      }`}
                    >
                      <motion.div
                        animate={{ x: loop ? 16 : 2 }}
                        initial={false}
                        className="absolute top-0.5 left-0 w-3.5 h-3.5 bg-white rounded-full"
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-(--ms-text-primary) font-semibold">Show player controls</span>
                      <span className="text-[9px] text-(--ms-text-muted)">Display bottoms chevrons & Play/Pause</span>
                    </div>
                    <button
                      onClick={() => setControls(!controls)}
                      className={`relative w-8 h-4.5 rounded-full transition-colors border-none cursor-pointer ${
                        controls ? 'bg-blue-600' : 'bg-neutral-800'
                      }`}
                    >
                      <motion.div
                        animate={{ x: controls ? 16 : 2 }}
                        initial={false}
                        className="absolute top-0.5 left-0 w-3.5 h-3.5 bg-white rounded-full"
                      />
                    </button>
                  </div>
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
                  <iframe
                    key={embedUrl} // Forces re-render on settings changes
                    src={embedUrl}
                    className="w-full h-full border-none"
                    title="Presentation Embed Preview"
                  />
                </div>
              </div>
            </div>

            {/* Code Output Panel */}
            <div className="space-y-3">
              {/* Tabs */}
              <div className="flex border-b border-(--ms-border) gap-4">
                <button
                  onClick={() => { setActiveTab('iframe'); setCopied(false); }}
                  className={`pb-2.5 text-xs font-semibold border-b-2 bg-transparent border-none cursor-pointer transition-all flex items-center gap-1.5 ${
                    activeTab === 'iframe'
                      ? 'border-blue-600 text-blue-500'
                      : 'border-transparent text-(--ms-text-muted) hover:text-(--ms-text-secondary)'
                  }`}
                >
                  <Code size={14} />
                  <span>Iframe Embed</span>
                </button>
                <button
                  onClick={() => { setActiveTab('markdown'); setCopied(false); }}
                  className={`pb-2.5 text-xs font-semibold border-b-2 bg-transparent border-none cursor-pointer transition-all flex items-center gap-1.5 ${
                    activeTab === 'markdown'
                      ? 'border-blue-600 text-blue-500'
                      : 'border-transparent text-(--ms-text-muted) hover:text-(--ms-text-secondary)'
                  }`}
                >
                  <ImageIcon size={14} />
                  <span>Markdown Badge</span>
                </button>
              </div>

              {/* Code display window */}
              <div className="relative">
                <pre className="p-4 bg-(--ms-bg-base) border border-(--ms-border) rounded-xl font-mono text-[11px] leading-relaxed text-zinc-300 overflow-x-auto whitespace-pre-wrap select-all max-h-[100px]">
                  {activeTab === 'iframe' ? iframeCode : markdownCode}
                </pre>
                <button
                  onClick={handleCopy}
                  className={`absolute top-2 right-2 p-2 rounded-lg border-none flex items-center justify-center cursor-pointer transition-all shadow-md ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                  }`}
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-(--ms-text-muted) pl-1">
                {activeTab === 'iframe' 
                  ? 'Paste this HTML code in your website builder, blog, or slides portal.'
                  : 'Add this markdown to your GitHub README.md or project documentation pages. It displays an animated GIF preview of your deck.'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
