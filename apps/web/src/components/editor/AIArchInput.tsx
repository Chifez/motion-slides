import { useState } from 'react'

interface Props {
  onGenerate: (opts: { description: string; slideCount: number; diagramStyle: string; theme: string }) => void
  onBack:     () => void
}

export function AIArchInput({ onGenerate, onBack }: Props) {
  const [description,  setDescription]  = useState('')
  const [diagramStyle, setDiagramStyle] = useState('aws')
  const [slideCount,   setSlideCount]   = useState(6)

  const examples = [
    { label: 'E-commerce System', value: 'User buys items via Next.js frontend -> API Gateway -> Lambda -> DynamoDB' },
    { label: 'Data Pipeline',      value: 'S3 Event -> SQS Queue -> Python Worker -> Snowflake Warehouse' },
  ]

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-(--ms-text-muted) hover:text-(--ms-text-primary) flex items-center gap-1 border-none bg-transparent cursor-pointer transition-colors">
        ← Back
      </button>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-(--ms-text-muted)">Describe your system</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. A serverless web app that uses Lambda and S3…"
          className="w-full h-36 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-lg p-3 text-xs text-(--ms-text-primary) placeholder-(--ms-text-muted) resize-none focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Examples */}
      <div className="flex flex-wrap gap-2">
        {examples.map(ex => (
          <button
            key={ex.label}
            onClick={() => setDescription(ex.value)}
            className="text-[10px] px-2 py-1 bg-(--ms-bg-elevated) hover:bg-(--ms-border) text-(--ms-text-secondary) hover:text-(--ms-text-primary) rounded border border-(--ms-border) transition-colors cursor-pointer"
          >
            + {ex.label}
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-(--ms-text-muted) mb-1.5">Icon Set</label>
          <select
            value={diagramStyle}
            onChange={e => setDiagramStyle(e.target.value)}
            className="w-full bg-(--ms-bg-elevated) border border-(--ms-border) rounded-lg px-2 py-1.5 text-xs text-(--ms-text-primary) focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="aws">AWS architecture</option>
            <option value="generic">Generic shapes</option>
            <option value="minimal">Minimalist</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-(--ms-text-muted) mb-1.5">
            Slides: {slideCount}
          </label>
          <input
            type="range" min={3} max={12} value={slideCount}
            onChange={e => setSlideCount(Number(e.target.value))}
            className="w-full mt-1 bg-(--ms-bg-elevated) rounded-lg h-1 appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      <button
        onClick={() => onGenerate({ description, slideCount, diagramStyle, theme: 'dark' })}
        disabled={!description.trim()}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-(--ms-border) disabled:text-(--ms-text-muted) disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer border-none"
      >
        Generate Architecture
      </button>
    </div>
  )
}
