import { Code, Image as ImageIcon, Copy, Check } from 'lucide-react'

interface CodeOutputPanelProps {
  activeTab: 'iframe' | 'markdown'
  setActiveTab: (tab: 'iframe' | 'markdown') => void
  copied: boolean
  handleCopy: () => void
  iframeCode: string
  markdownCode: string
}

export function CodeOutputPanel({
  activeTab,
  setActiveTab,
  copied,
  handleCopy,
  iframeCode,
  markdownCode
}: CodeOutputPanelProps) {
  const codeToDisplay = activeTab === 'iframe' ? iframeCode : markdownCode

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex border-b border-(--ms-border) gap-4">
        <button
          onClick={() => { setActiveTab('iframe') }}
          className={`pb-2.5 text-xs font-semibold border-b-2 bg-transparent border-none cursor-pointer transition flex items-center gap-1.5 ${
            activeTab === 'iframe'
              ? 'border-blue-600 text-blue-500'
              : 'border-transparent text-(--ms-text-muted) hover:text-(--ms-text-secondary)'
          }`}
        >
          <Code size={14} />
          <span>Iframe Embed</span>
        </button>
        <button
          onClick={() => { setActiveTab('markdown') }}
          className={`pb-2.5 text-xs font-semibold border-b-2 bg-transparent border-none cursor-pointer transition flex items-center gap-1.5 ${
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
          {codeToDisplay}
        </pre>
        <button
          onClick={handleCopy}
          className={`absolute top-2 right-2 p-2 rounded-lg border-none flex items-center justify-center cursor-pointer transition shadow-md ${
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
  )
}
