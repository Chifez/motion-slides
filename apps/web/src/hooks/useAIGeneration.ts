import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { generateSlides } from '@/lib/generateClient'

export function useAIGeneration() {
  const setGenerating = useEditorStore(s => s.setGenerating)
  const setPendingSlides = useEditorStore(s => s.setPendingSlides)
  
  const [progress, setProgress] = useState<{ percent: number; message: string }>({ percent: 0, message: '' })
  const [requiresRecalc, setRequiresRecalc] = useState(false)
  const [lastOptions, setLastOptions] = useState<any>(null)

  const handleGenerate = async (opts: any) => {
    setLastOptions(opts)
    setGenerating(true)
    setProgress({ percent: 0, message: 'Starting…' })

    await generateSlides(opts, (ev) => {
      setProgress({ percent: ev.percent, message: ev.message })
      if (ev.stage === 'done' && ev.slides) {
        setPendingSlides(ev.slides as any, ev.title, ev.rawPresentation)
        if (ev.requiresLineRecalc) setRequiresRecalc(true)
      }
    })

    setGenerating(false)
  }

  const handleRefine = async (prompt: string) => {
    const raw = useEditorStore.getState().pendingRawPresentation
    if (!raw || !lastOptions) return

    await handleGenerate({
      ...lastOptions,
      refinementPrompt: prompt,
      previousPresentation: raw
    })
  }

  return {
    progress,
    requiresRecalc,
    handleGenerate,
    handleRefine,
    setRequiresRecalc
  }
}
