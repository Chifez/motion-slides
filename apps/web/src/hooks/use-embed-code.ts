import { useState } from 'react'
import type { Project } from '@motionslides/shared'

interface UseEmbedCodeParams {
  project: Project
  embedTheme: 'dark' | 'light'
  autoplay: boolean
  loop: boolean
  controls: boolean
}

export function useEmbedCode({
  project,
  embedTheme,
  autoplay,
  loop,
  controls
}: UseEmbedCodeParams) {
  const [activeTab, setActiveTab] = useState<'iframe' | 'markdown'>('iframe')
  const [copied, setCopied] = useState(false)

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

  return {
    activeTab,
    setActiveTab,
    copied,
    handleCopy,
    iframeCode,
    markdownCode,
    embedUrl
  }
}
