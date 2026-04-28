import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

export interface IconResource {
  id:       string
  label:    string
  path:     string
  category: string
  keywords: string[]
}

export interface IconCategory {
  id:     string
  label:  string
  icons:  IconResource[]
}

export interface IconManifest {
  version:     number
  generatedAt: string
  totalIcons:  number
  categories:  IconCategory[]
}

export function useIconLibrary(provider: 'aws' | 'gcp' = 'aws') {
  const { data: manifest, isLoading: loading, error } = useQuery<IconManifest>({
    queryKey: ['icons', provider],
    queryFn: async () => {
      const res = await fetch(`/icons/${provider}/manifest.json`)
      if (!res.ok) throw new Error(`${provider} manifest not found`)
      return res.json()
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  })

  const flatIcons = useMemo(() => {
    if (!manifest) return []
    return manifest.categories.flatMap(c => c.icons)
  }, [manifest])

  const searchIcons = (query: string) => {
    const q = query.toLowerCase().trim()
    if (!q) return flatIcons
    return flatIcons.filter(icon => 
      icon.label.toLowerCase().includes(q) || 
      icon.keywords.some(k => k.includes(q)) ||
      icon.category.includes(q)
    )
  }

  return { manifest, loading, error: error instanceof Error ? error.message : null, flatIcons, searchIcons }
}
