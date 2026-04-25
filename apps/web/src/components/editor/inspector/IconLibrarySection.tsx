import { useState } from 'react'
import { Search, X, Cloud, Globe } from 'lucide-react'
import { useIconLibrary } from '@/hooks/useIconLibrary'
import type { ShapeContent } from '@motionslides/shared'

interface Props {
  content: ShapeContent
  onUpdate: (content: ShapeContent) => void
}

type Provider = 'aws' | 'gcp'

export function IconLibrarySection({ content, onUpdate }: Props) {
  const [query, setQuery] = useState('')
  const [provider, setProvider] = useState<Provider>(content.shapeType === 'gcp-icon' ? 'gcp' : 'aws')
  const { loading, searchIcons, error } = useIconLibrary(provider)
  const results = searchIcons(query)

  if (loading) return <div className="text-[10px] text-neutral-500 py-4 text-center">Loading {provider.toUpperCase()} icons…</div>

  return (
    <div className="space-y-3">
      {/* Provider Toggle */}
      <div className="flex bg-[#1c1c1c] p-0.5 rounded-md border border-white/8">
        <button
          onClick={() => setProvider('aws')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-[10px] font-medium transition-all border-none cursor-pointer ${provider === 'aws' ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-neutral-500 hover:text-neutral-300'}`}
        >
          AWS
        </button>
        <button
          onClick={() => setProvider('gcp')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-[10px] font-medium transition-all border-none cursor-pointer ${provider === 'gcp' ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-neutral-500 hover:text-neutral-300'}`}
        >
          GCP
        </button>
      </div>

      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`Search ${provider.toUpperCase()} icons…`}
          className="w-full bg-[#1c1c1c] border border-white/8 rounded-md pl-8 pr-2 py-1.5 text-[11px] text-neutral-100 placeholder-neutral-700 focus:outline-none focus:border-blue-500"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white border-none bg-transparent cursor-pointer"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-9 gap-1.5 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
        {results.slice(0, 150).map(icon => (
          <button
            key={icon.path}
            onClick={() => onUpdate({
              ...content,
              iconPath: icon.path,
              iconCategory: icon.category,
              iconLabel: icon.label,
              // Auto-fill label if empty
              label: content.label || icon.label
            })}
            title={icon.label}
            className={`aspect-square p-1 rounded-md border transition-all cursor-pointer bg-transparent ${content.iconPath === icon.path ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 hover:border-white/20 hover:bg-white/5'}`}
          >
            <img src={`/${icon.path}`} alt={icon.label} className="w-full h-full object-contain pointer-events-none" />
          </button>
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-[10px] text-neutral-500 py-4 text-center">No icons found for "{query}"</div>
      )}

      {content.iconLabel && (
        <div className="flex items-center gap-2 p-2 bg-blue-500/5 border border-blue-500/20 rounded-md">
          <div className="w-6 h-6 shrink-0">
            <img src={`/${content.iconPath}`} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium text-blue-300 truncate">{content.iconLabel}</div>
            <div className="text-[8px] text-blue-500 truncate">{content.iconCategory}</div>
          </div>
        </div>
      )}
    </div>
  )
}
