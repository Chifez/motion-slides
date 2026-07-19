import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { generateSlides } from '@/lib/generateClient'
import { getCanvasDimensions } from '@motionslides/shared'

export function useAIGeneration() {
  const setGenerating = useEditorStore(s => s.setGenerating)
  const setPendingSlides = useEditorStore(s => s.setPendingSlides)
  
  const addChatMessage = useEditorStore(s => s.addChatMessage)
  const updateChatMessage = useEditorStore(s => s.updateChatMessage)
  
  const [progress, setProgress] = useState<{ percent: number; message: string }>({ percent: 0, message: '' })
  const [requiresRecalc, setRequiresRecalc] = useState(false)
  const [lastOptions, setLastOptions] = useState<any>(null)

  const handleGenerate = async (opts: any) => {
    setLastOptions(opts)
    setGenerating(true)
    setProgress({ percent: 0, message: 'Starting…' })

    addChatMessage({ role: 'user', content: opts.prompt || opts.refinementPrompt || 'Generate slides' })
    const assistantMsgId = addChatMessage({ role: 'assistant', content: '', progress: { stage: 'preparing', percent: 0, message: 'Starting...' } })

    const { playbackSettings } = useEditorStore.getState()
    const { width, height } = getCanvasDimensions(playbackSettings.aspectRatio)

    await generateSlides({
      ...opts,
      canvasWidth: width,
      canvasHeight: height,
    }, (ev) => {
      setProgress({ percent: ev.percent, message: ev.message })
      updateChatMessage(assistantMsgId, { progress: { stage: ev.stage as any, percent: ev.percent, message: ev.message } })

      if (ev.stage === 'done' && ev.slides) {
        setPendingSlides(ev.slides as any, ev.title, ev.rawPresentation)
        updateChatMessage(assistantMsgId, { 
          progress: undefined,
          slides: ev.slides as any, 
          content: 'Here is a draft based on your request. You can refine it or import it into your project.' 
        })
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
