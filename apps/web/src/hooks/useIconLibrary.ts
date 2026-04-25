import { useState, useEffect, useMemo } from 'react'

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

const cache: Record<string, IconManifest> = {}

export function useIconLibrary(provider: 'aws' | 'gcp' = 'aws') {
  const [manifest, setManifest] = useState<IconManifest | null>(cache[provider] || null)
  const [loading,  setLoading]  = useState(!cache[provider])
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    if (cache[provider]) {
      setManifest(cache[provider])
      setLoading(false)
      return
    }

    setLoading(true)
    fetch(`/icons/${provider}/manifest.json`)
      .then(res => {
        if (!res.ok) throw new Error(`${provider} manifest not found`)
        return res.json()
      })
      .then(data => {
        cache[provider] = data
        setManifest(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('[useIconLibrary]', err)
        setError(err.message)
        setLoading(false)
      })
  }, [provider])

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

  return { manifest, loading, error, flatIcons, searchIcons }
}
