import { useState, useRef } from 'react'

interface Props {
  onGenerate: (opts: { markdown: string; slideCount: number; style: string; theme: string }) => void
  onBack:     () => void
}

export function AIReadmeInput({ onGenerate, onBack }: Props) {
  const [markdown,   setMarkdown]   = useState('')
  const [style,      setStyle]      = useState('technical')
  const [slideCount, setSlideCount] = useState(10)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setMarkdown(ev.target?.result as string ?? '')
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.name.match(/\.(md|txt|markdown)$/i)) return
    const reader = new FileReader()
    reader.onload = (ev) => setMarkdown(ev.target?.result as string ?? '')
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 border-none bg-transparent cursor-pointer">
        ← Back
      </button>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-neutral-700 hover:border-blue-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors"
      >
        <div className="text-2xl mb-2">📁</div>
        <div className="text-xs text-neutral-400">
          {markdown
            ? <span className="text-green-400">✓ File loaded — drag to replace</span>
            : 'Drop .md file here or click to browse'}
        </div>
      </div>
      <input ref={fileRef} type="file" accept=".md,.txt,.markdown" onChange={handleFile} className="hidden" />

      {/* Paste area */}
      <textarea
        value={markdown}
        onChange={e => setMarkdown(e.target.value)}
        placeholder="Or paste markdown here…"
        className="w-full h-32 bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-xs text-neutral-200 font-mono resize-none focus:outline-none focus:border-blue-500"
      />

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">Style</label>
          <select
            value={style}
            onChange={e => setStyle(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white"
          >
            <option value="technical">Technical</option>
            <option value="tutorial">Tutorial</option>
            <option value="executive">Executive</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">
            Slides: {slideCount}
          </label>
          <input
            type="range" min={4} max={20} value={slideCount}
            onChange={e => setSlideCount(Number(e.target.value))}
            className="w-full mt-1"
          />
        </div>
      </div>

      <button
        onClick={() => onGenerate({ markdown, slideCount, style, theme: 'dark' })}
        disabled={!markdown.trim()}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer border-none"
      >
        Generate Slides
      </button>
    </div>
  )
}
